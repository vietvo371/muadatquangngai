import { apiSuccess, apiError } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';
import { loadBrokerProfile } from '@/lib/broker-profile';

/** GET /api/v2/my/broker-profile — trạng thái chứng chỉ + Công ty/Sàn + đủ điều kiện đăng tin chưa. */
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();
  const profile = await loadBrokerProfile(user.id);
  if (!profile) return apiError('Không tìm thấy tài khoản.', 404);
  return apiSuccess(profile);
}
