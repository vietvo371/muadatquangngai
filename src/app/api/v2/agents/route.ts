import { db } from '@/lib/db';
import { apiPaginated, buildPaginationMeta } from '@/lib/api-response';

/**
 * GET /api/v2/agents — danh bạ nhà môi giới.
 *
 * Công khai: khách cần xem được môi giới trước khi đăng nhập.
 *
 * Query: ?district_id= &q= &sort=listings|rating|newest &page= &per_page=
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

  const where = {
    role: 'agent',
    ...(districtId && /^\d+$/.test(districtId) ? { district_id: BigInt(districtId) } : {}),
    // Tìm cả theo tên môi giới lẫn tên công ty — người dùng thường nhớ một trong hai.
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { agency_name: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  // Mặc định xếp theo số tin ĐANG HIỂN THỊ: môi giới hoạt động nhiều lên trước thì danh bạ
  // mới hữu ích. Xếp theo rating mặc định sẽ đẩy người mới có 1 đánh giá 5 sao lên đầu.
  const sort = searchParams.get('sort') ?? 'listings';

  // Không dùng cột users.total_listings để xếp: cột đó đếm MỌI trạng thái (kể cả tin nháp,
  // chờ duyệt, hết hạn) nên thứ tự sẽ lệch với con số hiển thị trên thẻ, nhìn như sắp xếp
  // hỏng. Prisma cũng không orderBy được theo số bản ghi quan hệ ĐÃ LỌC, nên lấy toàn bộ id
  // khớp điều kiện rồi tự xếp và cắt trang. Danh bạ cấp tỉnh chỉ cỡ trăm–nghìn người nên
  // cách này thoải mái; nếu sau này lớn hơn nhiều thì chuyển sang truy vấn SQL có subquery.
  const allMatching = await db.users.findMany({
    where,
    select: { id: true, rating: true, created_at: true },
  });
  const total = allMatching.length;
  const allIds = allMatching.map((u) => u.id);

  const activeCountsAll = allIds.length
    ? await db.properties.groupBy({
        by: ['user_id'],
        where: { user_id: { in: allIds }, status: 'active' },
        _count: { _all: true },
      })
    : [];
  const activeByAll = new Map(activeCountsAll.map((r) => [r.user_id.toString(), r._count._all]));

  const sorted = [...allMatching].sort((a, b) => {
    if (sort === 'newest') return (b.created_at?.getTime() ?? 0) - (a.created_at?.getTime() ?? 0);
    if (sort === 'rating') {
      const d = Number(b.rating) - Number(a.rating);
      if (d !== 0) return d;
      return (activeByAll.get(b.id.toString()) ?? 0) - (activeByAll.get(a.id.toString()) ?? 0);
    }
    const d = (activeByAll.get(b.id.toString()) ?? 0) - (activeByAll.get(a.id.toString()) ?? 0);
    if (d !== 0) return d;
    return Number(b.rating) - Number(a.rating);
  });

  const pageIds = sorted.slice((page - 1) * perPage, page * perPage).map((u) => u.id);

  const unordered = pageIds.length
    ? await db.users.findMany({
        where: { id: { in: pageIds } },
        select: {
          id: true,
          name: true,
          avatar: true,
          phone: true,
          bio: true,
          rating: true,
          total_listings: true,
          agency_name: true,
          created_at: true,
          districts: { select: { id: true, name: true } },
          provinces: { select: { id: true, name: true } },
        },
      })
    : [];

  // findMany không giữ thứ tự của mảng `in` — xếp lại theo đúng thứ tự đã tính.
  const byId = new Map(unordered.map((u) => [u.id.toString(), u]));
  const rows = pageIds.map((id) => byId.get(id.toString())!).filter(Boolean);

  const ids = rows.map((r) => r.id);

  // Đếm đánh giá và tin đang hiển thị bằng groupBy thay vì truy vấn trong vòng lặp — tránh
  // N+1 khi danh bạ dài ra.
  const [reviewCounts, verified] = await Promise.all([
    ids.length
      ? db.reviews.groupBy({ by: ['agent_id'], where: { agent_id: { in: ids } }, _count: { _all: true } })
      : [],
    ids.length
      ? db.verifications.findMany({
          where: { user_id: { in: ids }, type: 'agent', status: 'approved' },
          select: { user_id: true },
        })
      : [],
  ]);

  const reviewBy = new Map(reviewCounts.map((r) => [r.agent_id.toString(), r._count._all]));
  // Dùng lại số đã đếm ở bước xếp thứ tự — không truy vấn lại.
  const activeBy = activeByAll;
  const verifiedSet = new Set(verified.map((v) => v.user_id.toString()));

  const data = rows.map((r) => {
    const key = r.id.toString();
    return {
      id: Number(r.id),
      name: r.name,
      avatar: r.avatar,
      phone: r.phone,
      bio: r.bio,
      rating: Number(r.rating),
      review_count: reviewBy.get(key) ?? 0,
      // total_listings trên users là tổng mọi trạng thái; danh bạ hiển thị số tin đang
      // hiển thị mới đúng ý "môi giới này đang bán gì".
      total_listings: activeBy.get(key) ?? 0,
      company: r.agency_name,
      district: r.districts ? { id: Number(r.districts.id), name: r.districts.name } : null,
      province: r.provinces ? { id: Number(r.provinces.id), name: r.provinces.name } : null,
      verified: verifiedSet.has(key),
      joined_at: r.created_at,
    };
  });

  return apiPaginated(data, buildPaginationMeta(total, page, perPage));
}
