import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';

/** DELETE /api/v2/my/notifications/[id] — xoá 1 thông báo của chính user đang đăng nhập. */
export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy thông báo.', 404);

  const result = await db.notifications.deleteMany({ where: { id: BigInt(id), user_id: user.id } });
  if (result.count === 0) return apiError('Không tìm thấy thông báo.', 404);

  return apiSuccess(null, 'Đã xoá thông báo.');
}
