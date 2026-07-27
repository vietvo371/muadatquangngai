import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/api-response';
import { FieldError, validationErrorResponse } from '@/lib/validation';
import { unauthenticatedResponse, getAuthContext } from '@/lib/auth';
import { verifyOtp } from '@/lib/otp';

const OTP_TYPE = 'email_verify';

const MESSAGES: Record<string, string> = {
  not_found: 'Mã xác thực không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu mã mới.',
  expired: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.',
  too_many_attempts: 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.',
  wrong_code: 'Mã xác thực không đúng.',
};

/** POST /api/v2/auth/email-verification/verify — xác thực mã OTP, đánh dấu email_verified_at. */
export async function POST(request: Request) {
  const ctx = await getAuthContext(request);
  if (!ctx) return unauthenticatedResponse();

  const { user } = ctx;
  if (user.email_verified_at) {
    return apiSuccess(null, 'Email đã được xác thực.');
  }

  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === 'string' ? body.code : undefined;
  if (!code) return validationErrorResponse([new FieldError('code', 'Vui lòng nhập mã xác thực.')]);

  const result = await verifyOtp(user.email, OTP_TYPE, code);
  if (result !== 'ok') {
    return apiError(MESSAGES[result], 400);
  }

  await db.users.update({ where: { id: user.id }, data: { email_verified_at: new Date() } });

  return apiSuccess(null, 'Xác thực email thành công.');
}
