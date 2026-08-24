import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/api-response';
import { forbiddenResponse, getAuthUser, unauthenticatedResponse, type AuthUser } from '@/lib/auth';

const MAX_TAKE = 200;
const MAX_CONTENT_LENGTH = 2000;

const PARTNER_SELECT = {
  id: true,
  name: true,
  avatar: true,
  phone: true,
  role: true,
  rating: true,
  total_listings: true,
} as const;

const PROPERTY_SELECT = {
  id: true,
  slug: true,
  title: true,
  type: true,
  price: true,
  price_unit: true,
  thumbnail: true,
  address: true,
} as const;

/**
 * Xác thực + kiểm tra user CÓ trong hội thoại. Trả 403 khi không phải participant —
 * không dùng 404 vì hội thoại có tồn tại, chỉ là không được phép xem.
 */
async function loadConversationForParticipant(request: Request, rawId: string) {
  const user = await getAuthUser(request);
  if (!user) return { error: unauthenticatedResponse() };
  if (!/^\d+$/.test(rawId)) return { error: apiError('Không tìm thấy hội thoại.', 404) };

  const conversationId = BigInt(rawId);
  const conversation = await db.conversations.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      uuid: true,
      last_message: true,
      last_message_at: true,
      properties: { select: PROPERTY_SELECT },
    },
  });
  if (!conversation) return { error: apiError('Không tìm thấy hội thoại.', 404) };

  const membership = await db.conversation_participants.findUnique({
    where: { conversation_id_user_id: { conversation_id: conversationId, user_id: user.id } },
  });
  if (!membership) return { error: forbiddenResponse() };

  return { user: user as AuthUser, conversationId, conversation };
}

/**
 * GET /api/v2/my/conversations/[id]/messages — tin nhắn trong hội thoại (cũ → mới),
 * kèm thông tin đối tác + tin đăng để trang chi tiết không cần gọi thêm API.
 * Đồng thời đánh dấu đã đọc các tin của người khác (giống hành vi mở hộp thoại chat).
 */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await loadConversationForParticipant(request, id);
  if ('error' in guard) return guard.error;
  const { user, conversationId, conversation } = guard;

  const [messages, partnerRow] = await Promise.all([
    db.messages.findMany({
      where: { conversation_id: conversationId },
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
      take: MAX_TAKE,
      select: {
        id: true,
        sender_id: true,
        type: true,
        content: true,
        attachment_url: true,
        is_read: true,
        read_at: true,
        created_at: true,
      },
    }),
    db.conversation_participants.findFirst({
      where: { conversation_id: conversationId, user_id: { not: user.id } },
      select: { users: { select: PARTNER_SELECT } },
    }),
  ]);

  const now = new Date();
  await db.$transaction([
    db.messages.updateMany({
      where: { conversation_id: conversationId, sender_id: { not: user.id }, is_read: false },
      data: { is_read: true, read_at: now, updated_at: now },
    }),
    db.conversation_participants.update({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: user.id } },
      data: { unread_count: 0, last_read_at: now },
    }),
  ]);

  return apiSuccess({
    conversation: {
      id: conversation.id,
      uuid: conversation.uuid,
      participant: partnerRow?.users ?? null,
      property: conversation.properties ?? null,
    },
    current_user_id: user.id,
    data: messages,
  });
}

/**
 * POST /api/v2/my/conversations/[id]/messages — gửi tin nhắn text vào hội thoại.
 * Chỉ participant gửi được. Cập nhật last_message của hội thoại và tăng unread_count
 * cho các participant còn lại trong cùng transaction.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await loadConversationForParticipant(request, id);
  if ('error' in guard) return guard.error;
  const { user, conversationId } = guard;

  const body = await request.json().catch(() => ({}));
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content) {
    return apiError('Dữ liệu không hợp lệ.', 422, { content: ['Nội dung tin nhắn không được để trống.'] });
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return apiError('Dữ liệu không hợp lệ.', 422, {
      content: [`Nội dung tin nhắn không được lớn hơn ${MAX_CONTENT_LENGTH} ký tự.`],
    });
  }

  const now = new Date();
  const message = await db.$transaction(async (tx) => {
    // Prisma không tự set created_at/updated_at (cột nullable, Laravel quản lý ở tầng PHP).
    const created = await tx.messages.create({
      data: {
        conversation_id: conversationId,
        sender_id: user.id,
        type: 'text',
        content,
        created_at: now,
        updated_at: now,
      },
      select: {
        id: true,
        sender_id: true,
        type: true,
        content: true,
        attachment_url: true,
        is_read: true,
        read_at: true,
        created_at: true,
      },
    });

    await tx.conversations.update({
      where: { id: conversationId },
      data: { last_message: content, last_message_at: now, updated_at: now },
    });

    await tx.conversation_participants.updateMany({
      where: { conversation_id: conversationId, user_id: { not: user.id } },
      data: { unread_count: { increment: 1 } },
    });

    return created;
  });

  return apiSuccess(message, 'Đã gửi tin nhắn.', 201);
}
