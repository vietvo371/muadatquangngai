import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapTransactionResource } from '@/lib/api-resources/transaction-resource';

/** GET /api/v2/admin/transactions/[id] — port của AdminTransactionController@show. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy giao dịch.', 404);

  const transaction = await db.transactions.findUnique({
    where: { id: BigInt(id) },
    include: { users: { select: { id: true, name: true } } },
  });
  if (!transaction) return apiError('Không tìm thấy giao dịch.', 404);

  return apiSuccess(mapTransactionResource(transaction));
}
