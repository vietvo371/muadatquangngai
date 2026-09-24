import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';
import { toVietnamIso8601 } from '@/lib/api-resources/carbon-format';
import { REVIEW_STATUSES, parseReviewStatus } from '@/lib/broker-review';

/** GET /api/v2/admin/broker-companies?status=pending|approved|rejected — Công ty/Sàn giao dịch. */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const status = parseReviewStatus(new URL(request.url).searchParams.get('status'));
  const [rows, grouped] = await Promise.all([
    db.broker_companies.findMany({
      where: { status },
      orderBy: { updated_at: status === 'pending' ? 'asc' : 'desc' },
      take: 200,
      include: { _count: { select: { users: true } } },
    }),
    db.broker_companies.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);
  const peopleIds = [...new Set(rows.flatMap((r) => [r.created_by, r.approved_by]).filter((v): v is bigint => v !== null))];
  const people = peopleIds.length
    ? await db.users.findMany({ where: { id: { in: peopleIds } }, select: { id: true, name: true } })
    : [];
  const nameOf = (v: bigint | null) => (v === null ? null : people.find((p) => p.id === v)?.name ?? null);
  const counts = Object.fromEntries(REVIEW_STATUSES.map((s) => [s, 0])) as Record<string, number>;
  grouped.forEach((g) => { counts[g.status] = g._count._all; });

  return apiSuccess({
    counts,
    data: rows.map((r) => ({
      id: r.id, name: r.name, tax_code: r.tax_code, address: r.address, phone: r.phone, email: r.email,
      status: r.status, rejection_reason: r.rejection_reason,
      broker_count: r._count.users,
      created_by_name: nameOf(r.created_by),
      approved_by_name: nameOf(r.approved_by),
      approved_at: toVietnamIso8601(r.approved_at),
      created_at: toVietnamIso8601(r.created_at),
    })),
  });
}
