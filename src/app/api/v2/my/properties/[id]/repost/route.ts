import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse, forbiddenResponse } from '@/lib/auth';
import { effectiveVipTier } from '@/lib/vip';

/**
 * POST /api/v2/my/properties/[id]/repost — đăng lại tin THƯỜNG đã hết hạn (miễn phí).
 *
 * Trước đây tin thường hết hạn là hết đường: nút "Gia hạn" trong Quản lý tin chỉ dành cho tin
 * VIP (route /renew có trừ tiền), nên chủ tin buộc phải nhập lại toàn bộ tin từ đầu.
 *
 * Chỉ cho đăng lại khi tin ĐÃ HẾT HẠN — không dùng để đẩy tin đang còn hạn lên đầu (muốn đẩy
 * thì mua gói Nổi bật/VIP), tránh biến chức năng miễn phí này thành cách bơm tin.
 */

/** Số ngày mặc định nếu chưa cấu hình gói miễn phí trong bảng packages. */
const DEFAULT_FREE_DAYS = 30;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy tin đăng.', 404);

  const property = await db.properties.findUnique({ where: { id: BigInt(id) } });
  if (!property || property.deleted_at !== null) return apiError('Không tìm thấy tin đăng.', 404);
  if (property.user_id !== user.id && user.role !== 'admin') return forbiddenResponse();

  // Tin còn hạn gói trả phí thì dùng chức năng Gia hạn (có trừ tiền), không đi đường miễn phí này.
  const tier = effectiveVipTier(property.is_vip, property.vip_expired_at);
  if (tier !== 'normal') {
    return apiError('Tin đang có gói hiển thị. Vui lòng dùng chức năng Gia hạn.', 422);
  }

  const now = new Date();
  if (property.expired_at !== null && property.expired_at.getTime() > now.getTime()) {
    return apiError('Tin vẫn còn hiệu lực, chưa cần đăng lại.', 422);
  }

  const freePackage = await db.packages
    .findFirst({ where: { type: 'normal', is_active: true }, orderBy: { id: 'asc' }, select: { duration_days: true } })
    .catch(() => null);
  const days = freePackage?.duration_days ?? DEFAULT_FREE_DAYS;

  const expiredAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  await db.properties.update({
    where: { id: property.id },
    data: {
      expired_at: expiredAt,
      // Đăng lại thì tính là tin mới trong danh sách (sắp xếp theo published_at).
      published_at: now,
      // Tin từng bị ẩn/hết hạn quay lại trạng thái đang hiển thị. Tin đang chờ duyệt giữ nguyên
      // để không vô tình bỏ qua bước kiểm duyệt.
      ...(property.status === 'active' || property.status === 'expired' || property.status === 'inactive'
        ? { status: 'active' }
        : {}),
      updated_at: now,
    },
  });

  return apiSuccess(
    { expired_at: expiredAt.toISOString(), days },
    `Đã đăng lại tin, hiển thị thêm ${days} ngày.`
  );
}
