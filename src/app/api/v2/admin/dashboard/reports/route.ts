import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';

/**
 * GET /api/v2/admin/dashboard/reports — khiếu nại đang chờ xử lý, gom theo lý do.
 *
 * Trước đây khối "Báo cáo khiếu nại mới nhận" hardcode 3 dòng ("Tin đăng spam lặp nội dung
 * liên tục — 5 mới — 1 giờ trước"...) nên quản trị viên luôn thấy có khiếu nại kể cả khi bảng
 * `reports` trống, và không bao giờ thấy khiếu nại thật khi có.
 */

const TOP_N = 5;

/** Nhãn tiếng Việt cho các mã lý do; mã lạ thì hiển thị nguyên văn thay vì bịa nhãn. */
const REASON_LABEL: Record<string, string> = {
  spam: 'Tin đăng spam, đăng lặp',
  duplicate: 'Tin đăng trùng lặp',
  fake: 'Thông tin sai sự thật',
  wrong_info: 'Thông tin không chính xác',
  scam: 'Có dấu hiệu lừa đảo',
  sold: 'Tin đã bán/cho thuê nhưng chưa gỡ',
  unreachable: 'Không liên hệ được người đăng',
  inappropriate: 'Nội dung không phù hợp',
  other: 'Lý do khác',
};

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const grouped = await db.reports.groupBy({
    by: ['reason'],
    where: { status: 'pending' },
    _count: { _all: true },
    _max: { created_at: true },
  });

  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);

  const items = grouped
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, TOP_N)
    .map((g) => ({
      reason: g.reason,
      label: REASON_LABEL[g.reason] ?? g.reason,
      count: g._count._all,
      last_at: g._max.created_at ? g._max.created_at.toISOString() : null,
    }));

  return apiSuccess({ total_pending: total, items });
}
