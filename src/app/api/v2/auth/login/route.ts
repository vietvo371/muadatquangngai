import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/api-response';
import { FieldError, validationErrorResponse, isEmail, minLen } from '@/lib/validation';
import { createToken, verifyPassword } from '@/lib/auth';
import { mapUserResource } from '@/lib/api-resources/user-resource';

/** POST /api/v2/auth/login — port của AuthController@login + LoginRequest. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email : undefined;
  const password = typeof body.password === 'string' ? body.password : undefined;

  const errors: FieldError[] = [];
  if (!email) errors.push(new FieldError('email', 'Vui lòng nhập email.'));
  else if (!isEmail(email)) errors.push(new FieldError('email', 'Email không hợp lệ.'));

  if (!password) errors.push(new FieldError('password', 'Vui lòng nhập mật khẩu.'));
  else if (!minLen(password, 6)) errors.push(new FieldError('password', 'Mật khẩu phải có ít nhất 6 ký tự.'));

  if (errors.length > 0) return validationErrorResponse(errors);

  const user = await db.users.findUnique({
    where: { email: email! },
    select: {
      id: true,
      uuid: true,
      name: true,
      email: true,
      password: true,
      phone: true,
      avatar: true,
      cover_image: true,
      role: true,
      status: true,
      bio: true,
      balance: true,
      total_listings: true,
      total_sold: true,
      rating: true,
      review_count: true,
      agency_name: true,
      license_number: true,
      zalo: true,
      facebook: true,
      website: true,
      address: true,
      email_verified_at: true,
      phone_verified_at: true,
      created_at: true,
      province_id: true,
      district_id: true,
    },
  });

  // Sai email hoặc sai mật khẩu -> CÙNG một lỗi validation (422, key "email") — không
  // phải 401 — đối chiếu đúng hành vi ValidationException::withMessages() của Laravel
  // (đã verify qua curl thật), tránh lộ email nào tồn tại trong hệ thống.
  if (!user || !(await verifyPassword(password!, user.password))) {
    return validationErrorResponse([new FieldError('email', 'Thông tin đăng nhập không chính xác.')]);
  }

  if (user.status === 'banned') {
    return apiError('Tài khoản đã bị khóa.', 403);
  }

  await db.users.update({ where: { id: user.id }, data: { last_login_at: new Date() } });

  const accessToken = await createToken(user.id);

  return apiSuccess(
    {
      user: mapUserResource(user, user.id),
      access_token: accessToken,
      token_type: 'Bearer',
    },
    'Đăng nhập thành công'
  );
}
