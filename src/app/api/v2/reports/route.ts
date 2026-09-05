import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';
import { isReportReason, isReportType } from '@/lib/reports';
import { dbNow, dbAgo } from '@/lib/db-time';

/**
 * POST /api/v2/reports — người dùng báo cáo một tin đăng (hoặc một tài khoản) vi phạm.
 *
 * Endpoint này TRƯỚC ĐÂY KHÔNG TỒN TẠI. Nút "Báo cáo tin đăng vi phạm" ở trang chi tiết là một
 * cái nút chết (không có onClick), nên bảng `reports` không bao giờ nhận được dòng nào — trong
 * khi trang quản trị lại hiển thị sẵn mấy báo cáo bịa. Cả chuỗi đứt từ đầu tới cuối.
 *
 * Bắt buộc đăng nhập: cột `reporter_id` là khoá ngoại NOT NULL trỏ sang `users`, và báo cáo ẩn
 * danh thì không truy được trách nhiệm khi bị lạm dụng để hạ uy tín đối thủ.
 */

const DESCRIPTION_MAX = 2000;
/** Cùng người báo cáo + cùng đối tượng trong khoảng này thì coi là bấm lại, không tạo dòng mới. */
const DEDUPE_HOURS = 24;

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const body = await request.json().catch(() => ({}));

  const type = body?.type ?? 'property';
  if (!isReportType(type)) return apiError('Loại báo cáo không hợp lệ.', 422);

  const reason = body?.reason;
  if (!reason) return apiError('Vui lòng chọn lý do báo cáo.', 422);
  if (!isReportReason(reason)) return apiError('Lý do báo cáo không hợp lệ.', 422);

  const description =
    typeof body?.description === 'string' && body.description.trim()
      ? body.description.trim().slice(0, DESCRIPTION_MAX)
      : null;

  // Client trang chi tiết chỉ biết slug của tin, không biết id.
  const rawTargetId = body?.target_id;
  const slug = typeof body?.property_slug === 'string' ? body.property_slug.trim() : '';

  let targetId: bigint | null = null;
  if (typeof rawTargetId === 'number' || typeof rawTargetId === 'string') {
    if (/^\d+$/.test(String(rawTargetId))) targetId = BigInt(String(rawTargetId));
  }
  if (!targetId && type === 'property' && slug) {
    const property = await db.properties
      .findFirst({ where: { slug }, select: { id: true } })
      .catch(() => null);
    if (property) targetId = property.id;
  }
  if (!targetId) return apiError('Không xác định được đối tượng bị báo cáo.', 422);

  // Đối tượng phải có thật — nếu không thì báo cáo sẽ nằm chết trong bảng, quản trị viên mở ra
  // chỉ thấy một id trỏ vào hư không.
  const targetExists =
    type === 'property'
      ? await db.properties.findUnique({ where: { id: targetId }, select: { id: true } })
      : await db.users.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!targetExists) return apiError('Không tìm thấy đối tượng bị báo cáo.', 404);

  const since = dbAgo(DEDUPE_HOURS * 60 * 60 * 1000);
  const duplicated = await db.reports.findFirst({
    where: {
      reporter_id: user.id,
      type,
      target_id: targetId,
      created_at: { gte: since },
    },
    select: { id: true },
  });
  if (duplicated) {
    return apiSuccess(null, 'Bạn đã báo cáo nội dung này. Chúng tôi đang xem xét.');
  }

  const now = dbNow();
  await db.reports.create({
    data: {
      reporter_id: user.id,
      type,
      target_id: targetId,
      reason,
      description,
      status: 'pending',
      created_at: now,
      updated_at: now,
    },
  });

  return apiSuccess(null, 'Đã gửi báo cáo. Cảm ơn bạn đã giúp chúng tôi giữ nội dung sạch.', 201);
}
