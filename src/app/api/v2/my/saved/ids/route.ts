import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';

/**
 * GET /api/v2/my/saved/ids — danh sách property_id (không phân trang) mà user đã lưu.
 * Route riêng, nhẹ hơn GET /api/v2/my/saved (không load property_media/province/district),
 * dùng để tô đậm nút tim ❤️ trên PropertyCard/trang chi tiết mà không phải fetch cả object.
 */
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const rows = await db.saved_properties.findMany({
    where: { user_id: user.id },
    select: { property_id: true },
  });

  return apiSuccess(rows.map((r) => r.property_id));
}
