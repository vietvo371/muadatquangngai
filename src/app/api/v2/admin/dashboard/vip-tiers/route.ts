import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';

/**
 * GET /api/v2/admin/dashboard/vip-tiers — cơ cấu tin đăng theo phân cấp VIP.
 *
 * Trước đây biểu đồ này hardcode 60%/22%/12%/6% — quản trị viên nhìn vào để đánh giá hiệu quả
 * bán gói mà toàn bộ là số bịa. Tách khỏi /admin/dashboard vì route đó là bản port khớp từng
 * byte với Laravel (thêm khoá mới sẽ làm lệch scripts/diff-api.mjs), giống cách làm của
 * /admin/dashboard/areas.
 */

/** Thứ tự hiển thị + nhãn tiếng Việt cho từng hạng. */
const TIERS: Array<{ key: string; name: string }> = [
  { key: 'normal', name: 'Tin thường' },
  { key: 'vip', name: 'Tin VIP' },
  { key: 'vip_plus', name: 'Tin VIP+' },
  { key: 'diamond', name: 'Tin Kim Cương' },
];

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const grouped = await db.properties.groupBy({
    by: ['is_vip'],
    where: { deleted_at: null },
    _count: { _all: true },
  });

  const countByTier = new Map(grouped.map((g) => [g.is_vip ?? 'normal', g._count._all]));
  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);

  return apiSuccess({
    total,
    // Giữ đủ 4 hạng kể cả khi count = 0 để biểu đồ không "mất dòng" gây hiểu nhầm là chưa có hạng đó.
    tiers: TIERS.map((t) => {
      const count = countByTier.get(t.key) ?? 0;
      return {
        key: t.key,
        name: t.name,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    }),
  });
}
