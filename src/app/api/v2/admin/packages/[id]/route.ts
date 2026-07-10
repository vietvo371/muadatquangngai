import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapPackageResource } from '@/lib/api-resources/package-resource';
import { FieldError, validationErrorResponse, isString, isNumeric, isInteger, isBoolean, inList } from '@/lib/validation';

const PACKAGE_TYPES = ['vip', 'vip_plus', 'diamond'] as const;

/**
 * GET /api/v2/admin/packages/[id] — port của AdminPackageController@show.
 *
 * Laravel query dùng `withCount('subscriptions as active_subscriptions_count')` nhưng
 * `PackageResource::toArray()` KHÔNG serialize field này — kiểm chứng qua curl thật,
 * response thật sự thiếu hẳn `active_subscriptions_count` dù query đã tính. Dead code
 * ở Laravel; Next.js replicate đúng response THẬT (bỏ field), không tính count thừa.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy gói dịch vụ.', 404);

  const pkg = await db.packages.findUnique({ where: { id: BigInt(id) } });
  if (!pkg) return apiError('Không tìm thấy gói dịch vụ.', 404);

  return apiSuccess(mapPackageResource(pkg));
}

/** PUT /api/v2/admin/packages/[id] — port của AdminPackageController@update. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy gói dịch vụ.', 404);
  const pkg = await db.packages.findUnique({ where: { id: BigInt(id) } });
  if (!pkg) return apiError('Không tìm thấy gói dịch vụ.', 404);

  const body = await request.json().catch(() => ({}));
  const errors: FieldError[] = [];

  if ('name' in body) {
    if (!isString(body.name) || !body.name) errors.push(new FieldError('name', 'Trường họ và tên phải là chuỗi.'));
    else if (body.name.length > 100) errors.push(new FieldError('name', 'Trường họ và tên không được lớn hơn 100 ký tự.'));
  }
  if ('type' in body && !inList(body.type, PACKAGE_TYPES)) {
    errors.push(new FieldError('type', 'Giá trị đã chọn trong trường loại tin không hợp lệ.'));
  }
  if ('price' in body && (!isNumeric(body.price) || body.price < 0)) {
    errors.push(new FieldError('price', 'Trường giá phải là số.'));
  }
  if ('duration_days' in body && (!isInteger(body.duration_days) || body.duration_days < 1)) {
    errors.push(new FieldError('duration_days', 'Trường số ngày phải ít nhất là 1.'));
  }
  if ('is_active' in body && body.is_active !== null && !isBoolean(body.is_active)) {
    errors.push(new FieldError('is_active', 'Trường is active phải là đúng hoặc sai.'));
  }

  if (errors.length > 0) return validationErrorResponse(errors);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = { updated_at: new Date() };
  if ('name' in body) data.name = body.name;
  if ('type' in body) data.type = body.type;
  if ('price' in body) data.price = String(body.price);
  if ('duration_days' in body) data.duration_days = body.duration_days;
  if ('highlight_color' in body) data.highlight_color = body.highlight_color;
  if ('features' in body) data.features = Array.isArray(body.features) ? body.features : [];
  if ('sort_order' in body) data.sort_order = body.sort_order;
  if ('is_active' in body) data.is_active = body.is_active;

  const updated = await db.packages.update({ where: { id: pkg.id }, data });
  return apiSuccess(mapPackageResource(updated), 'Gói dịch vụ đã được cập nhật.');
}

/** DELETE /api/v2/admin/packages/[id] — port của AdminPackageController@destroy. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy gói dịch vụ.', 404);
  const pkg = await db.packages.findUnique({ where: { id: BigInt(id) } });
  if (!pkg) return apiError('Không tìm thấy gói dịch vụ.', 404);

  const hasActiveSub = await db.subscriptions.findFirst({ where: { package_id: pkg.id, status: 'active' }, select: { id: true } });
  if (hasActiveSub) return apiError('Không thể xóa gói đang có người sử dụng.', 422);

  await db.packages.delete({ where: { id: pkg.id } });
  return apiSuccess(null, 'Gói dịch vụ đã được xóa.');
}
