import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { dbNow } from '@/lib/db-time';

/**
 * PUT /api/v2/admin/reports/[id]/resolve — port của AdminReportController@resolve.
 *
 * Mở rộng so với bản Laravel: nhận thêm `action` để phân biệt "xác nhận & xử lý" với "bác bỏ".
 * Giao diện quản trị vốn đã có sẵn hai nút này nhưng chỉ đổi biến trong trình duyệt rồi báo
 * thành công, không lưu gì — nên bác bỏ và xử lý trước đây là như nhau: đều không có thật.
 *
 * `action` là tuỳ chọn và mặc định 'resolve', nên client cũ gọi không kèm body vẫn chạy y như cũ.
 *
 * Lưu ý: bảng `reports` KHÔNG có cột ghi chú xử lý / người xử lý / thời điểm xử lý, nên endpoint
 * này không nhận ghi chú. Muốn lưu ghi chú thì phải thêm cột vào DB production trước.
 */

const ACTION_TO_STATUS: Record<string, string> = {
  resolve: 'resolved',
  dismiss: 'dismissed',
};

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy báo cáo.', 404);

  const body = await request.json().catch(() => ({}));
  const action = typeof body?.action === 'string' ? body.action : 'resolve';
  const status = ACTION_TO_STATUS[action];
  if (!status) return apiError('Hành động không hợp lệ.', 422);

  const report = await db.reports.findUnique({ where: { id: BigInt(id) } });
  if (!report) return apiError('Không tìm thấy báo cáo.', 404);

  if (report.status !== 'pending') {
    return apiError('Báo cáo này đã được xử lý trước đó.', 422);
  }

  await db.reports.update({
    where: { id: report.id },
    data: { status, updated_at: dbNow() },
  });

  return apiSuccess(
    null,
    status === 'resolved' ? 'Đã xử lý báo cáo!' : 'Đã bác bỏ báo cáo.',
  );
}
