import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { dbNow } from '@/lib/db-time';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapUserResource } from '@/lib/api-resources/user-resource';
import { FieldError, validationErrorResponse } from '@/lib/validation';
import { isRole } from '@/lib/roles';
import { RoleChangeError, assertRoleChangeAllowed, roleChangeSideEffects } from '@/lib/user-role-change';

/** PUT /api/v2/admin/users/[id]/role — đổi vai trò (kèm nhật ký + thông báo, xem lib/user-role-change). */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;
  const body = await request.json().catch(() => ({}));
  if (!isRole(body.role)) {
    return validationErrorResponse([new FieldError('role', 'Giá trị đã chọn trong trường vai trò không hợp lệ.')]);
  }
  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy người dùng.', 404);
  const user = await db.users.findUnique({ where: { id: BigInt(id) } });
  if (!user) return apiError('Không tìm thấy người dùng.', 404);

  let changed: boolean;
  try {
    changed = assertRoleChangeAllowed(user, body.role, guard.id);
  } catch (error) {
    if (error instanceof RoleChangeError) return apiError(error.message, error.status);
    throw error;
  }
  if (!changed) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiSuccess(mapUserResource(user as any, guard.id), 'Vai trò không thay đổi.');
  }

  const [updated] = await db.$transaction([
    db.users.update({ where: { id: user.id }, data: { role: body.role, updated_at: dbNow() } }),
    ...roleChangeSideEffects(user, body.role, guard.id),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return apiSuccess(mapUserResource(updated as any, guard.id), 'Cập nhật vai trò thành công!');
}
