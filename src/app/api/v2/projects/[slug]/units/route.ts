import { db } from '@/lib/db';
import { apiError, apiPaginated, buildPaginationMeta } from '@/lib/api-response';
import { mapPropertyResource, loadWardsMap } from '@/lib/api-resources/property-resource';
import { PROJECT_ACTIVE_EXCLUDED_STATUSES } from '@/lib/api-resources/project-status';
import { dbNow } from '@/lib/db-time';

/**
 * GET /api/v2/projects/[slug]/units — các căn/lô đang rao bán thuộc dự án.
 *
 * Trang chi tiết dự án gọi endpoint này từ lâu nhưng nó CHƯA TỪNG TỒN TẠI (trả 404), nên khối
 * "đang mở bán" luôn trống dù có tin đăng gắn với dự án. "Căn" ở đây chính là tin đăng có
 * properties.project_id trỏ tới dự án, lọc đúng như trang danh sách công khai: đang hiển thị,
 * đã đăng, chưa hết hạn.
 *
 * `[slug]` nhận cả slug lẫn id số, vì trang chi tiết gọi bằng id.
 */

const DEFAULT_PER_PAGE = 6;
const MAX_PER_PAGE = 50;

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);

  const perPageParam = parseInt(searchParams.get('per_page') ?? String(DEFAULT_PER_PAGE), 10);
  const perPage = Math.min(Number.isFinite(perPageParam) && perPageParam > 0 ? perPageParam : DEFAULT_PER_PAGE, MAX_PER_PAGE);
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const project = await db.projects.findFirst({
    where: {
      ...(/^\d+$/.test(slug) ? { id: BigInt(slug) } : { slug }),
      status: { notIn: PROJECT_ACTIVE_EXCLUDED_STATUSES },
    },
    select: { id: true },
  });
  if (!project) return apiError('Không tìm thấy dự án.', 404);

  const now = dbNow();
  const where = {
    project_id: project.id,
    status: 'active',
    published_at: { not: null },
    OR: [{ expired_at: null }, { expired_at: { gt: now } }],
  };

  const [total, rows] = await Promise.all([
    db.properties.count({ where }),
    db.properties.findMany({
      where,
      orderBy: { published_at: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        provinces: { select: { id: true, name: true, slug: true } },
        districts: { select: { id: true, name: true, slug: true } },
        categories: { select: { id: true, name: true, slug: true, icon: true } },
        users: { select: { id: true, name: true, phone: true, avatar: true, role: true, rating: true, total_listings: true } },
        property_media: {
          select: { id: true, type: true, image_type: true, url: true, thumbnail: true, caption: true, is_primary: true, sort_order: true },
        },
      },
    }),
  ]);

  const wards = await loadWardsMap(rows);
  const data = rows.map((row) =>
    mapPropertyResource(row, row.ward_id !== null ? (wards.get(row.ward_id.toString()) ?? null) : null)
  );

  return apiPaginated(data, buildPaginationMeta(total, page, perPage));
}
