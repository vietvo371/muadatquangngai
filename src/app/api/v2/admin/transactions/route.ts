import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiPaginated, buildPaginationMeta } from '@/lib/api-response';
import { mapTransactionRawDump } from '@/lib/api-resources/transaction-resource';

/**
 * GET /api/v2/admin/transactions — port của AdminTransactionController@index.
 *
 * Laravel gọi `$this->paginated($transactions)` trực tiếp trên Eloquent Collection,
 * KHÔNG bọc qua TransactionResource — raw dump cột DB thật (cùng loại bug đã fix ở
 * PropertyController::index() public, nhưng route admin-only này giữ nguyên, chỉ
 * replicate — xem chú thích trong transaction-resource.ts).
 */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const method = searchParams.get('method');
  const userId = searchParams.get('user_id');
  const fromDate = searchParams.get('from_date');
  const toDate = searchParams.get('to_date');
  const sort = searchParams.get('sort') ?? 'newest';
  const perPage = 20;
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (method) where.method = method;
  if (userId) where.user_id = BigInt(userId);
  if (fromDate || toDate) {
    where.created_at = {};
    if (fromDate) where.created_at.gte = new Date(`${fromDate}T00:00:00.000Z`);
    if (toDate) where.created_at.lte = new Date(`${toDate}T23:59:59.999Z`);
  }

  const orderBy =
    sort === 'oldest'
      ? { created_at: 'asc' as const }
      : sort === 'amount_high'
        ? { amount: 'desc' as const }
        : sort === 'amount_low'
          ? { amount: 'asc' as const }
          : { created_at: 'desc' as const };

  const [total, rows] = await Promise.all([
    db.transactions.count({ where }),
    db.transactions.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      include: { users: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return apiPaginated(
    rows.map((r) => mapTransactionRawDump(r)),
    buildPaginationMeta(total, page, perPage)
  );
}
