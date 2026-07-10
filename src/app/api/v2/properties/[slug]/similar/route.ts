import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapPropertyResource } from '@/lib/api-resources/property-resource';

/**
 * GET /api/v2/properties/[slug]/similar — port của PropertyController@similar.
 *
 * Laravel route là /properties/{id}/similar (dùng ID số, không phải slug), nhưng Next.js
 * không cho 2 tên segment động khác nhau ([id] vs [slug]) cùng cấp path — cấp trên đã là
 * [slug] nên phải đặt tên param là `slug`, giá trị thực tế vẫn là ID số như Laravel.
 *
 * Chỉ eager-load province/district/category (KHÔNG load user/media) → response lược bỏ hẳn
 * owner/media (includeOwner:false, includeMedia:false). Sắp xếp: tin cùng quận/huyện lên
 * trước rồi tới tin mới nhất (đối chiếu orderByRaw CASE WHEN district_id = ? của Laravel —
 * đã sửa bug orderBy sai gây 500 ở PropertyController gốc).
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy tin đăng.', 404);

  const property = await db.properties.findUnique({
    where: { id: BigInt(id) },
    select: { id: true, type: true, province_id: true, district_id: true },
  });
  if (!property) return apiError('Không tìm thấy tin đăng.', 404);

  const { searchParams } = new URL(request.url);
  const limitParam = parseInt(searchParams.get('limit') ?? '6', 10);
  const limit = Math.min(Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 6, 20);

  const similar = await db.properties.findMany({
    where: {
      status: 'active',
      OR: [{ expired_at: null }, { expired_at: { gt: new Date() } }],
      published_at: { not: null },
      id: { not: property.id },
      type: property.type,
      province_id: property.province_id,
    },
    include: {
      provinces: { select: { id: true, name: true, slug: true } },
      districts: { select: { id: true, name: true, slug: true } },
      categories: { select: { id: true, name: true, slug: true, icon: true } },
    },
    // Prisma không có orderByRaw CASE WHEN — lấy theo published_at desc rồi tự đẩy tin cùng
    // quận/huyện lên đầu bằng sort ổn định (tập province+type ở thị trường địa phương nhỏ).
    orderBy: { published_at: 'desc' },
  });

  const ranked = similar
    .map((p) => ({ p, priority: p.district_id === property.district_id ? 0 : 1 }))
    .sort((a, b) => a.priority - b.priority) // ổn định: giữ nguyên thứ tự published_at trong cùng nhóm
    .slice(0, limit)
    .map(({ p }) => p);

  // Laravel không eager-load ward, nhưng accessor fullAddress() truy cập $this->ward?->name
  // → lazy-load ward khi tin CÓ ward_id, khiến location.ward xuất hiện trong response.
  // Nạp ward cho các tin có ward_id để khớp đúng side-effect này.
  const wardIds = [...new Set(ranked.map((p) => p.ward_id).filter((w): w is bigint => w !== null))];
  const wards = wardIds.length
    ? await db.wards.findMany({ where: { id: { in: wardIds } }, select: { id: true, name: true, slug: true } })
    : [];
  const wardById = new Map(wards.map((w) => [w.id.toString(), w]));

  return apiSuccess(
    ranked.map((p) =>
      mapPropertyResource(p, p.ward_id ? (wardById.get(p.ward_id.toString()) ?? null) : null, {
        includeOwner: false,
        includeMedia: false,
      })
    )
  );
}
