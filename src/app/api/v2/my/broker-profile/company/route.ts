import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';
import { dbNow } from '@/lib/db-time';
import { BROKER_ROLE } from '@/lib/broker-eligibility';
import { ensureCompanyForAgency, loadBrokerProfile } from '@/lib/broker-profile';

const isIdValue = (v: unknown): v is number | string =>
  (typeof v === 'number' && Number.isInteger(v) && v > 0) || (typeof v === 'string' && /^\d+$/.test(v));

/**
 * PUT /api/v2/my/broker-profile/company  body: { company_id } hoặc { agency_id }
 * Chọn Công ty/Sàn trực thuộc. Chỉ chọn được công ty ĐÃ DUYỆT (Notion "Profile – Công ty/Sàn"), công ty
 * chính mình vừa đề xuất đang chờ duyệt, hoặc sàn môi giới thật trong danh bạ Doanh nghiệp (agency_id).
 */
export async function PUT(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();
  if (user.role !== BROKER_ROLE) return apiError('Chỉ tài khoản môi giới mới chọn Công ty/Sàn trực thuộc.', 403);

  const body = await request.json().catch(() => ({}));
  let company = null;
  if (isIdValue(body?.company_id)) {
    const found = await db.broker_companies.findUnique({ where: { id: BigInt(body.company_id) } });
    const selectable = found && (found.status === 'approved' || (found.status === 'pending' && found.created_by === user.id));
    company = selectable ? found : null;
  } else if (isIdValue(body?.agency_id)) {
    company = await ensureCompanyForAgency(BigInt(body.agency_id), user.id);
  } else {
    return apiError('Vui lòng chọn Công ty/Sàn giao dịch.', 422);
  }
  if (!company) return apiError('Công ty/Sàn này không có trong danh sách được chọn.', 422);

  await db.users.update({ where: { id: user.id }, data: { broker_company_id: company.id, updated_at: dbNow() } });
  return apiSuccess(await loadBrokerProfile(user.id), 'Đã cập nhật Công ty/Sàn giao dịch trực thuộc.');
}
