import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { mapCategoryResource } from '@/lib/api-resources/category-resource';

/** GET /api/v2/categories — port của CategoryController@index (public, chỉ danh mục active). */
export async function GET() {
  const categories = await db.categories.findMany({
    where: { is_active: true },
    orderBy: [{ type: 'asc' }, { sort_order: 'asc' }],
  });

  return apiSuccess(categories.map((c) => mapCategoryResource(c)));
}
