import { apiSuccess } from '@/lib/api-response';
import { FieldError, validationErrorResponse, isEmail } from '@/lib/validation';

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

  // TODO (giống Laravel): gửi email đặt lại mật khẩu — chưa triển khai ở cả 2 backend.
  return apiSuccess(null, 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.');
}
