import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';
import { dbNow } from '@/lib/db-time';
import { BROKER_ROLE } from '@/lib/broker-eligibility';
import { loadBrokerProfile } from '@/lib/broker-profile';
import { SELECTABLE_BUSINESS_WHERE } from '@/lib/business';

const isIdValue = (v: unknown): v is number | string =>
  (typeof v === 'number' && Number.isInteger(v) && v > 0) || (typeof v === 'string' && /^\d+$/.test(v));

/**
 * PUT /api/v2/my/broker-profile/company  body: { business_id }  (company_id / agency_id: tên cũ, cùng id)
 * Chọn Doanh nghiệp / Sàn giao dịch trực thuộc. Chỉ chọn được doanh nghiệp môi giới đang hoạt động
 * và không phải demo (Notion "Dropdown Công ty/Sàn"), hoặc doanh nghiệp chính mình vừa đề xuất đang
 * chờ duyệt — doanh nghiệp đó vẫn chưa đủ điều kiện đăng tin cho tới khi Admin duyệt.
 */
export async function PUT(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();
  if (user.role !== BROKER_ROLE) return apiError('Chỉ tài khoản môi giới mới chọn Doanh nghiệp / Sàn trực thuộc.', 403);

  const body = await request.json().catch(() => ({}));
  const raw = body?.business_id ?? body?.company_id ?? body?.agency_id;
  if (!isIdValue(raw)) return apiError('Vui lòng chọn Doanh nghiệp / Sàn giao dịch.', 422);

  const business = await db.businesses.findFirst({
    where: {
      id: BigInt(raw),
      OR: [SELECTABLE_BUSINESS_WHERE, { status: 'pending', proposed_by: user.id }],
    },
    select: { id: true },
  });
  if (!business) return apiError('Doanh nghiệp / Sàn này không có trong danh sách được chọn.', 422);

  await db.users.update({ where: { id: user.id }, data: { broker_company_id: business.id, updated_at: dbNow() } });
  return apiSuccess(await loadBrokerProfile(user.id), 'Đã cập nhật Doanh nghiệp / Sàn giao dịch trực thuộc.');
}
