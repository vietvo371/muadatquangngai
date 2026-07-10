import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

/** PUT /api/v2/admin/reports/[id]/resolve — port của AdminReportController@resolve. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy báo cáo.', 404);

  const report = await db.reports.findUnique({ where: { id: BigInt(id) } });
  if (!report) return apiError('Không tìm thấy báo cáo.', 404);

  await db.reports.update({ where: { id: report.id }, data: { status: 'resolved', updated_at: new Date() } });
  return apiSuccess(null, 'Đã xử lý báo cáo!');
}
