import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';

/** GET /api/v2/admin/transactions/stats — port của AdminTransactionController@stats. */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const fromDate = searchParams.get('from_date');
  const toDate = searchParams.get('to_date');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dateFilter: Record<string, any> = {};
  if (fromDate || toDate) {
    dateFilter.created_at = {};
    if (fromDate) dateFilter.created_at.gte = new Date(`${fromDate}T00:00:00.000Z`);
    if (toDate) dateFilter.created_at.lte = new Date(`${toDate}T23:59:59.999Z`);
  }

  const [revenueAgg, totalTransactions, pendingCount, byTypeRows] = await Promise.all([
    db.transactions.aggregate({ where: { ...dateFilter, status: 'success' }, _sum: { amount: true } }),
    db.transactions.count({ where: dateFilter }),
    db.transactions.count({ where: { ...dateFilter, status: 'pending' } }),
    db.transactions.groupBy({
      by: ['type'],
      where: { ...dateFilter, status: 'success' },
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);

  const byType: Record<string, { count: number; total: number }> = {};
  for (const row of byTypeRows) {
    byType[row.type] = { count: row._count._all, total: Number(row._sum.amount ?? 0) };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
  const dailyRows = await db.transactions.findMany({
    where: { status: 'success', created_at: { gte: thirtyDaysAgo } },
    select: { created_at: true, amount: true },
  });
  const dailyMap = new Map<string, number>();
  for (const row of dailyRows) {
    const day = row.created_at!.toISOString().slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + Number(row.amount));
  }
  const dailyRevenue = Array.from(dailyMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, total]) => ({ date, total }));

  return apiSuccess({
    total_revenue: Number(revenueAgg._sum.amount ?? 0),
    total_transactions: totalTransactions,
    pending_count: pendingCount,
    by_type: byType,
    daily_revenue: dailyRevenue,
  });
}
