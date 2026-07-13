import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapUserResource } from '@/lib/api-resources/user-resource';
import { FieldError, validationErrorResponse, inList } from '@/lib/validation';

const ROLES = ['user', 'agent', 'agency', 'admin'] as const;

/** PUT /api/v2/admin/users/[id]/role — port của AdminUserController@updateRole. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;
  const body = await request.json().catch(() => ({}));
  if (!inList(body.role, ROLES)) {
    return validationErrorResponse([new FieldError('role', 'Giá trị đã chọn trong trường vai trò không hợp lệ.')]);
  }
  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy người dùng.', 404);
  const user = await db.users.findUnique({ where: { id: BigInt(id) } });
  if (!user) return apiError('Không tìm thấy người dùng.', 404);
  const updated = await db.users.update({ where: { id: user.id }, data: { role: body.role, updated_at: new Date() } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return apiSuccess(mapUserResource(updated as any, guard.id), 'Cập nhật vai trò thành công!');
}
