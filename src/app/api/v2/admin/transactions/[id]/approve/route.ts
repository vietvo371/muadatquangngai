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

  // Đổi trạng thái và cộng tiền phải NẰM CHUNG một transaction: trước đây là 2 lệnh rời, nếu
  // lệnh cộng số dư lỗi thì giao dịch vẫn bị đánh 'success' mà tiền không vào ví.
  // `updateMany` kèm điều kiện status='pending' đóng vai trò chốt: hai admin bấm duyệt cùng lúc
  // thì chỉ một lệnh đổi được trạng thái, lệnh còn lại count=0 nên KHÔNG cộng tiền lần hai.
  const result = await db.$transaction(async (tx) => {
    const claimed = await tx.transactions.updateMany({
      where: { id: transaction.id, status: 'pending' },
      data: { status: 'success', updated_at: new Date() },
    });
    if (claimed.count === 0) return null;

    let user: { id: bigint; name: string } | null = null;
    if (transaction.type === 'deposit') {
      user = await tx.users.update({
        where: { id: transaction.user_id },
        data: { balance: { increment: transaction.amount }, updated_at: new Date() },
        select: { id: true, name: true },
      });
    }

    const fresh = await tx.transactions.findUniqueOrThrow({ where: { id: transaction.id } });
    return { updated: fresh, user };
  });

  if (!result) return apiError('Giao dịch không ở trạng thái chờ duyệt.', 422);
  const { updated, user: userForResponse } = result;

  return apiSuccess(
    mapTransactionResource({ ...updated, ...(userForResponse ? { users: userForResponse } : {}) }),
    'Giao dịch đã được duyệt.'
  );
}
