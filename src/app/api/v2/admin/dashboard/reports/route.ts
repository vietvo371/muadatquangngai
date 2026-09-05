import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';
import { reportReasonLabel } from '@/lib/reports';

/**
 * GET /api/v2/admin/dashboard/reports — khiếu nại đang chờ xử lý, gom theo lý do.
 *
 * Trước đây khối "Báo cáo khiếu nại mới nhận" hardcode 3 dòng ("Tin đăng spam lặp nội dung
 * liên tục — 5 mới — 1 giờ trước"...) nên quản trị viên luôn thấy có khiếu nại kể cả khi bảng
 * `reports` trống, và không bao giờ thấy khiếu nại thật khi có.
 */

const TOP_N = 5;

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
      label: reportReasonLabel(g.reason),
      count: g._count._all,
      last_at: g._max.created_at ? g._max.created_at.toISOString() : null,
    }));

  return apiSuccess({ total_pending: total, items });
}
