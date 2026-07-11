import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';

/** POST /api/v2/my/saved/[propertyId] — port của SavedPropertyController@store. */
export async function POST(request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const { propertyId } = await params;
  if (!/^\d+$/.test(propertyId)) return apiError('Tin đăng đã được lưu trước đó.', 422);
  const pid = BigInt(propertyId);

  const exists = await db.saved_properties.findUnique({ where: { user_id_property_id: { user_id: user.id, property_id: pid } } });
  if (exists) return apiError('Tin đăng đã được lưu trước đó.', 422);

  await db.saved_properties.create({ data: { user_id: user.id, property_id: pid, created_at: new Date() } });
  await db.properties.updateMany({ where: { id: pid }, data: { save_count: { increment: 1 } } });

  return apiSuccess(null, 'Đã lưu tin đăng!');
}

/** DELETE /api/v2/my/saved/[propertyId] — port của SavedPropertyController@destroy. */
export async function DELETE(request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const { propertyId } = await params;
  if (!/^\d+$/.test(propertyId)) return apiSuccess(null, 'Đã bỏ lưu tin đăng!');
  const pid = BigInt(propertyId);

  const del = await db.saved_properties.deleteMany({ where: { user_id: user.id, property_id: pid } });
  if (del.count > 0) {
    await db.properties.updateMany({ where: { id: pid }, data: { save_count: { decrement: 1 } } });
  }

  return apiSuccess(null, 'Đã bỏ lưu tin đăng!');
}
