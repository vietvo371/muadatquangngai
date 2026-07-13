import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapUserResource } from '@/lib/api-resources/user-resource';

/** PUT /api/v2/admin/users/[id]/unban — port của AdminUserController@unban. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy người dùng.', 404);
  const user = await db.users.findUnique({ where: { id: BigInt(id) } });
  if (!user) return apiError('Không tìm thấy người dùng.', 404);
  const updated = await db.users.update({ where: { id: user.id }, data: { status: 'active', updated_at: new Date() } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return apiSuccess(mapUserResource(updated as any, guard.id), 'Đã mở khóa tài khoản!');
}
