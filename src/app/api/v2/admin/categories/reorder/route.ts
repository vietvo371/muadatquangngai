import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';
import { FieldError, validationErrorResponse, isInteger } from '@/lib/validation';

/** POST /api/v2/admin/categories/reorder — port của AdminCategoryController@reorder. */
export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const order = body.order;

  if (!Array.isArray(order)) {
    return validationErrorResponse([new FieldError('order', 'Trường order không được để trống.')]);
  }
  for (const categoryId of order) {
    if (!isInteger(categoryId)) {
      return validationErrorResponse([new FieldError('order', 'Trường order chứa giá trị không hợp lệ.')]);
    }
    const exists = await db.categories.findUnique({ where: { id: BigInt(categoryId) }, select: { id: true } });
    if (!exists) return validationErrorResponse([new FieldError('order', 'Giá trị đã chọn trong trường order không hợp lệ.')]);
  }

  await Promise.all(
    order.map((categoryId: number, index: number) =>
      db.categories.update({ where: { id: BigInt(categoryId) }, data: { sort_order: index } })
    )
  );

  return apiSuccess(null, 'Đã cập nhật thứ tự.');
}
