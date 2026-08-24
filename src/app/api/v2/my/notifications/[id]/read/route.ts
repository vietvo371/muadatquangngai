import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';

/**
 * PUT /api/v2/my/notifications/[id]/read — đánh dấu 1 thông báo là đã đọc.
 * Chỉ tác động lên thông báo thuộc user đang đăng nhập; của người khác trả 404 để không
 * tiết lộ sự tồn tại của bản ghi.
 */
export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy thông báo.', 404);

  const now = new Date();
  const result = await db.notifications.updateMany({
    where: { id: BigInt(id), user_id: user.id },
    data: { is_read: true, read_at: now, updated_at: now },
  });

  if (result.count === 0) {
    // Có thể do id không tồn tại, không thuộc user, hoặc đã đọc trước đó — phân biệt bằng 1 query.
    const exists = await db.notifications.findFirst({
      where: { id: BigInt(id), user_id: user.id },
      select: { id: true },
    });
    if (!exists) return apiError('Không tìm thấy thông báo.', 404);
  }

  return apiSuccess(null, 'Đã đánh dấu đã đọc.');
}
