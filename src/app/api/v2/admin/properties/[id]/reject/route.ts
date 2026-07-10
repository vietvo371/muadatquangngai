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

/** PUT /api/v2/admin/properties/[id]/reject — port của AdminPropertyController@reject (xem ghi chú ở approve/route.ts). */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy tin đăng.', 404);

  const existing = await db.properties.findUnique({ where: { id: BigInt(id) } });
  if (!existing) return apiError('Không tìm thấy tin đăng.', 404);

  const updated = await db.properties.update({
    where: { id: existing.id },
    data: { status: 'rejected', updated_at: new Date() },
    include: PROPERTY_INCLUDE,
  });

  const ward =
    updated.ward_id !== null
      ? await db.wards.findUnique({ where: { id: updated.ward_id }, select: { id: true, name: true, slug: true } })
      : null;

  return apiSuccess(mapPropertyResource(updated, ward), 'Từ chối tin thành công!');
}
