import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapTransactionResource } from '@/lib/api-resources/transaction-resource';

/**
 * PUT /api/v2/admin/transactions/[id]/approve — port của AdminTransactionController@approve.
 *
 * `admin_note` không phải cột thật trên bảng `transactions` (cột thật tên `note`) và
 * không nằm trong $fillable của Transaction model — Eloquent mass assignment âm thầm bỏ
 * qua key lạ này, không throw (đã verify qua tinker: update thành công, `note` vẫn null
 * sau approve). Next.js replicate đúng: KHÔNG ghi admin_note.
 *
 * Với type=deposit, Laravel truy cập `$transaction->user->increment(...)` — side-effect
 * lazy-load khiến `user` xuất hiện trong response (TransactionResource::whenLoaded).
 * Với type khác, `user` không được load nên bị OMIT khỏi response — verify qua curl thật
 * (purchase-type approve() không có key `user`).
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy giao dịch.', 404);

  const transaction = await db.transactions.findUnique({ where: { id: BigInt(id) } });
  if (!transaction) return apiError('Không tìm thấy giao dịch.', 404);
  if (transaction.status !== 'pending') return apiError('Giao dịch không ở trạng thái chờ duyệt.', 422);

  const updated = await db.transactions.update({
    where: { id: transaction.id },
    data: { status: 'success', updated_at: new Date() },
  });

  let userForResponse: { id: bigint; name: string } | null = null;
  if (transaction.type === 'deposit') {
    const user = await db.users.update({
      where: { id: transaction.user_id },
      data: { balance: { increment: transaction.amount }, updated_at: new Date() },
      select: { id: true, name: true },
    });
    userForResponse = user;
  }

  return apiSuccess(
    mapTransactionResource({ ...updated, ...(userForResponse ? { users: userForResponse } : {}) }),
    'Giao dịch đã được duyệt.'
  );
}
