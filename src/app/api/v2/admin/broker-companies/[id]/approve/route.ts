import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { dbNow } from '@/lib/db-time';
import { BROKER_PROFILE_URL } from '@/lib/broker-review';

/** PUT /api/v2/admin/broker-companies/{id}/approve — lưu approved_by, approved_at; báo các môi giới trực thuộc. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy Công ty/Sàn.', 404);

  const company = await db.broker_companies.findUnique({ where: { id: BigInt(id) } });
  if (!company) return apiError('Không tìm thấy Công ty/Sàn.', 404);
  if (company.status !== 'pending') return apiError('Công ty/Sàn này đã được xử lý.', 422);

  const now = dbNow();
  const members = await db.users.findMany({ where: { broker_company_id: company.id }, select: { id: true } });
  await db.$transaction([
    db.broker_companies.update({
      where: { id: company.id },
      data: { status: 'approved', rejection_reason: null, approved_by: guard.id, approved_at: now, updated_at: now },
    }),
    ...members.map((m) =>
      db.notifications.create({
        data: {
          user_id: m.id, type: 'system', title: 'Công ty/Sàn giao dịch đã được duyệt',
          body: `${company.name} đã được xác nhận.`, data: { action_url: BROKER_PROFILE_URL },
          is_read: false, created_at: now, updated_at: now,
        },
      })
    ),
  ]);
  return apiSuccess({ id: company.id, status: 'approved' }, `Đã duyệt ${company.name}.`);
}
