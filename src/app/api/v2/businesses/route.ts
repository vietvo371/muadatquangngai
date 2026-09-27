import { db } from '@/lib/db';
import { apiPaginated, apiSuccess, apiError, buildPaginationMeta } from '@/lib/api-response';
import { isValidAgencyBusinessType } from '@/lib/agency-business-types';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';
import { dbNow } from '@/lib/db-time';
import { validationErrorResponse } from '@/lib/validation';
import { BROKER_ROLE } from '@/lib/broker-eligibility';
import { loadBrokerProfile } from '@/lib/broker-profile';
import {
  PUBLIC_BUSINESS_WHERE, SELECTABLE_BUSINESS_WHERE, readBusinessInput, findDuplicateBusiness,
  duplicateBusinessMessage, uniqueBusinessSlug,
} from '@/lib/business';

/**
 * GET /api/v2/businesses — danh bạ Doanh nghiệp / Sàn giao dịch (chỉ doanh nghiệp đang hoạt động):
 * chủ đầu tư, nhà thầu, thiết kế, sàn giao dịch BĐS, nội thất, vật liệu xây dựng...
 * /api/v2/agencies là đường dẫn cũ, dùng lại chính hàm này.
 *
 * Query: ?district_id= &business_type= &q= &sort=listings|agents|newest &page= &per_page=
 *        &selectable=1 — chỉ sàn môi giới thật được phép chọn làm Công ty/Sàn trực thuộc (bỏ demo),
 *        dùng cho ô chọn ở Hồ sơ môi giới.
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

  const selectable = searchParams.get('selectable') === '1';
  const where = {
    ...(selectable ? SELECTABLE_BUSINESS_WHERE : PUBLIC_BUSINESS_WHERE),
    ...(districtId && /^\d+$/.test(districtId) ? { district_id: BigInt(districtId) } : {}),
    ...(businessType && isValidAgencyBusinessType(businessType) ? { business_type: businessType } : {}),
    ...(q
      ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { tax_code: { contains: q } }] }
      : {}),
  };

  const rows = await db.businesses.findMany({
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
      tax_code: true,
      email: true,
      status: true,
      is_demo: true,
      created_at: true,
      districts: { select: { id: true, name: true } },
      provinces: { select: { id: true, name: true } },
      users: { where: { deleted_at: null }, select: { id: true } },
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

  // user_id -> business_id, để gộp tin của nhiều môi giới cùng công ty vào một danh sách thẻ.
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
    tax_code: row.tax_code,
    email: row.email,
    status: row.status,
    // Doanh nghiệp đang hoạt động đều đã được admin duyệt; dữ liệu demo thì không hiện huy hiệu.
    verified: !row.is_demo,
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

/**
 * POST /api/v2/businesses — môi giới gửi yêu cầu Thêm Doanh nghiệp / Sàn giao dịch ("Công ty của tôi
 * chưa có trong danh sách"). Doanh nghiệp vào trạng thái pending, proposed_by = người gửi, và được gắn
 * luôn vào tài khoản; Admin duyệt xong là đủ điều kiện, khỏi chọn lại. Trùng MST (hoặc trùng tên +
 * địa chỉ + SĐT) thì KHÔNG tạo mới mà yêu cầu chọn doanh nghiệp có sẵn.
 */
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();
  if (user.role !== BROKER_ROLE) return apiError('Chỉ tài khoản môi giới mới đề xuất Doanh nghiệp / Sàn giao dịch.', 403);

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { input, errors } = readBusinessInput(
    { ...body, business_type: 'brokerage', is_demo: undefined },
    ['name', 'tax_code', 'address', 'phone']
  );
  if (errors.length > 0) return validationErrorResponse(errors);

  const duplicate = await findDuplicateBusiness(input);
  if (duplicate) return apiError(duplicateBusinessMessage(duplicate), 409);

  const now = dbNow();
  try {
    const slug = await uniqueBusinessSlug(input.name!);
    await db.$transaction(async (tx) => {
      const business = await tx.businesses.create({
        data: {
          name: input.name!, slug, business_type: 'brokerage', tax_code: input.tax_code ?? null,
          address: input.address ?? null, phone: input.phone ?? null, email: input.email ?? null,
          status: 'pending', proposed_by: user.id, created_at: now, updated_at: now,
        },
      });
      await tx.users.update({ where: { id: user.id }, data: { broker_company_id: business.id, updated_at: now } });
    });
  } catch (err) {
    // Hai người gửi cùng MST / cùng slug một lúc: chỉ mục duy nhất chặn lại → báo trùng.
    if ((err as { code?: string })?.code === 'P2002') {
      return apiError('Doanh nghiệp này vừa được đề xuất. Vui lòng tìm và chọn trong danh sách.', 409);
    }
    throw err;
  }

  return apiSuccess(await loadBrokerProfile(user.id), 'Đã gửi yêu cầu thêm Doanh nghiệp / Sàn giao dịch. Admin sẽ duyệt sớm.', 201);
}
