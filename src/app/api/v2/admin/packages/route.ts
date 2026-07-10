import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';
import { mapPackageResource } from '@/lib/api-resources/package-resource';
import { FieldError, validationErrorResponse, isString, isNumeric, isInteger, isBoolean, inList } from '@/lib/validation';

const PACKAGE_TYPES = ['vip', 'vip_plus', 'diamond'] as const;

function laravelBoolean(value: string | null): boolean {
  return value !== null && ['1', 'true', 'on', 'yes'].includes(value.toLowerCase());
}

/** GET /api/v2/admin/packages — port của AdminPackageController@index. */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const activeOnly = laravelBoolean(searchParams.get('active_only'));
  const type = searchParams.get('type');

  const rows = await db.packages.findMany({
    where: { ...(activeOnly ? { is_active: true } : {}), ...(type ? { type } : {}) },
    orderBy: { sort_order: 'asc' },
  });

  return apiSuccess(rows.map((r) => mapPackageResource(r)));
}

/** POST /api/v2/admin/packages — port của AdminPackageController@store. */
export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const errors: FieldError[] = [];

  const name = isString(body.name) ? body.name : undefined;
  if (!name) errors.push(new FieldError('name', 'Trường họ và tên không được để trống.'));
  else if (name.length > 100) errors.push(new FieldError('name', 'Trường họ và tên không được lớn hơn 100 ký tự.'));

  const type = body.type;
  if (!type) errors.push(new FieldError('type', 'Trường loại tin không được để trống.'));
  else if (!inList(type, PACKAGE_TYPES)) errors.push(new FieldError('type', 'Giá trị đã chọn trong trường loại tin không hợp lệ.'));

  const price = body.price;
  if (price === undefined || price === null) errors.push(new FieldError('price', 'Trường giá không được để trống.'));
  else if (!isNumeric(price) || price < 0) errors.push(new FieldError('price', 'Trường giá phải là số.'));

  const durationDays = body.duration_days;
  if (durationDays === undefined || durationDays === null) errors.push(new FieldError('duration_days', 'Trường số ngày không được để trống.'));
  else if (!isInteger(durationDays) || durationDays < 1) errors.push(new FieldError('duration_days', 'Trường số ngày phải ít nhất là 1.'));

  if (body.is_active !== undefined && body.is_active !== null && !isBoolean(body.is_active)) {
    errors.push(new FieldError('is_active', 'Trường is active phải là đúng hoặc sai.'));
  }

  if (errors.length > 0) return validationErrorResponse(errors);

  const now = new Date();
  const created = await db.packages.create({
    data: {
      name: name!,
      type: type!,
      price: String(price),
      duration_days: durationDays!,
      highlight_color: body.highlight_color ?? null,
      features: Array.isArray(body.features) ? body.features : [],
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active ?? true,
      created_at: now,
      updated_at: now,
    },
  });

  return apiSuccess(mapPackageResource(created), 'Gói dịch vụ đã được tạo.', 201);
}
