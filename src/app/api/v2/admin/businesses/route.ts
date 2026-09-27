import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { dbNow } from '@/lib/db-time';
import { validationErrorResponse } from '@/lib/validation';
import { isValidAgencyBusinessType } from '@/lib/agency-business-types';
import {
  BUSINESS_STATUSES, parseBusinessStatus, readBusinessInput, findDuplicateBusiness, duplicateBusinessMessage,
  uniqueBusinessSlug, businessAdminResource, brokerCountsByBusiness,
} from '@/lib/business';

/**
 * GET /api/v2/admin/businesses?status=pending|active|rejected&q=&business_type=
 * Doanh nghiệp / Sàn giao dịch theo tab trạng thái, kèm số lượng từng tab.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const params = new URL(request.url).searchParams;
  const status = parseBusinessStatus(params.get('status'));
  const q = (params.get('q') ?? '').trim().slice(0, 100);
  const businessType = params.get('business_type');

  const [rows, grouped] = await Promise.all([
    db.businesses.findMany({
      where: {
        status,
        ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { tax_code: { contains: q } }] } : {}),
        ...(isValidAgencyBusinessType(businessType) ? { business_type: businessType } : {}),
      },
      // Chờ duyệt: cũ nhất lên đầu để xử lý theo thứ tự; tab khác: mới cập nhật lên đầu.
      orderBy: status === 'pending' ? { created_at: 'asc' } : { updated_at: 'desc' },
      take: 500,
    }),
    db.businesses.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const peopleIds = [...new Set(rows.flatMap((r) => [r.proposed_by, r.approved_by, r.rejected_by]))]
    .filter((v): v is bigint => v !== null);
  const [people, brokerCounts] = await Promise.all([
    peopleIds.length ? db.users.findMany({ where: { id: { in: peopleIds } }, select: { id: true, name: true } }) : [],
    brokerCountsByBusiness(rows.map((r) => r.id)),
  ]);
  const nameOf = (v: bigint | null) => (v === null ? null : people.find((p) => p.id === v)?.name ?? null);

  const counts = Object.fromEntries(BUSINESS_STATUSES.map((s) => [s, 0])) as Record<string, number>;
  grouped.forEach((g) => { counts[g.status] = g._count._all; });

  return apiSuccess({
    counts,
    data: rows.map((r) => businessAdminResource(r, {
      brokerCount: brokerCounts.get(r.id.toString()) ?? 0,
      proposedByName: nameOf(r.proposed_by),
      reviewedByName: nameOf(r.status === 'rejected' ? r.rejected_by : r.approved_by),
    })),
  });
}

/** POST /api/v2/admin/businesses — Admin tạo doanh nghiệp (đang hoạt động ngay). */
export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { input, errors } = readBusinessInput(body, ['name']);
  if (errors.length > 0) return validationErrorResponse(errors);

  const duplicate = await findDuplicateBusiness(input);
  if (duplicate) return apiError(duplicateBusinessMessage(duplicate), 409);

  const now = dbNow();
  const created = await db.businesses.create({
    data: {
      ...input,
      name: input.name!,
      slug: await uniqueBusinessSlug(input.name!),
      status: 'active',
      approved_by: guard.id,
      approved_at: now,
      created_at: now,
      updated_at: now,
    },
  });
  return apiSuccess(
    businessAdminResource(created, { brokerCount: 0, proposedByName: null, reviewedByName: guard.name }),
    'Đã tạo doanh nghiệp.',
    201
  );
}
