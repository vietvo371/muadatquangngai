import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { dbNow } from '@/lib/db-time';
import { BROKER_PROFILE_URL, readRejectionReason } from '@/lib/broker-review';

/**
 * POST /api/v2/admin/businesses/[id]/reject  body: { rejection_reason } — BẮT BUỘC lý do; status =
 * rejected, lưu rejected_by / rejected_at (Notion "Admin → Từ chối doanh nghiệp"). Dùng cho doanh
 * nghiệp chờ duyệt, hoặc để ẩn một doanh nghiệp đang hoạt động (thay cho công tắc "Đang hoạt động" cũ).
 * Môi giới trực thuộc mất điều kiện đăng tin cho tới khi chọn doanh nghiệp khác — nên được báo.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy doanh nghiệp.', 404);

  const reason = readRejectionReason(await request.json().catch(() => ({})));
  if (!reason) return apiError('Vui lòng nhập lý do từ chối (5–500 ký tự).', 422);

  const business = await db.businesses.findUnique({ where: { id: BigInt(id) } });
  if (!business) return apiError('Không tìm thấy doanh nghiệp.', 404);
  if (business.status === 'rejected') return apiError('Doanh nghiệp này đã bị từ chối.', 422);

  const now = dbNow();
  const members = await db.users.findMany({ where: { broker_company_id: business.id, deleted_at: null }, select: { id: true } });
  const recipients = [...new Set([...members.map((m) => m.id.toString()), ...(business.proposed_by ? [business.proposed_by.toString()] : [])])];

  await db.$transaction([
    db.businesses.update({
      where: { id: business.id },
      data: { status: 'rejected', rejection_reason: reason, rejected_by: guard.id, rejected_at: now, updated_at: now },
    }),
    ...recipients.map((userId) =>
      db.notifications.create({
        data: {
          user_id: BigInt(userId), type: 'system', title: 'Doanh nghiệp / Sàn giao dịch bị từ chối',
          body: `${business.name}: ${reason}`, data: { action_url: BROKER_PROFILE_URL },
          is_read: false, created_at: now, updated_at: now,
        },
      })
    ),
  ]);
  return apiSuccess({ id: Number(business.id), status: 'rejected' }, `Đã từ chối ${business.name}.`);
}
