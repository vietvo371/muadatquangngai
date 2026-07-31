import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiPaginated, buildPaginationMeta } from '@/lib/api-response';
import { mapPropertyResource, type WardRow } from '@/lib/api-resources/property-resource';

/**
 * GET /api/v2/properties — port của PropertyController@index (Laravel).
 * Giai đoạn 1 (strangler): chạy song song tại /api/v2/*, xem scripts/diff-api.ts.
 */

const PROPERTY_INCLUDE = {
  provinces: { select: { id: true, name: true, slug: true } },
  districts: { select: { id: true, name: true, slug: true } },
  categories: { select: { id: true, name: true, slug: true, icon: true } },
  users: { select: { id: true, name: true, phone: true, avatar: true, role: true, rating: true, total_listings: true } },
  property_media: {
    select: { id: true, type: true, url: true, thumbnail: true, caption: true, is_primary: true, sort_order: true },
  },
} as const;

function vipRank(isVip: string): number {
  if (isVip === 'diamond') return 1;
  if (isVip === 'vip_plus') return 2;
  if (isVip === 'vip') return 3;
  return 4;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const province = searchParams.get('province');
  const district = searchParams.get('district');
  const priceMin = searchParams.get('price_min');
  const priceMax = searchParams.get('price_max');
  const bedroomsParam = searchParams.get('bedrooms');
  const sort = searchParams.get('sort') ?? 'newest';

  // Khung nhìn bản đồ (feedback: phóng to/kéo bản đồ → tìm tin trong khu vực đang xem). Chỉ
  // áp khi đủ 4 cạnh hợp lệ; tin thiếu toạ độ tự loại (latitude not null).
  const parseNum = (v: string | null) => (v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
  const minLat = parseNum(searchParams.get('min_lat'));
  const maxLat = parseNum(searchParams.get('max_lat'));
  const minLng = parseNum(searchParams.get('min_lng'));
  const maxLng = parseNum(searchParams.get('max_lng'));
  const hasBbox = minLat !== null && maxLat !== null && minLng !== null && maxLng !== null;

  const perPageParam = parseInt(searchParams.get('per_page') ?? '20', 10);
  const perPage = Math.min(Number.isFinite(perPageParam) && perPageParam > 0 ? perPageParam : 20, 100);
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const isNumeric = (v: string | null): v is string => v !== null && /^\d+$/.test(v);

  const where = {
    // scopeActive(): status active AND (expired_at null HOẶC còn hạn)
    status: 'active',
    OR: [{ expired_at: null }, { expired_at: { gt: new Date() } }],
    // scopePublished(): đã published + active — status đã ràng buộc ở trên nên chỉ cần thêm published_at
    published_at: { not: null },
    ...(type ? { type } : {}),
    ...(isNumeric(category) ? { category_id: BigInt(category) } : {}),
    ...(isNumeric(province) ? { province_id: BigInt(province) } : {}),
    ...(isNumeric(district) ? { district_id: BigInt(district) } : {}),
    ...(priceMin || priceMax
      ? { price: { ...(priceMin ? { gte: priceMin } : {}), ...(priceMax ? { lte: priceMax } : {}) } }
      : {}),
    ...(bedroomsParam && Number.isFinite(parseInt(bedroomsParam, 10))
      ? (() => {
          const bd = parseInt(bedroomsParam, 10);
          return { bedrooms: bd >= 4 ? { gte: 4 } : bd };
        })()
      : {}),
    ...(hasBbox
      ? {
          latitude: { not: null, gte: minLat as number, lte: maxLat as number },
          longitude: { not: null, gte: minLng as number, lte: maxLng as number },
        }
      : {}),
  };

  const total = await db.properties.count({ where });

  // Sort mặc định cần rank VIP (diamond>vip_plus>vip>normal) rồi tới published_at desc —
  // Prisma không hỗ trợ ORDER BY CASE WHEN qua query builder. Bảng properties ở quy mô
  // nhỏ (Phase 1) nên fetch toàn bộ kết quả đã lọc rồi sort+paginate ở JS; nếu bảng lớn
  // dần, chuyển sang $queryRaw với CASE WHEN native.
  let rows;
  if (sort === 'newest') {
    const all = await db.properties.findMany({ where, include: PROPERTY_INCLUDE });
    all.sort((a, b) => {
      const rankDiff = vipRank(a.is_vip) - vipRank(b.is_vip);
      if (rankDiff !== 0) return rankDiff;
      const at = a.published_at?.getTime() ?? 0;
      const bt = b.published_at?.getTime() ?? 0;
      return bt - at;
    });
    rows = all.slice((page - 1) * perPage, (page - 1) * perPage + perPage);
  } else {
    const orderBy =
      sort === 'oldest'
        ? { published_at: 'asc' as const }
        : sort === 'price_asc'
          ? { price: 'asc' as const }
          : sort === 'price_desc'
            ? { price: 'desc' as const }
            : sort === 'area_asc'
              ? { area: 'asc' as const }
              : sort === 'area_desc'
                ? { area: 'desc' as const }
                : sort === 'popular'
                  ? { view_count: 'desc' as const }
                  : { published_at: 'desc' as const };

    rows = await db.properties.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      include: PROPERTY_INCLUDE,
    });
  }

  // ward_id không có FK constraint (giống projects) — batch fetch riêng.
  const wardIds = [...new Set(rows.map((r) => r.ward_id).filter((id): id is bigint => id !== null))];
  const wards: WardRow[] = wardIds.length
    ? await db.wards.findMany({ where: { id: { in: wardIds } }, select: { id: true, name: true, slug: true } })
    : [];
  const wardMap = new Map(wards.map((w) => [w.id.toString(), w]));

  const data = rows.map((row) =>
    mapPropertyResource(row, row.ward_id !== null ? (wardMap.get(row.ward_id.toString()) ?? null) : null)
  );

  return apiPaginated(data, buildPaginationMeta(total, page, perPage));
}
