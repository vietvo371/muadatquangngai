import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapTransactionResource } from '@/lib/api-resources/transaction-resource';

/** PUT /api/v2/admin/transactions/[id]/refund — port của AdminTransactionController@refund (admin_note không persist, xem approve/route.ts). */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy giao dịch.', 404);

  const transaction = await db.transactions.findUnique({ where: { id: BigInt(id) } });
  if (!transaction) return apiError('Không tìm thấy giao dịch.', 404);
  if (transaction.status !== 'success') return apiError('Chỉ có thể hoàn tiền giao dịch đã thành công.', 422);

  const updated = await db.transactions.update({
    where: { id: transaction.id },
    data: { status: 'refunded', updated_at: new Date() },
  });

  return apiSuccess(mapTransactionResource(updated), 'Giao dịch đã được hoàn tiền.');
}
