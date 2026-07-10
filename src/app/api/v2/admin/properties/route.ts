import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiPaginated, buildPaginationMeta } from '@/lib/api-response';
import { mapPropertyResource, type WardRow } from '@/lib/api-resources/property-resource';

/**
 * GET /api/v2/admin/properties — port của AdminPropertyController@index.
 * ĐƠN GIẢN HOÁ CÓ CHỦ ĐÍCH (đã ghi rõ, giống ghi chú ở admin/settings/grouped): Laravel
 * gọi $this->paginated($properties) không bọc PropertyResource — cùng loại thiếu sót đã
 * fix ở PropertyController::index() công khai, nhưng route NÀY chỉ admin mới gọi được
 * (auth:sanctum + is_admin) nên không phải lỗ hổng bảo mật thật. Next.js dùng shape
 * PropertyResource sạch (mapPropertyResource) thay vì replicate y hệt raw dump.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const q = searchParams.get('q');
  const perPage = 20;
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const where = {
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { address: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    db.properties.count({ where }),
    db.properties.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        provinces: { select: { id: true, name: true, slug: true } },
        districts: { select: { id: true, name: true, slug: true } },
        categories: { select: { id: true, name: true, slug: true, icon: true } },
        users: { select: { id: true, name: true, phone: true, avatar: true, role: true, rating: true, total_listings: true } },
        property_media: {
          select: { id: true, type: true, url: true, thumbnail: true, caption: true, is_primary: true, sort_order: true },
        },
      },
    }),
  ]);

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
