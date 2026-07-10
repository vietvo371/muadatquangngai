import { db } from '@/lib/db';
import { FieldError, isString, isInteger, isNumeric, inList } from '@/lib/validation';

export const PROJECT_STATUSES = ['draft', 'upcoming', 'selling', 'paused', 'completed', 'archived'] as const;

/**
 * Port của phần validate() dùng chung giữa AdminProjectController@store và @update — cùng
 * bộ rule (chỉ khác required/sometimes cho name/address/province_id). `slug` client gửi
 * lên VẪN được validate unique (nếu có) nhưng ở store() luôn bị ghi đè bằng slug tự sinh;
 * ở update() chỉ bị ghi đè khi `name` thực sự đổi — xử lý phần ghi đè này ở route.ts.
 */
export async function validateProjectFields(
  body: Record<string, unknown>,
  opts: { requireName: boolean; requireAddress: boolean; requireProvince: boolean; excludeSlugId?: bigint }
): Promise<FieldError[]> {
  const errors: FieldError[] = [];

  if (opts.requireName) {
    if (!isString(body.name) || !body.name) errors.push(new FieldError('name', 'Trường họ và tên không được để trống.'));
    else if (body.name.length > 255) errors.push(new FieldError('name', 'Trường họ và tên không được lớn hơn 255 ký tự.'));
  } else if ('name' in body) {
    if (!isString(body.name) || !body.name) errors.push(new FieldError('name', 'Trường họ và tên phải là chuỗi.'));
    else if (body.name.length > 255) errors.push(new FieldError('name', 'Trường họ và tên không được lớn hơn 255 ký tự.'));
  }

  if (body.slug !== undefined && body.slug !== null) {
    if (!isString(body.slug)) errors.push(new FieldError('slug', 'Trường slug phải là chuỗi.'));
    else if (body.slug.length > 255) errors.push(new FieldError('slug', 'Trường slug không được lớn hơn 255 ký tự.'));
    else {
      const existing = await db.projects.findUnique({ where: { slug: body.slug } });
      if (existing && existing.id !== opts.excludeSlugId) errors.push(new FieldError('slug', 'Trường slug đã được sử dụng.'));
    }
  }

  if (opts.requireProvince) {
    if (!isInteger(body.province_id)) errors.push(new FieldError('province_id', 'Trường tỉnh/thành phố phải là số nguyên.'));
  } else if ('province_id' in body && body.province_id !== undefined && !isInteger(body.province_id)) {
    errors.push(new FieldError('province_id', 'Trường tỉnh/thành phố phải là số nguyên.'));
  }
  if (isInteger(body.province_id)) {
    const exists = await db.provinces.findUnique({ where: { id: BigInt(body.province_id as number) } });
    if (!exists) errors.push(new FieldError('province_id', 'Giá trị đã chọn trong trường tỉnh/thành phố không hợp lệ.'));
  }

  if (body.district_id !== undefined && body.district_id !== null) {
    if (!isInteger(body.district_id)) errors.push(new FieldError('district_id', 'Trường quận/huyện phải là số nguyên.'));
    else {
      const exists = await db.districts.findUnique({ where: { id: BigInt(body.district_id as number) } });
      if (!exists) errors.push(new FieldError('district_id', 'Giá trị đã chọn trong trường quận/huyện không hợp lệ.'));
    }
  }
  if (body.ward_id !== undefined && body.ward_id !== null) {
    if (!isInteger(body.ward_id)) errors.push(new FieldError('ward_id', 'Trường phường/xã phải là số nguyên.'));
    else {
      const exists = await db.wards.findUnique({ where: { id: BigInt(body.ward_id as number) } });
      if (!exists) errors.push(new FieldError('ward_id', 'Giá trị đã chọn trong trường phường/xã không hợp lệ.'));
    }
  }
  if (body.agent_id !== undefined && body.agent_id !== null) {
    if (!isInteger(body.agent_id)) errors.push(new FieldError('agent_id', 'Trường agent id phải là số nguyên.'));
    else {
      const exists = await db.users.findUnique({ where: { id: BigInt(body.agent_id as number) } });
      if (!exists) errors.push(new FieldError('agent_id', 'Giá trị đã chọn trong trường agent id không hợp lệ.'));
    }
  }

  if (body.developer !== undefined && body.developer !== null) {
    if (!isString(body.developer)) errors.push(new FieldError('developer', 'Trường developer phải là chuỗi.'));
    else if (body.developer.length > 255) errors.push(new FieldError('developer', 'Trường developer không được lớn hơn 255 ký tự.'));
  }
  if (body.type !== undefined && body.type !== null) {
    if (!isString(body.type)) errors.push(new FieldError('type', 'Trường loại tin phải là chuỗi.'));
    else if (body.type.length > 50) errors.push(new FieldError('type', 'Trường loại tin không được lớn hơn 50 ký tự.'));
  }
  if (body.status !== undefined && body.status !== null && !inList(body.status, PROJECT_STATUSES)) {
    errors.push(new FieldError('status', 'Giá trị đã chọn trong trường status không hợp lệ.'));
  }
  if (body.description !== undefined && body.description !== null && !isString(body.description)) {
    errors.push(new FieldError('description', 'Trường mô tả phải là chuỗi.'));
  }
  if (body.total_area !== undefined && body.total_area !== null) {
    if (!isNumeric(body.total_area)) errors.push(new FieldError('total_area', 'Trường total area phải là số.'));
    else if ((body.total_area as number) < 0) errors.push(new FieldError('total_area', 'Trường total area phải ít nhất là 0.'));
  }
  if (body.total_units !== undefined && body.total_units !== null) {
    if (!isInteger(body.total_units)) errors.push(new FieldError('total_units', 'Trường total units phải là số nguyên.'));
    else if ((body.total_units as number) < 0) errors.push(new FieldError('total_units', 'Trường total units phải ít nhất là 0.'));
  }
  if (body.total_blocks !== undefined && body.total_blocks !== null) {
    if (!isInteger(body.total_blocks)) errors.push(new FieldError('total_blocks', 'Trường total blocks phải là số nguyên.'));
    else if ((body.total_blocks as number) < 0) errors.push(new FieldError('total_blocks', 'Trường total blocks phải ít nhất là 0.'));
  }
  if (body.total_floors !== undefined && body.total_floors !== null) {
    if (!isInteger(body.total_floors)) errors.push(new FieldError('total_floors', 'Trường total floors phải là số nguyên.'));
    else if ((body.total_floors as number) < 0) errors.push(new FieldError('total_floors', 'Trường total floors phải ít nhất là 0.'));
  }
  if (body.price_from !== undefined && body.price_from !== null) {
    if (!isNumeric(body.price_from)) errors.push(new FieldError('price_from', 'Trường price from phải là số.'));
    else if ((body.price_from as number) < 0) errors.push(new FieldError('price_from', 'Trường price from phải ít nhất là 0.'));
  }
  if (body.price_to !== undefined && body.price_to !== null) {
    if (!isNumeric(body.price_to)) errors.push(new FieldError('price_to', 'Trường price to phải là số.'));
    else if ((body.price_to as number) < 0) errors.push(new FieldError('price_to', 'Trường price to phải ít nhất là 0.'));
  }
  if (body.legal !== undefined && body.legal !== null) {
    if (!isString(body.legal)) errors.push(new FieldError('legal', 'Trường pháp lý phải là chuỗi.'));
    else if (body.legal.length > 500) errors.push(new FieldError('legal', 'Trường pháp lý không được lớn hơn 500 ký tự.'));
  }
  if (body.handover_date !== undefined && body.handover_date !== null) {
    if (!isString(body.handover_date) || isNaN(Date.parse(body.handover_date))) {
      errors.push(new FieldError('handover_date', 'Trường handover date phải là ngày hợp lệ.'));
    }
  }
  if (body.construction_progress !== undefined && body.construction_progress !== null) {
    if (!isInteger(body.construction_progress)) errors.push(new FieldError('construction_progress', 'Trường construction progress phải là số nguyên.'));
    else if ((body.construction_progress as number) < 0) errors.push(new FieldError('construction_progress', 'Trường construction progress phải ít nhất là 0.'));
    else if ((body.construction_progress as number) > 100) errors.push(new FieldError('construction_progress', 'Trường construction progress không được lớn hơn 100.'));
  }
  if (body.construction_note !== undefined && body.construction_note !== null) {
    if (!isString(body.construction_note)) errors.push(new FieldError('construction_note', 'Trường construction note phải là chuỗi.'));
    else if (body.construction_note.length > 500) errors.push(new FieldError('construction_note', 'Trường construction note không được lớn hơn 500 ký tự.'));
  }
  if (body.utilities !== undefined && body.utilities !== null && !Array.isArray(body.utilities)) {
    errors.push(new FieldError('utilities', 'Trường utilities phải là một mảng.'));
  }

  if (opts.requireAddress) {
    if (!isString(body.address) || !body.address) errors.push(new FieldError('address', 'Trường địa chỉ không được để trống.'));
    else if (body.address.length > 500) errors.push(new FieldError('address', 'Trường địa chỉ không được lớn hơn 500 ký tự.'));
  } else if ('address' in body) {
    if (!isString(body.address) || !body.address) errors.push(new FieldError('address', 'Trường địa chỉ phải là chuỗi.'));
    else if (body.address.length > 500) errors.push(new FieldError('address', 'Trường địa chỉ không được lớn hơn 500 ký tự.'));
  }

  if (body.thumbnail !== undefined && body.thumbnail !== null) {
    if (!isString(body.thumbnail)) errors.push(new FieldError('thumbnail', 'Trường thumbnail phải là chuỗi.'));
    else if (body.thumbnail.length > 65535) errors.push(new FieldError('thumbnail', 'Trường thumbnail không được lớn hơn 65535 ký tự.'));
  }

  return errors;
}
