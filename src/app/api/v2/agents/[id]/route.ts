import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { mapPropertyResource, type WardRow } from '@/lib/api-resources/property-resource';

/**
 * GET /api/v2/agents/[id] — hồ sơ một nhà môi giới kèm các tin đang hiển thị.
 *
 * Chỉ trả tin `active`: hồ sơ công khai không được lộ tin nháp/chờ duyệt/bị từ chối của
 * người khác.
 */

const PROPERTY_INCLUDE = {
  provinces: { select: { id: true, name: true, slug: true } },
  districts: { select: { id: true, name: true, slug: true } },
  categories: { select: { id: true, name: true, slug: true, icon: true } },
  users: {
    select: { id: true, name: true, phone: true, avatar: true, role: true, rating: true, total_listings: true },
  },
  property_media: {
    select: { id: true, type: true, url: true, thumbnail: true, caption: true, is_primary: true, sort_order: true },
  },
} as const;

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy nhà môi giới.', 404);

  const agent = await db.users.findFirst({
    where: { id: BigInt(id), role: 'agent' },
    select: {
      id: true,
      name: true,
      avatar: true,
      phone: true,
      email: true,
      bio: true,
      address: true,
      rating: true,
      agency_name: true,
      created_at: true,
      districts: { select: { id: true, name: true } },
      provinces: { select: { id: true, name: true } },
    },
  });
  if (!agent) return apiError('Không tìm thấy nhà môi giới.', 404);

  const [properties, reviewCount, verification, reviews] = await Promise.all([
    db.properties.findMany({
      where: { user_id: agent.id, status: 'active' },
      orderBy: [{ is_vip: 'desc' }, { created_at: 'desc' }],
      take: 24,
      include: PROPERTY_INCLUDE,
    }),
    db.reviews.count({ where: { agent_id: agent.id } }),
    db.verifications.findFirst({
      where: { user_id: agent.id, type: 'agent', status: 'approved' },
      select: { verified_at: true, license_number: true },
    }),
    db.reviews.findMany({
      where: { agent_id: agent.id },
      orderBy: { created_at: 'desc' },
      take: 20,
      select: {
        id: true,
        rating: true,
        comment: true,
        created_at: true,
        // Người viết đánh giá — chỉ lấy tên và ảnh, không lộ email/điện thoại của họ.
        users_reviews_reviewer_idTousers: { select: { id: true, name: true, avatar: true } },
      },
    }),
  ]);

  const wardIds = [...new Set(properties.map((p) => p.ward_id).filter((w): w is bigint => w !== null))];
  const wards: WardRow[] = wardIds.length
    ? await db.wards.findMany({ where: { id: { in: wardIds } }, select: { id: true, name: true, slug: true } })
    : [];
  const wardMap = new Map(wards.map((w) => [w.id.toString(), w]));

  return apiSuccess({
    id: Number(agent.id),
    name: agent.name,
    avatar: agent.avatar,
    phone: agent.phone,
    // Không trả email ra hồ sơ công khai — tránh bị thu thập để gửi thư rác. Muốn liên hệ
    // thì dùng số điện thoại hoặc khung nhắn tin trong hệ thống.
    bio: agent.bio,
    address: agent.address,
    rating: Number(agent.rating),
    review_count: reviewCount,
    total_listings: properties.length,
    company: agent.agency_name,
    district: agent.districts ? { id: Number(agent.districts.id), name: agent.districts.name } : null,
    province: agent.provinces ? { id: Number(agent.provinces.id), name: agent.provinces.name } : null,
    verified: verification !== null,
    verified_at: verification?.verified_at ?? null,
    license_number: verification?.license_number ?? null,
    joined_at: agent.created_at,
    reviews: reviews.map((r) => ({
      id: Number(r.id),
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      reviewer: {
        id: Number(r.users_reviews_reviewer_idTousers.id),
        name: r.users_reviews_reviewer_idTousers.name,
        avatar: r.users_reviews_reviewer_idTousers.avatar,
      },
    })),
    properties: properties.map((p) =>
      mapPropertyResource(p, p.ward_id !== null ? (wardMap.get(p.ward_id.toString()) ?? null) : null)
    ),
  });
}
