import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';
import { toVietnamIso8601 } from '@/lib/api-resources/carbon-format';
import { REVIEW_STATUSES, parseReviewStatus } from '@/lib/broker-review';

/** GET /api/v2/admin/broker-certifications?status=pending|approved|rejected — hồ sơ chứng chỉ môi giới. */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const status = parseReviewStatus(new URL(request.url).searchParams.get('status'));
  const [rows, grouped] = await Promise.all([
    db.broker_certifications.findMany({
      where: { status },
      orderBy: { updated_at: status === 'pending' ? 'asc' : 'desc' },
      take: 200,
      include: {
        users: {
          select: {
            id: true, name: true, email: true, phone: true, avatar: true, is_certified: true,
            broker_company: { select: { name: true, status: true } },
          },
        },
      },
    }),
    db.broker_certifications.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const reviewerIds = [...new Set(rows.map((r) => r.reviewed_by).filter((v): v is bigint => v !== null))];
  const reviewers = reviewerIds.length
    ? await db.users.findMany({ where: { id: { in: reviewerIds } }, select: { id: true, name: true } })
    : [];
  const reviewerMap = new Map(reviewers.map((u) => [u.id.toString(), u.name]));
  const counts = Object.fromEntries(REVIEW_STATUSES.map((s) => [s, 0])) as Record<string, number>;
  grouped.forEach((g) => { counts[g.status] = g._count._all; });

  return apiSuccess({
    counts,
    data: rows.map((r) => ({
      id: r.id,
      certificate_number: r.certificate_number,
      issued_date: r.issued_date.toISOString().slice(0, 10),
      issued_by: r.issued_by,
      front_image: r.front_image,
      back_image: r.back_image,
      status: r.status,
      rejection_reason: r.rejection_reason,
      submitted_at: toVietnamIso8601(r.updated_at ?? r.created_at),
      reviewed_at: toVietnamIso8601(r.reviewed_at),
      reviewed_by_name: r.reviewed_by !== null ? reviewerMap.get(r.reviewed_by.toString()) ?? null : null,
      user: {
        id: r.users.id, name: r.users.name, email: r.users.email, phone: r.users.phone, avatar: r.users.avatar,
        company_name: r.users.broker_company?.name ?? null,
        company_status: r.users.broker_company?.status ?? null,
      },
    })),
  });
}
