import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';
import { mapUserResource } from '@/lib/api-resources/user-resource';
import { FieldError, validationErrorResponse, isString } from '@/lib/validation';

/** PUT /api/v2/user/profile — port của UserController@updateProfile (UpdateProfileRequest). */
export async function PUT(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const body = await request.json().catch(() => ({}));
  const errors: FieldError[] = [];

  if ('name' in body && (!isString(body.name) || body.name.length > 255)) {
    errors.push(new FieldError('name', 'Trường họ và tên không được lớn hơn 255 ký tự.'));
  }
  if (body.phone != null && body.phone !== '') {
    if (!isString(body.phone) || !/^0[0-9]{9}$/.test(body.phone)) {
      errors.push(new FieldError('phone', 'Trường số điện thoại không đúng định dạng.'));
    } else {
      const dup = await db.users.findFirst({ where: { phone: body.phone, id: { not: user.id } }, select: { id: true } });
      if (dup) errors.push(new FieldError('phone', 'Trường số điện thoại đã được sử dụng.'));
    }
  }
  if (body.province_id != null && body.province_id !== '') {
    const exists = await db.provinces.findUnique({ where: { id: BigInt(body.province_id) }, select: { id: true } }).catch(() => null);
    if (!exists) errors.push(new FieldError('province_id', 'Giá trị đã chọn trong trường tỉnh/thành phố không hợp lệ.'));
  }
  if (body.district_id != null && body.district_id !== '') {
    const exists = await db.districts.findUnique({ where: { id: BigInt(body.district_id) }, select: { id: true } }).catch(() => null);
    if (!exists) errors.push(new FieldError('district_id', 'Giá trị đã chọn trong trường quận/huyện không hợp lệ.'));
  }
  if (errors.length > 0) return validationErrorResponse(errors);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = { updated_at: new Date() };
  for (const f of ['name', 'bio', 'address', 'facebook', 'zalo', 'website', 'agency_name', 'license_number'] as const) {
    if (f in body) data[f] = body[f];
  }
  if ('phone' in body) data.phone = body.phone;
  if ('province_id' in body) data.province_id = body.province_id != null && body.province_id !== '' ? BigInt(body.province_id) : null;
  if ('district_id' in body) data.district_id = body.district_id != null && body.district_id !== '' ? BigInt(body.district_id) : null;

  await db.users.update({ where: { id: user.id }, data });

  const fresh = await db.users.findUniqueOrThrow({ where: { id: user.id } });
  const [province, district] = await Promise.all([
    fresh.province_id !== null ? db.provinces.findUnique({ where: { id: fresh.province_id }, select: { id: true, name: true } }) : Promise.resolve(null),
    fresh.district_id !== null ? db.districts.findUnique({ where: { id: fresh.district_id }, select: { id: true, name: true } }) : Promise.resolve(null),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return apiSuccess(mapUserResource(fresh as any, user.id, { province, district }), 'Cập nhật hồ sơ thành công!');
}
