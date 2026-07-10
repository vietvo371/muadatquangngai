import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiPaginated, buildPaginationMeta } from '@/lib/api-response';
import { mapProjectResource } from '@/lib/api-resources/project-resource';
import { PROJECT_ACTIVE_EXCLUDED_STATUSES } from '@/lib/api-resources/project-status';

/**
 * GET /api/v2/projects — port của ProjectController@index (Laravel).
 * Giai đoạn 1 (strangler): chạy SONG SONG với Laravel tại /api/v2/*, chưa được
 * frontend gọi tới. Xem so sánh ở scripts/diff-api.ts.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provinceParam = searchParams.get('province');
  const typeParam = searchParams.get('type');
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const perPage = 20; // Laravel: ->paginate(20) — không nhận per_page qua query cho route này

  const provinceId = provinceParam && /^\d+$/.test(provinceParam) ? BigInt(provinceParam) : null;

  const where = {
    status: { notIn: PROJECT_ACTIVE_EXCLUDED_STATUSES }, // scopeActive()
    ...(provinceId !== null ? { province_id: provinceId } : {}),
    ...(typeParam ? { type: typeParam } : {}),
  };

  const [total, rows] = await Promise.all([
    db.projects.count({ where }),
    db.projects.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        provinces: { select: { id: true, name: true } },
        districts: { select: { id: true, name: true } },
        users_projects_user_idTousers: { select: { id: true, name: true, avatar: true } },
        users_projects_agent_idTousers: { select: { id: true, name: true, avatar: true, phone: true } },
      },
    }),
  ]);

  // ward_id không có FK constraint trong DB (xem migration) nên Prisma không tự include được —
  // batch fetch riêng để tránh N+1, giống Eloquent eager-load ward() theo convention.
  const wardIds = [...new Set(rows.map((r) => r.ward_id).filter((id): id is bigint => id !== null))];
  const wards = wardIds.length
    ? await db.wards.findMany({ where: { id: { in: wardIds } }, select: { id: true, name: true } })
    : [];
  const wardMap = new Map(wards.map((w) => [w.id.toString(), w]));

  const data = rows.map((row) =>
    mapProjectResource(row, row.ward_id !== null ? (wardMap.get(row.ward_id.toString()) ?? null) : null)
  );

  return apiPaginated(data, buildPaginationMeta(total, page, perPage));
}
