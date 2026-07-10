import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';
import { FieldError, validationErrorResponse } from '@/lib/validation';

/** POST /api/v2/admin/banners/reorder — port của AdminBannerController@reorder. */
export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const order = body?.order;

  if (order === undefined || order === null || order === '') {
    return validationErrorResponse([new FieldError('order', 'Trường order không được để trống.')]);
  }
  if (!Array.isArray(order)) {
    return validationErrorResponse([new FieldError('order', 'Trường order phải là một mảng.')]);
  }

  const errors: FieldError[] = [];
  for (let i = 0; i < order.length; i++) {
    if (!Number.isInteger(order[i])) {
      errors.push(new FieldError(`order.${i}`, `Giá trị đã chọn trong trường order.${i} không hợp lệ.`));
    }
  }
  if (errors.length > 0) return validationErrorResponse(errors);

  const ids = order.map((v: number) => BigInt(v));
  const existing = await db.banners.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const existingSet = new Set(existing.map((b) => b.id.toString()));
  for (let i = 0; i < order.length; i++) {
    if (!existingSet.has(String(order[i]))) {
      errors.push(new FieldError(`order.${i}`, `Giá trị đã chọn trong trường order.${i} không hợp lệ.`));
    }
  }
  if (errors.length > 0) return validationErrorResponse(errors);

  await Promise.all(order.map((bannerId: number, index: number) => db.banners.update({ where: { id: BigInt(bannerId) }, data: { sort_order: index } })));

  return apiSuccess(null, 'Đã cập nhật thứ tự.');
}
