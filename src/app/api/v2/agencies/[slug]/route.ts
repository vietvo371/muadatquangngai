import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { mapPropertyResource, type WardRow } from '@/lib/api-resources/property-resource';

/**
 * GET /api/v2/agencies/[slug] — hồ sơ doanh nghiệp: thông tin, môi giới thuộc doanh nghiệp,
 * và các tin đang hiển thị của họ.
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

export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  const agency = await db.agencies.findFirst({
    where: { slug, is_active: true },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      description: true,
      address: true,
      phone: true,
      email: true,
      website: true,
      business_type: true,
      is_verified: true,
      created_at: true,
      districts: { select: { id: true, name: true } },
      provinces: { select: { id: true, name: true } },
      users: {
        where: { role: 'agent' },
        select: { id: true, name: true, avatar: true, phone: true, rating: true, district_id: true },
      },
    },
  });
  if (!agency) return apiError('Không tìm thấy doanh nghiệp.', 404);

  const agentIds = agency.users.map((u) => u.id);

  const [properties, listingCounts] = await Promise.all([
    agentIds.length
      ? db.properties.findMany({
          where: { user_id: { in: agentIds }, status: 'active' },
          orderBy: [{ is_vip: 'desc' }, { created_at: 'desc' }],
          take: 24,
          include: PROPERTY_INCLUDE,
        })
      : [],
    agentIds.length
      ? db.properties.groupBy({
          by: ['user_id'],
          where: { user_id: { in: agentIds }, status: 'active' },
          _count: { _all: true },
        })
      : [],
  ]);

  const listingByUser = new Map(listingCounts.map((r) => [r.user_id.toString(), r._count._all]));
  const totalListings = [...listingByUser.values()].reduce((a, b) => a + b, 0);

  const wardIds = [...new Set(properties.map((p) => p.ward_id).filter((w): w is bigint => w !== null))];
  const wards: WardRow[] = wardIds.length
    ? await db.wards.findMany({ where: { id: { in: wardIds } }, select: { id: true, name: true, slug: true } })
    : [];
  const wardMap = new Map(wards.map((w) => [w.id.toString(), w]));

  return apiSuccess({
    id: Number(agency.id),
    name: agency.name,
    slug: agency.slug,
    logo: agency.logo,
    description: agency.description,
    address: agency.address,
    phone: agency.phone,
    email: agency.email,
    website: agency.website,
    business_type: agency.business_type,
    verified: agency.is_verified,
    created_at: agency.created_at,
    district: agency.districts ? { id: Number(agency.districts.id), name: agency.districts.name } : null,
    province: agency.provinces ? { id: Number(agency.provinces.id), name: agency.provinces.name } : null,
    agent_count: agency.users.length,
    total_listings: totalListings,
    agents: agency.users.map((u) => ({
      id: Number(u.id),
      name: u.name,
      avatar: u.avatar,
      phone: u.phone,
      rating: Number(u.rating),
      total_listings: listingByUser.get(u.id.toString()) ?? 0,
    })),
    properties: properties.map((p) =>
      mapPropertyResource(p, p.ward_id !== null ? (wardMap.get(p.ward_id.toString()) ?? null) : null)
    ),
  });
}
