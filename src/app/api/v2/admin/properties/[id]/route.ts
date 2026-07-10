import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

/** DELETE /api/v2/admin/properties/[id] — port của AdminPropertyController@destroy (hard delete). */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy tin đăng.', 404);

  const property = await db.properties.findUnique({ where: { id: BigInt(id) } });
  if (!property) return apiError('Không tìm thấy tin đăng.', 404);

  await db.properties.delete({ where: { id: property.id } });
  return apiSuccess(null, 'Xóa tin đăng thành công!');
}
