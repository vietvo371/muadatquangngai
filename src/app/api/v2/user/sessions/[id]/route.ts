import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getAuthContext, unauthenticatedResponse } from '@/lib/auth';

const TOKENABLE_TYPE = 'App\\Models\\User';

/** DELETE /api/v2/user/sessions/[id] — thu hồi một phiên đăng nhập khác của chính mình. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(request);
  if (!ctx) return unauthenticatedResponse();

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy phiên đăng nhập.', 404);
  const tokenId = BigInt(id);

  // Phiên đang dùng thì để người dùng bấm Đăng xuất cho rõ nghĩa, tránh việc tự khoá mình
  // ra khỏi trang giữa lúc đang thao tác mà không hiểu vì sao.
  if (tokenId === ctx.tokenId) {
    return apiError('Đây là phiên bạn đang dùng. Hãy dùng chức năng Đăng xuất.', 422);
  }

  // Điều kiện tokenable_id đảm bảo không thu hồi được phiên của người khác.
  const deleted = await db.personal_access_tokens.deleteMany({
    where: { id: tokenId, tokenable_type: TOKENABLE_TYPE, tokenable_id: ctx.user.id },
  });
  if (deleted.count === 0) return apiError('Không tìm thấy phiên đăng nhập.', 404);

  return apiSuccess(null, 'Đã đăng xuất phiên đó.');
}
