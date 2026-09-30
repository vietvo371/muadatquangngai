import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { toVietnamIso8601 } from '@/lib/api-resources/carbon-format';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * GET /api/v2/my/notifications — thông báo của CHÍNH user đang đăng nhập, mới nhất trước.
 * Trả kèm unread_count tính từ DB (không tính ở client vì client chỉ thấy `limit` bản ghi).
 */
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const { searchParams } = new URL(request.url);
  const limitParam = parseInt(searchParams.get('limit') ?? '', 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;

  const [rows, unreadCount] = await Promise.all([
    db.notifications.findMany({
      where: { user_id: user.id },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        data: true,
        is_read: true,
        read_at: true,
        created_at: true,
      },
    }),
    db.notifications.count({ where: { user_id: user.id, is_read: false } }),
  ]);

  // created_at/read_at trong DB là giờ VN dạng thô: phải gắn +07:00 khi trả ra, nếu không
  // trình duyệt hiểu là UTC và "x giây trước" ra số âm (lệch 7 tiếng).
  const data = rows.map((row) => ({
    ...row,
    id: Number(row.id),
    created_at: toVietnamIso8601(row.created_at),
    read_at: toVietnamIso8601(row.read_at),
  }));

  return apiSuccess({ data, unread_count: unreadCount });
}
