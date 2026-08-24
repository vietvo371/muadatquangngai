import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';

const RECENT_LIMIT = 3;

/**
 * GET /api/v2/my/stats — số liệu THẬT cho trang Tổng quan của user đang đăng nhập.
 *
 * Chỉ trả những chỉ số có nguồn dữ liệu thật:
 * - active_count: tin đang đăng (status = 'active', chưa xoá mềm)
 * - total_views: tổng lượt xem, lấy từ cột properties.view_count (cột này được tăng ở
 *   route GET /properties/[slug], là nguồn duy nhất khớp với số hiển thị trên từng tin)
 * - total_saves: số lượt lưu THẬT — đếm trên bảng saved_properties, không dùng cột
 *   save_count (cột đếm sẵn có thể lệch)
 * - recent_properties: tin mới nhất của user
 *
 * KHÔNG có "yêu cầu tư vấn" và KHÔNG có % tăng trưởng: chưa có nguồn dữ liệu để tính.
 */
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const ownedByUser = { user_id: user.id, deleted_at: null };

  const [activeCount, viewAgg, totalSaves, recent] = await Promise.all([
    db.properties.count({ where: { ...ownedByUser, status: 'active' } }),
    db.properties.aggregate({ where: ownedByUser, _sum: { view_count: true } }),
    db.saved_properties.count({ where: { properties: ownedByUser } }),
    db.properties.findMany({
      where: ownedByUser,
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: RECENT_LIMIT,
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        status: true,
        price: true,
        price_unit: true,
        view_count: true,
        created_at: true,
      },
    }),
  ]);

  return apiSuccess({
    active_count: activeCount,
    total_views: viewAgg._sum.view_count ?? 0,
    total_saves: totalSaves,
    recent_properties: recent.map((p) => ({ ...p, price: Number(p.price) })),
  });
}
