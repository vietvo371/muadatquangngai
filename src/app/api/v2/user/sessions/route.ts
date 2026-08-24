import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { getAuthContext, unauthenticatedResponse } from '@/lib/auth';
import { toVietnamIso8601 } from '@/lib/api-resources/carbon-format';

const TOKENABLE_TYPE = 'App\\Models\\User';

/**
 * GET /api/v2/user/sessions — các phiên đăng nhập (token) còn hiệu lực của chính mình.
 *
 * Thay cho danh sách thiết bị BỊA trước đây ở /dashboard/settings ("iPhone 14 Pro Max •
 * Safari — Hà Nội, 2 ngày trước" hardcode cho mọi người dùng, kèm nút Đăng xuất không làm gì).
 *
 * LƯU Ý: bảng `personal_access_tokens` KHÔNG lưu user agent / IP nên không thể nói phiên này
 * ở thiết bị nào hay thành phố nào — chỉ trả thời điểm tạo và lần dùng gần nhất. Thà thiếu
 * thông tin còn hơn đoán sai thiết bị của người dùng.
 */
export async function GET(request: Request) {
  const ctx = await getAuthContext(request);
  if (!ctx) return unauthenticatedResponse();

  const now = new Date();
  const rows = await db.personal_access_tokens.findMany({
    where: {
      tokenable_type: TOKENABLE_TYPE,
      tokenable_id: ctx.user.id,
      OR: [{ expires_at: null }, { expires_at: { gt: now } }],
    },
    orderBy: [{ last_used_at: 'desc' }, { id: 'desc' }],
    select: { id: true, name: true, last_used_at: true, created_at: true },
  });

  return apiSuccess(
    rows.map((t) => ({
      id: Number(t.id),
      name: t.name,
      created_at: toVietnamIso8601(t.created_at),
      last_used_at: toVietnamIso8601(t.last_used_at),
      is_current: t.id === ctx.tokenId,
    }))
  );
}
