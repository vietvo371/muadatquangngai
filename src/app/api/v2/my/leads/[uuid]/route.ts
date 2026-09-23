import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';
import { dbNow } from '@/lib/db-time';
import { isLeadStatus, LEAD_STATUS_LABEL } from '@/lib/leads';

/**
 * PATCH /api/v2/my/leads/{uuid}  body: { status: 'new' | 'contacted' | 'closed' }
 *
 * Môi giới đánh dấu đã gọi lại / đã chốt một khách hàng. Tìm theo uuid VÀ owner_id cùng lúc:
 * lead của người khác trả 404 như không tồn tại, không lộ việc nó có thật.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ uuid: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const { uuid } = await params;
  const body = await request.json().catch(() => ({}));
  if (!isLeadStatus(body?.status)) return apiError('Trạng thái không hợp lệ.', 422);

  const lead = await db.leads.findFirst({ where: { uuid, owner_id: user.id }, select: { id: true } });
  if (!lead) return apiError('Không tìm thấy khách hàng này.', 404);

  await db.leads.update({ where: { id: lead.id }, data: { status: body.status, updated_at: dbNow() } });
  return apiSuccess({ uuid, status: body.status }, `Đã chuyển sang "${LEAD_STATUS_LABEL[body.status as keyof typeof LEAD_STATUS_LABEL]}".`);
}
