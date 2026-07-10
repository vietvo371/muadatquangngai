import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiPaginated, buildPaginationMeta } from '@/lib/api-response';
import { toVietnamIso8601 } from '@/lib/api-resources/carbon-format';

/**
 * GET /api/v2/admin/reports — port của AdminReportController@index.
 * Laravel trả RAW model (không bọc Resource — xác nhận từ code gốc, không phải sót như
 * PropertyController::index() từng bị) — nhưng relation reporter CÓ giới hạn cột qua
 * with('reporter:id,name,email') nên không lộ dữ liệu nhạy cảm như password/deleted_at.
 * Next.js replicate đúng shape phẳng này (id, reporter_id, type, ..., reporter: {...}).
 */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const perPage = 20;
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const where = {
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
  };

  const [total, rows] = await Promise.all([
    db.reports.count({ where }),
    db.reports.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { users: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  const data = rows.map((r) => ({
    id: r.id,
    reporter_id: r.reporter_id,
    type: r.type,
    target_id: r.target_id,
    reason: r.reason,
    description: r.description,
    status: r.status,
    created_at: toVietnamIso8601(r.created_at),
    updated_at: toVietnamIso8601(r.updated_at),
    reporter: { id: r.users.id, name: r.users.name, email: r.users.email },
  }));

  return apiPaginated(data, buildPaginationMeta(total, page, perPage));
}
