import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, hashPassword } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapUserResource } from '@/lib/api-resources/user-resource';
import { FieldError, validationErrorResponse, isString, isEmail, inList } from '@/lib/validation';

const ROLES = ['user', 'agent', 'agency', 'admin'] as const;
const STATUSES = ['active', 'inactive', 'banned'] as const;

/** PUT /api/v2/admin/users/[id] — port của AdminUserController@update. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy người dùng.', 404);
  const user = await db.users.findUnique({ where: { id: BigInt(id) } });
  if (!user) return apiError('Không tìm thấy người dùng.', 404);

  const body = await request.json().catch(() => ({}));
  const errors: FieldError[] = [];

  if ('name' in body && (!isString(body.name) || body.name.length > 255)) {
    errors.push(new FieldError('name', 'Trường họ và tên không được lớn hơn 255 ký tự.'));
  }
  if ('email' in body) {
    if (!isString(body.email) || !isEmail(body.email)) errors.push(new FieldError('email', 'Trường địa chỉ email phải là địa chỉ email hợp lệ.'));
    else {
      const dup = await db.users.findFirst({ where: { email: body.email, id: { not: user.id } }, select: { id: true } });
      if (dup) errors.push(new FieldError('email', 'Trường địa chỉ email đã được sử dụng.'));
    }
  }
  if ('password' in body && body.password != null && body.password !== '' && (!isString(body.password) || body.password.length < 8)) {
    errors.push(new FieldError('password', 'Trường mật khẩu phải có ít nhất 8 ký tự.'));
  }
  if ('role' in body && !inList(body.role, ROLES)) errors.push(new FieldError('role', 'Giá trị đã chọn trong trường vai trò không hợp lệ.'));
  if ('status' in body && !inList(body.status, STATUSES)) errors.push(new FieldError('status', 'Giá trị đã chọn trong trường status không hợp lệ.'));
  if (errors.length > 0) return validationErrorResponse(errors);

  // Không cho hạ quyền tài khoản admin (đối chiếu Laravel).
  if (user.role === 'admin' && 'role' in body && body.role && body.role !== 'admin') {
    return apiError('Không thể hạ quyền tài khoản admin.', 403);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = { updated_at: new Date() };
  if ('name' in body) data.name = body.name;
  if ('email' in body) data.email = body.email;
  if ('phone' in body) data.phone = body.phone;
  if ('role' in body) data.role = body.role;
  if ('status' in body) data.status = body.status;
  if ('password' in body && body.password) data.password = await hashPassword(body.password);

  const updated = await db.users.update({ where: { id: user.id }, data });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return apiSuccess(mapUserResource(updated as any, guard.id), 'Cập nhật tài khoản thành công!');
}
