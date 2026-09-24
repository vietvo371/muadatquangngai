import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';
import { dbNow } from '@/lib/db-time';
import { BROKER_ROLE } from '@/lib/broker-eligibility';
import { loadBrokerProfile } from '@/lib/broker-profile';

/**
 * PUT /api/v2/my/broker-profile/company  body: { company_id }
 * Chọn Công ty/Sàn trực thuộc. Chỉ chọn được công ty ĐÃ DUYỆT (Notion "Profile – Công ty/Sàn"),
 * hoặc công ty chính mình vừa đề xuất đang chờ duyệt.
 */
export async function PUT(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();
  if (user.role !== BROKER_ROLE) return apiError('Chỉ tài khoản môi giới mới chọn Công ty/Sàn trực thuộc.', 403);

  const body = await request.json().catch(() => ({}));
  const raw = body?.company_id;
  if (!(typeof raw === 'number' || (typeof raw === 'string' && /^\d+$/.test(raw)))) {
    return apiError('Vui lòng chọn Công ty/Sàn giao dịch.', 422);
  }
  const company = await db.broker_companies.findUnique({ where: { id: BigInt(raw) } });
  const selectable = company && (company.status === 'approved' || (company.status === 'pending' && company.created_by === user.id));
  if (!selectable) return apiError('Công ty/Sàn này không có trong danh sách được chọn.', 422);

  await db.users.update({ where: { id: user.id }, data: { broker_company_id: company.id, updated_at: dbNow() } });
  return apiSuccess(await loadBrokerProfile(user.id), 'Đã cập nhật Công ty/Sàn giao dịch trực thuộc.');
}
