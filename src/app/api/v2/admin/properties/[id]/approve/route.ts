import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapPropertyResource } from '@/lib/api-resources/property-resource';

const PROPERTY_INCLUDE = {
  provinces: { select: { id: true, name: true, slug: true } },
  districts: { select: { id: true, name: true, slug: true } },
  categories: { select: { id: true, name: true, slug: true, icon: true } },
  users: { select: { id: true, name: true, phone: true, avatar: true, role: true, rating: true, total_listings: true } },
  property_media: {
    select: { id: true, type: true, url: true, thumbnail: true, caption: true, is_primary: true, sort_order: true },
  },
} as const;

/**
 * PUT /api/v2/admin/properties/[id]/approve — port của AdminPropertyController@approve.
 *
 * ĐƠN GIẢN HOÁ CÓ CHỦ ĐÍCH: Laravel gọi `Property::find($id)` (không eager-load) rồi
 * `new PropertyResource($property)` — do PHP đã điều tra: accessor `fullAddress()` truy
 * cập $this->province/district/ward TRƯỚC field `location` trong resource (side-effect
 * lazy-load), nên 3 field đó "tình cờ" xuất hiện, còn category/owner/media thì KHÔNG (vì
 * không có accessor nào chạm vào chúng trước). Đây là hành vi tình cờ do thứ tự field,
 * không phải thiết kế chủ đích — Next.js trả bản ĐẦY ĐỦ hơn (có category/owner/media),
 * hữu ích hơn cho UI admin duyệt tin. Không phải bug, là cải tiến có ý thức.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy tin đăng.', 404);

  const existing = await db.properties.findUnique({ where: { id: BigInt(id) } });
  if (!existing) return apiError('Không tìm thấy tin đăng.', 404);

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 30);

  const updated = await db.properties.update({
    where: { id: existing.id },
    data: { status: 'active', published_at: now, expired_at: expiresAt, updated_at: now },
    include: PROPERTY_INCLUDE,
  });

  const ward =
    updated.ward_id !== null
      ? await db.wards.findUnique({ where: { id: updated.ward_id }, select: { id: true, name: true, slug: true } })
      : null;

  return apiSuccess(mapPropertyResource(updated, ward), 'Duyệt tin thành công!');
}
