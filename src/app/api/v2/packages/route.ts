import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';

/**
 * GET /api/v2/packages — danh sách gói đăng tin đang bán (spec mục 8.1).
 *
 * Công khai vì form đăng tin cần hiển thị bảng giá. Trước đây form hardcode 4 gói với giá
 * 0/50k/100k/200k trong khi bảng packages thật là 0/150k/350k/800k — người dùng nhìn một
 * đằng, hệ thống tính một nẻo.
 */
export async function GET() {
  const rows = await db.packages.findMany({
    where: { is_active: true },
    orderBy: [{ sort_order: 'asc' }, { price: 'asc' }],
  });

  return apiSuccess(
    rows.map((p) => ({
      id: Number(p.id),
      name: p.name,
      type: p.type,
      price: Number(p.price),
      duration_days: p.duration_days,
      highlight_color: p.highlight_color,
      // features là Json trong DB, chuẩn hoá về mảng chuỗi cho client dễ render.
      features: Array.isArray(p.features) ? (p.features as unknown[]).map(String) : [],
    }))
  );
}
