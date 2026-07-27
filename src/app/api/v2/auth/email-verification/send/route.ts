import { apiError, apiSuccess } from '@/lib/api-response';
import { unauthenticatedResponse, getAuthContext } from '@/lib/auth';
import { checkSendRateLimit, createOtp } from '@/lib/otp';
import { sendEmail } from '@/lib/email';
import { otpCodeEmail } from '@/lib/email-templates/otp-code';

const OTP_TYPE = 'email_verify';

/** POST /api/v2/auth/email-verification/send — gửi mã OTP xác thực tới email của user đang đăng nhập. */
export async function POST(request: Request) {
  const ctx = await getAuthContext(request);
  if (!ctx) return unauthenticatedResponse();

  const { user } = ctx;
  if (user.email_verified_at) {
    return apiError('Email đã được xác thực.', 400);
  }

  const limit = await checkSendRateLimit(user.email, OTP_TYPE);
  if (!limit.allowed) {
    const message =
      limit.reason === 'cooldown'
        ? 'Vui lòng đợi ít nhất 60 giây trước khi gửi lại mã.'
        : 'Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau.';
    return apiError(message, 429);
  }

  const code = await createOtp(user.email, OTP_TYPE, user.id);
  const { subject, html } = otpCodeEmail(code);
  await sendEmail(user.email, subject, html);

  return apiSuccess(null, 'Mã xác thực đã được gửi đến email của bạn.');
}
