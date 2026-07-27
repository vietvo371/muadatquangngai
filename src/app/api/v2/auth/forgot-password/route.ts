import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { FieldError, validationErrorResponse, isEmail } from '@/lib/validation';
import { sendEmail } from '@/lib/email';
import { resetPasswordEmail } from '@/lib/email-templates/reset-password';
import { getAppOrigin } from '@/lib/app-url';

const GENERIC_MESSAGE = 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.';
const RATE_LIMIT_SECONDS = 60;

/**
 * POST /api/v2/auth/forgot-password — port của AuthController@forgotPassword.
 * Laravel dùng $request->validate() inline (không FormRequest riêng) nên rơi về message
 * mặc định của lang/vi/validation.php — đã lấy nguyên văn qua curl thật, "email" dịch
 * thành "địa chỉ email" theo bảng attributes của lang file.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email : undefined;

  if (!email) {
    return validationErrorResponse([new FieldError('email', 'Trường địa chỉ email không được để trống.')]);
  }
  if (!isEmail(email)) {
    return validationErrorResponse([new FieldError('email', 'Trường địa chỉ email phải là địa chỉ email hợp lệ.')]);
  }

  const user = await db.users.findUnique({ where: { email }, select: { id: true } });

  // Không tiết lộ email có tồn tại hay không — LUÔN trả về cùng 1 thông báo chung ở cuối
  // hàm, bất kể user có/không có, hay bị rate-limit. Chỉ khác nhau ở việc CÓ gửi email
  // thật hay không (side-effect không quan sát được từ response).
  if (user) {
    const existing = await db.password_reset_tokens.findUnique({ where: { email } });
    const recentlySent =
      existing?.created_at && Date.now() - existing.created_at.getTime() < RATE_LIMIT_SECONDS * 1000;

    if (!recentlySent) {
      const plainToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

      await db.password_reset_tokens.upsert({
        where: { email },
        create: { email, token: hashedToken, created_at: new Date() },
        update: { token: hashedToken, created_at: new Date() },
      });

      const resetUrl = `${getAppOrigin(request)}/reset-password?email=${encodeURIComponent(email)}&token=${plainToken}`;
      const { subject, html } = resetPasswordEmail(resetUrl);
      await sendEmail(email, subject, html);
    }
  }

  return apiSuccess(null, GENERIC_MESSAGE);
}
