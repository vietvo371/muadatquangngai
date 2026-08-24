import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';

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
 * GET /api/v2/my/conversations — hội thoại mà user đang đăng nhập tham gia.
 * Mới nhất trước (theo last_message_at), kèm đối tác + tin nhắn cuối + số chưa đọc.
 *
 * Đối tác được lấy bằng 1 query riêng cho toàn bộ conversation_id (thay vì include lồng
 * theo từng dòng) để tránh N+1.
 */
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const rows = await db.conversation_participants.findMany({
    where: { user_id: user.id },
    include: {
      conversations: {
        select: {
          id: true,
          uuid: true,
          last_message: true,
          last_message_at: true,
          created_at: true,
          properties: { select: PROPERTY_SELECT },
        },
      },
    },
  });

  if (rows.length === 0) return apiSuccess({ data: [], unread_total: 0 });

  const conversationIds = rows.map((r) => r.conversation_id);
  const partnerRows = await db.conversation_participants.findMany({
    where: { conversation_id: { in: conversationIds }, user_id: { not: user.id } },
    select: { conversation_id: true, users: { select: PARTNER_SELECT } },
  });

  const partnerByConversation = new Map<string, (typeof partnerRows)[number]['users']>();
  for (const row of partnerRows) {
    // Hội thoại 1-1: giữ đối tác đầu tiên tìm được.
    if (!partnerByConversation.has(row.conversation_id.toString())) {
      partnerByConversation.set(row.conversation_id.toString(), row.users);
    }
  }

  const data = rows
    .map((row) => ({
      id: row.conversations.id,
      uuid: row.conversations.uuid,
      unread_count: row.unread_count,
      last_read_at: row.last_read_at,
      last_message: row.conversations.last_message,
      last_message_at: row.conversations.last_message_at,
      created_at: row.conversations.created_at,
      participant: partnerByConversation.get(row.conversation_id.toString()) ?? null,
      property: row.conversations.properties ?? null,
    }))
    .sort((a, b) => {
      const at = a.last_message_at?.getTime() ?? a.created_at?.getTime() ?? 0;
      const bt = b.last_message_at?.getTime() ?? b.created_at?.getTime() ?? 0;
      return bt - at;
    });

  const unreadTotal = rows.reduce((sum, row) => sum + row.unread_count, 0);

  return apiSuccess({ data, unread_total: unreadTotal });
}
