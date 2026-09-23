import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';
import { toVietnamIso8601 } from '@/lib/api-resources/carbon-format';
import { LEAD_STATUSES, isLeadStatus } from '@/lib/leads';

const PER_PAGE = 20;

/**
 * GET /api/v2/my/leads?status=new|contacted|closed&page=1
 *
 * Khách hàng tiềm năng gửi qua form "Yêu cầu tư vấn" ở trang chi tiết các tin CỦA người đang
 * đăng nhập (leads.owner_id = user). Chỉ trả lead của chính mình — không có tham số chọn người
 * khác, nên không thể đọc lead của môi giới khác.
 */
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status');
  const status = isLeadStatus(statusParam) ? statusParam : null;
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const where = { owner_id: user.id, ...(status ? { status } : {}) };

  const [total, rows, grouped] = await Promise.all([
    db.leads.count({ where }),
    db.leads.findMany({
      where,
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        uuid: true, property_id: true, name: true, phone: true, email: true, message: true,
        status: true, created_at: true,
      },
    }),
    db.leads.groupBy({ by: ['status'], where: { owner_id: user.id }, _count: { _all: true } }),
  ]);

  // leads.property_id không có FK tới properties — nạp riêng tiêu đề/slug/ảnh để hiện kèm lead.
  const propertyIds = [...new Set(rows.map((r) => r.property_id).filter((id): id is bigint => id !== null))];
  const properties = propertyIds.length
    ? await db.properties.findMany({
        where: { id: { in: propertyIds } },
        select: { id: true, title: true, slug: true, type: true, thumbnail: true },
      })
    : [];
  const propertyMap = new Map(properties.map((p) => [p.id.toString(), p]));

  const counts = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<string, number>;
  grouped.forEach((g) => { counts[g.status] = g._count._all; });

  return apiSuccess({
    data: rows.map((r) => {
      const p = r.property_id !== null ? propertyMap.get(r.property_id.toString()) : undefined;
      return {
        uuid: r.uuid,
        name: r.name,
        phone: r.phone,
        email: r.email,
        message: r.message,
        status: r.status,
        created_at: toVietnamIso8601(r.created_at),
        property: p ? { title: p.title, slug: p.slug, type: p.type, thumbnail: p.thumbnail } : null,
      };
    }),
    meta: {
      current_page: page,
      last_page: Math.max(1, Math.ceil(total / PER_PAGE)),
      per_page: PER_PAGE,
      total,
    },
    counts: { all: Object.values(counts).reduce((a, b) => a + b, 0), ...counts },
  });
}
