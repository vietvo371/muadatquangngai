import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { FieldError, validationErrorResponse, isEmail, minLen } from '@/lib/validation';
import { createToken, hashPassword } from '@/lib/auth';
import { mapUserResource } from '@/lib/api-resources/user-resource';

/** POST /api/v2/auth/register — port của AuthController@register + RegisterRequest. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name : undefined;
  const email = typeof body.email === 'string' ? body.email : undefined;
  const password = typeof body.password === 'string' ? body.password : undefined;
  const passwordConfirmation = typeof body.password_confirmation === 'string' ? body.password_confirmation : undefined;
  const phone = typeof body.phone === 'string' && body.phone ? body.phone : null;

  // Thứ tự field PHẢI khớp RegisterRequest::rules() — quyết định message nào lên đầu
  // khi có nhiều lỗi (đối chiếu "(and N more errors)" đã verify qua curl thật).
  const errors: FieldError[] = [];
  if (!name) errors.push(new FieldError('name', 'Vui lòng nhập họ và tên.'));
  else if (name.length > 100) errors.push(new FieldError('name', 'Trường name không được lớn hơn 100 ký tự.'));

  if (!email) errors.push(new FieldError('email', 'Vui lòng nhập email.'));
  else if (!isEmail(email)) errors.push(new FieldError('email', 'Email không hợp lệ.'));
  else if (email.length > 255) errors.push(new FieldError('email', 'Trường email không được lớn hơn 255 ký tự.'));
  else {
    const existing = await db.users.findUnique({ where: { email }, select: { id: true } });
    if (existing) errors.push(new FieldError('email', 'Email đã được sử dụng.'));
  }

  if (!password) errors.push(new FieldError('password', 'Vui lòng nhập mật khẩu.'));
  else if (!minLen(password, 8)) errors.push(new FieldError('password', 'Mật khẩu phải có ít nhất 8 ký tự.'));
  else if (password !== passwordConfirmation) errors.push(new FieldError('password', 'Xác nhận mật khẩu không khớp.'));

  if (phone) {
    if (phone.length > 20) errors.push(new FieldError('phone', 'Trường phone không được lớn hơn 20 ký tự.'));
    else {
      const existingPhone = await db.users.findUnique({ where: { phone }, select: { id: true } });
      if (existingPhone) errors.push(new FieldError('phone', 'Số điện thoại đã được sử dụng.'));
    }
  }

  if (errors.length > 0) return validationErrorResponse(errors);

  const passwordHash = await hashPassword(password!);

  // Prisma không tự set created_at/updated_at như Eloquent (cột nullable, không có DB
  // default trong schema) — phải set tay, nếu không FE hiển thị "vừa tham gia" sai lệch.
  const now = new Date();
  const user = await db.users.create({
    data: {
      uuid: crypto.randomUUID(),
      name: name!,
      email: email!,
      password: passwordHash,
      phone,
      role: typeof body.role === 'string' ? body.role : 'user',
      created_at: now,
      updated_at: now,
    },
    select: {
      id: true,
      uuid: true,
      name: true,
      email: true,
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

  const accessToken = await createToken(user.id);

  return apiSuccess(
    {
      user: mapUserResource(user, user.id),
      access_token: accessToken,
      token_type: 'Bearer',
    },
    'Đăng ký thành công',
    201
  );
}
