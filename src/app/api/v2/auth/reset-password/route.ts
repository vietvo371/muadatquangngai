import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { FieldError, validationErrorResponse, isEmail, minLen } from '@/lib/validation';
import { hashPassword } from '@/lib/auth';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 60 phút
// Cùng 1 thông báo lỗi cho MỌI trường hợp thất bại (sai token/hết hạn/không có email) —
// không phân biệt lý do cụ thể để tránh lộ thông tin.
const INVALID_TOKEN_MESSAGE = 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.';

/** POST /api/v2/auth/reset-password — tiêu thụ token từ email forgot-password, đổi mật khẩu. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email : undefined;
  const token = typeof body.token === 'string' ? body.token : undefined;
  const password = typeof body.password === 'string' ? body.password : undefined;
  const passwordConfirmation = typeof body.password_confirmation === 'string' ? body.password_confirmation : undefined;

  const errors: FieldError[] = [];
  if (!email || !isEmail(email)) errors.push(new FieldError('email', 'Liên kết không hợp lệ.'));
  if (!token) errors.push(new FieldError('token', 'Liên kết không hợp lệ.'));
  if (!password) errors.push(new FieldError('password', 'Vui lòng nhập mật khẩu mới.'));
  else if (!minLen(password, 8)) errors.push(new FieldError('password', 'Mật khẩu phải có ít nhất 8 ký tự.'));
  else if (password !== passwordConfirmation) errors.push(new FieldError('password', 'Xác nhận mật khẩu không khớp.'));

  if (errors.length > 0) return validationErrorResponse(errors);

  const row = await db.password_reset_tokens.findUnique({ where: { email: email! } });
  const hashedToken = crypto.createHash('sha256').update(token!).digest('hex');

  // So sánh thời gian không đổi (constant-time) — tránh timing attack, kỹ thuật y hệt
  // getAuthContext() trong src/lib/auth.ts. Cả 2 vế đều là digest sha256 dạng hex (64 ký
  // tự) nên luôn cùng độ dài, timingSafeEqual không cần kiểm tra length trước.
  const isValid =
    row?.created_at &&
    Date.now() - row.created_at.getTime() < TOKEN_TTL_MS &&
    crypto.timingSafeEqual(Buffer.from(row.token), Buffer.from(hashedToken));

  if (!isValid) {
    return validationErrorResponse([new FieldError('token', INVALID_TOKEN_MESSAGE)]);
  }

  const user = await db.users.findUnique({ where: { email: email! }, select: { id: true } });
  if (!user) {
    return validationErrorResponse([new FieldError('token', INVALID_TOKEN_MESSAGE)]);
  }

  const passwordHash = await hashPassword(password!);
  await db.$transaction([
    db.users.update({ where: { id: user.id }, data: { password: passwordHash, updated_at: new Date() } }),
    // Xoá ngay sau khi dùng thành công — đó là cơ chế "chỉ dùng 1 lần" (bảng không có
    // cột is_used, xoá row là cách đơn giản nhất đảm bảo không tái sử dụng được).
    db.password_reset_tokens.delete({ where: { email: email! } }),
  ]);

  return apiSuccess(null, 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.');
}
