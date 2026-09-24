import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { dbNow } from '@/lib/db-time';
import { BROKER_PROFILE_URL, readRejectionReason } from '@/lib/broker-review';

/** PUT /api/v2/admin/broker-certifications/{id}/reject  body: { rejection_reason } (bắt buộc). */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy hồ sơ.', 404);

  const reason = readRejectionReason(await request.json().catch(() => ({})));
  if (!reason) return apiError('Vui lòng nhập lý do từ chối (5–500 ký tự).', 422);

  const cert = await db.broker_certifications.findUnique({ where: { id: BigInt(id) } });
  if (!cert) return apiError('Không tìm thấy hồ sơ.', 404);
  if (cert.status !== 'pending') return apiError('Hồ sơ này đã được xử lý.', 422);

  const now = dbNow();
  await db.$transaction([
    db.broker_certifications.update({
      where: { id: cert.id },
      data: { status: 'rejected', rejection_reason: reason, reviewed_by: guard.id, reviewed_at: now, updated_at: now },
    }),
    db.users.update({ where: { id: cert.user_id }, data: { is_certified: false, updated_at: now } }),
    db.notifications.create({
      data: {
        user_id: cert.user_id, type: 'system', title: 'Hồ sơ chứng chỉ hành nghề bị từ chối',
        body: `Lý do: ${reason}`, data: { action_url: BROKER_PROFILE_URL }, is_read: false, created_at: now, updated_at: now,
      },
    }),
  ]);
  return apiSuccess({ id: cert.id, status: 'rejected' }, 'Đã từ chối hồ sơ.');
}
