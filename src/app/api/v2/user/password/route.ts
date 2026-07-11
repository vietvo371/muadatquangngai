import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse, hashPassword, verifyPassword } from '@/lib/auth';
import { FieldError, validationErrorResponse, isString } from '@/lib/validation';

/** PUT /api/v2/user/password — port của UserController@changePassword (ChangePasswordRequest). */
export async function PUT(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthenticatedResponse();

  const body = await request.json().catch(() => ({}));
  const errors: FieldError[] = [];

  if (!isString(body.current_password) || !body.current_password) {
    errors.push(new FieldError('current_password', 'Trường mật khẩu hiện tại không được để trống.'));
  }
  if (!isString(body.password) || !body.password) {
    errors.push(new FieldError('password', 'Trường mật khẩu không được để trống.'));
  } else if (body.password.length < 8) {
    errors.push(new FieldError('password', 'Trường mật khẩu phải có ít nhất 8 ký tự.'));
  } else if (body.password !== body.password_confirmation) {
    errors.push(new FieldError('password', 'Trường mật khẩu xác nhận không khớp.'));
  }
  if (errors.length > 0) return validationErrorResponse(errors);

  // current_password đúng? Lấy hash từ DB (AuthUser select không có password).
  const row = await db.users.findUniqueOrThrow({ where: { id: authUser.id }, select: { password: true } });
  const ok = await verifyPassword(body.current_password, row.password);
  if (!ok) {
    return validationErrorResponse([new FieldError('current_password', 'Mật khẩu hiện tại không chính xác.')]);
  }

  const hashed = await hashPassword(body.password);
  await db.users.update({ where: { id: authUser.id }, data: { password: hashed, updated_at: new Date() } });

  return apiSuccess(null, 'Đổi mật khẩu thành công!');
}
