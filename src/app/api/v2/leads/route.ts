import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getAuthUser } from '@/lib/auth';
import { isValidPhone, isValidEmail } from '@/lib/property-form-config';

/**
 * POST /api/v2/leads — khách gửi "Yêu cầu tư vấn" từ trang chi tiết BĐS.
 *
 * Trước đây form này ở `ContactSidebar` chỉ là 3 ô input + nút bấm KHÔNG nối gì: khách điền
 * xong bấm "Gửi yêu cầu" thì không có gì xảy ra và chủ tin mất luôn khách hàng tiềm năng.
 *
 * Endpoint CÔNG KHAI (khách chưa đăng nhập vẫn gửi được — đó là mục đích của lead). Vì công
 * khai nên có chặn spam cơ bản: giới hạn độ dài, và bỏ qua lần gửi trùng trong thời gian ngắn.
 */

const MESSAGE_MAX = 2000;
const NAME_MAX = 255;
/** Cùng số điện thoại + cùng tin trong khoảng này thì coi là bấm lại, không tạo lead mới. */
const DEDUPE_MINUTES = 10;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const phoneRaw = typeof body?.phone === 'string' ? body.phone.trim() : '';
  if (!phoneRaw) return apiError('Vui lòng nhập số điện thoại.', 422);
  if (!isValidPhone(phoneRaw)) return apiError('Số điện thoại không hợp lệ.', 422);

  const email = typeof body?.email === 'string' && body.email.trim() ? body.email.trim() : null;
  if (email && !isValidEmail(email)) return apiError('Email không hợp lệ.', 422);

  const name = typeof body?.name === 'string' && body.name.trim()
    ? body.name.trim().slice(0, NAME_MAX)
    : null;
  const message = typeof body?.message === 'string' && body.message.trim()
    ? body.message.trim().slice(0, MESSAGE_MAX)
    : null;

  // Xác định tin + chủ tin từ slug (client chỉ biết slug). Sai slug vẫn nhận lead nhưng không
  // gắn được tin — thà giữ liên hệ của khách còn hơn bỏ mất vì lý do kỹ thuật.
  const slug = typeof body?.property_slug === 'string' ? body.property_slug.trim() : '';
  let propertyId: bigint | null = null;
  let ownerId: bigint | null = null;
  if (slug) {
    const property = await db.properties
      .findFirst({ where: { slug }, select: { id: true, user_id: true } })
      .catch(() => null);
    if (property) {
      propertyId = property.id;
      ownerId = property.user_id;
    }
  }

  const since = new Date(Date.now() - DEDUPE_MINUTES * 60 * 1000);
  const duplicated = await db.leads.findFirst({
    where: { phone: phoneRaw, property_id: propertyId, created_at: { gte: since } },
    select: { id: true },
  });
  if (duplicated) {
    return apiSuccess(null, 'Yêu cầu của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ sớm.');
  }

  // Khách đã đăng nhập thì ghi nhận luôn (không bắt buộc) để chủ tin biết ai hỏi.
  const viewer = await getAuthUser(request).catch(() => null);

  const now = new Date();
  await db.leads.create({
    data: {
      uuid: crypto.randomUUID(),
      property_id: propertyId,
      owner_id: ownerId,
      name: name ?? viewer?.name ?? null,
      phone: phoneRaw,
      email: email ?? null,
      message,
      source: 'property_detail',
      status: 'new',
      created_at: now,
      updated_at: now,
    },
  });

  return apiSuccess(null, 'Đã gửi yêu cầu. Chủ tin sẽ liên hệ với bạn sớm nhất.');
}
