import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';

/** PUT /api/v2/my/notifications/read-all — đánh dấu đã đọc toàn bộ thông báo của user. */
export async function PUT(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const now = new Date();
  const result = await db.notifications.updateMany({
    where: { user_id: user.id, is_read: false },
    data: { is_read: true, read_at: now, updated_at: now },
  });

  return apiSuccess({ updated: result.count }, 'Đã đánh dấu tất cả thông báo là đã đọc.');
}
