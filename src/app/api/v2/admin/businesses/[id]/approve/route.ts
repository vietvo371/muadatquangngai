import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { dbNow } from '@/lib/db-time';
import { BROKER_PROFILE_URL } from '@/lib/broker-review';

/**
 * POST /api/v2/admin/businesses/[id]/approve — status = active, lưu approved_by / approved_at (Notion
 * "Admin → Duyệt doanh nghiệp"). Dùng cho doanh nghiệp chờ duyệt, hoặc để bật lại doanh nghiệp đã
 * từ chối. Báo cho người đề xuất và các môi giới trực thuộc.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy doanh nghiệp.', 404);

  const business = await db.businesses.findUnique({ where: { id: BigInt(id) } });
  if (!business) return apiError('Không tìm thấy doanh nghiệp.', 404);
  if (business.status === 'active') return apiError('Doanh nghiệp này đang hoạt động.', 422);

  const now = dbNow();
  const members = await db.users.findMany({ where: { broker_company_id: business.id, deleted_at: null }, select: { id: true } });
  const recipients = [...new Set([...members.map((m) => m.id.toString()), ...(business.proposed_by ? [business.proposed_by.toString()] : [])])];

  await db.$transaction([
    db.businesses.update({
      where: { id: business.id },
      data: {
        status: 'active', approved_by: guard.id, approved_at: now,
        rejected_by: null, rejected_at: null, rejection_reason: null, updated_at: now,
      },
    }),
    ...recipients.map((userId) =>
      db.notifications.create({
        data: {
          user_id: BigInt(userId), type: 'system', title: 'Doanh nghiệp / Sàn giao dịch đã được duyệt',
          body: `${business.name} đã được xác nhận.`, data: { action_url: BROKER_PROFILE_URL },
          is_read: false, created_at: now, updated_at: now,
        },
      })
    ),
  ]);
  return apiSuccess({ id: Number(business.id), status: 'active' }, `Đã duyệt ${business.name}.`);
}
