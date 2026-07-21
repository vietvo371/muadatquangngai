import { db } from '@/lib/db';
import { apiPaginated, buildPaginationMeta } from '@/lib/api-response';
import { isValidAgencyBusinessType } from '@/lib/agency-business-types';

/**
 * GET /api/v2/agencies — danh bạ doanh nghiệp: chủ đầu tư, nhà thầu, thiết kế, sàn giao
 * dịch BĐS, nội thất, vật liệu xây dựng...
 *
 * Query: ?district_id= &business_type= &q= &sort=listings|agents|newest &page= &per_page=
 */

const PER_PAGE_DEFAULT = 12;
const PER_PAGE_MAX = 48;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const perPageParam = parseInt(searchParams.get('per_page') ?? String(PER_PAGE_DEFAULT), 10);
  const perPage = Number.isFinite(perPageParam)
    ? Math.min(Math.max(perPageParam, 1), PER_PAGE_MAX)
    : PER_PAGE_DEFAULT;

  const districtId = searchParams.get('district_id');
  const q = searchParams.get('q')?.trim();
  const businessType = searchParams.get('business_type');

  const where = {
    is_active: true,
    ...(districtId && /^\d+$/.test(districtId) ? { district_id: BigInt(districtId) } : {}),
    ...(businessType && isValidAgencyBusinessType(businessType) ? { business_type: businessType } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
  };

  const rows = await db.agencies.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      description: true,
      address: true,
      phone: true,
      website: true,
      business_type: true,
      is_verified: true,
      is_demo: true,
      created_at: true,
      districts: { select: { id: true, name: true } },
      provinces: { select: { id: true, name: true } },
      users: { select: { id: true } },
    },
  });

  // Đếm tin đang hiển thị theo doanh nghiệp: gom qua các môi giới thuộc doanh nghiệp đó.
  const allUserIds = rows.flatMap((a) => a.users.map((u) => u.id));
  const listingCounts = allUserIds.length
    ? await db.properties.groupBy({
        by: ['user_id'],
        where: { user_id: { in: allUserIds }, status: 'active' },
        _count: { _all: true },
      })
    : [];
  const listingByUser = new Map(listingCounts.map((r) => [r.user_id.toString(), r._count._all]));

  const enriched = rows.map((a) => ({
    row: a,
    agentCount: a.users.length,
    listingCount: a.users.reduce((sum, u) => sum + (listingByUser.get(u.id.toString()) ?? 0), 0),
  }));

  // Xếp trong bộ nhớ vì "số tin đang hiển thị" phải cộng qua nhiều môi giới — không có cột
  // nào để orderBy. Danh bạ cấp tỉnh chỉ cỡ trăm doanh nghiệp nên không thành vấn đề.
  const sort = searchParams.get('sort') ?? 'listings';
  enriched.sort((a, b) => {
    if (sort === 'newest') {
      return (b.row.created_at?.getTime() ?? 0) - (a.row.created_at?.getTime() ?? 0);
    }
    if (sort === 'agents') return b.agentCount - a.agentCount || b.listingCount - a.listingCount;
    return b.listingCount - a.listingCount || b.agentCount - a.agentCount;
  });

  const total = enriched.length;
  const pageRows = enriched.slice((page - 1) * perPage, page * perPage);

  // Thẻ "khu vực hoạt động" (kiểu "Bán nhà riêng ở Xã Bình Sơn") — gộp từ tin đăng THẬT của
  // TẤT CẢ môi giới thuộc doanh nghiệp, không phải bịa. Chỉ tính cho các doanh nghiệp trên
  // trang hiện tại, không phải toàn bộ danh bạ.
  const pageUserIds = pageRows.flatMap(({ row }) => row.users.map((u) => u.id));
  const coverageGroups = pageUserIds.length
    ? await db.properties.groupBy({
        by: ['user_id', 'type', 'category_id', 'district_id'],
        where: { user_id: { in: pageUserIds }, status: 'active' },
        _count: { _all: true },
      })
    : [];
  const coverageCategoryIds = [...new Set(coverageGroups.map((g) => g.category_id))];
  const coverageDistrictIds = [...new Set(coverageGroups.map((g) => g.district_id))];
  const [coverageCategories, coverageDistricts] = await Promise.all([
    coverageCategoryIds.length
      ? db.categories.findMany({ where: { id: { in: coverageCategoryIds } }, select: { id: true, name: true } })
      : [],
    coverageDistrictIds.length
      ? db.districts.findMany({ where: { id: { in: coverageDistrictIds } }, select: { id: true, name: true } })
      : [],
  ]);
  const categoryNameById = new Map(coverageCategories.map((c) => [c.id.toString(), c.name]));
  const districtNameById = new Map(coverageDistricts.map((d) => [d.id.toString(), d.name]));

  // user_id -> agency_id, để gộp tin của nhiều môi giới cùng công ty vào một danh sách thẻ.
  const agencyByUser = new Map<string, string>();
  for (const { row } of pageRows) for (const u of row.users) agencyByUser.set(u.id.toString(), row.id.toString());

  const coverageByAgency = new Map<string, Map<string, { label: string; href: string; count: number }>>();
  for (const g of coverageGroups) {
    const agencyId = agencyByUser.get(g.user_id.toString());
    const categoryName = categoryNameById.get(g.category_id.toString());
    const districtName = districtNameById.get(g.district_id.toString());
    if (!agencyId || !categoryName || !districtName) continue;
    const verb = g.type === 'sell' ? 'Bán' : 'Cho thuê';
    const href = `/${g.type === 'sell' ? 'mua-ban' : 'cho-thue'}?category=${g.category_id}&khu_vuc=${g.district_id}`;
    const inner = coverageByAgency.get(agencyId) ?? new Map();
    const existing = inner.get(href);
    if (existing) existing.count += g._count._all;
    else inner.set(href, { label: `${verb} ${categoryName.toLowerCase()} ở ${districtName}`, href, count: g._count._all });
    coverageByAgency.set(agencyId, inner);
  }

  const data = pageRows.map(({ row, agentCount, listingCount }) => ({
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    logo: row.logo,
    description: row.description,
    address: row.address,
    phone: row.phone,
    website: row.website,
    business_type: row.business_type,
    verified: row.is_verified,
    is_demo: row.is_demo,
    agent_count: agentCount,
    total_listings: listingCount,
    district: row.districts ? { id: Number(row.districts.id), name: row.districts.name } : null,
    province: row.provinces ? { id: Number(row.provinces.id), name: row.provinces.name } : null,
    coverage_areas: [...(coverageByAgency.get(row.id.toString())?.values() ?? [])]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
  }));

  return apiPaginated(data, buildPaginationMeta(total, page, perPage));
}
