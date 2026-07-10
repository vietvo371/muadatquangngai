import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapCategoryResource } from '@/lib/api-resources/category-resource';

/** PUT /api/v2/admin/categories/[id]/toggle — port của AdminCategoryController@toggleActive. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy danh mục.', 404);

  const category = await db.categories.findUnique({ where: { id: BigInt(id) } });
  if (!category) return apiError('Không tìm thấy danh mục.', 404);

  const updated = await db.categories.update({
    where: { id: category.id },
    data: { is_active: !category.is_active, updated_at: new Date() },
  });

  return apiSuccess(mapCategoryResource(updated), updated.is_active ? 'Đã kích hoạt danh mục.' : 'Đã vô hiệu hóa danh mục.');
}
