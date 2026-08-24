import crypto from 'node:crypto';
import { db } from '@/lib/db';

/**
 * Trừ tiền ví một cách an toàn.
 *
 * Ba lỗi đã gặp ở các route mua/nâng cấp VIP mà helper này chặn:
 * 1. Kiểm số dư bằng giá trị đọc trước đó rồi mới trừ — hai request song song đều qua được
 *    vòng kiểm tra và số dư có thể bị âm. Nay trừ bằng `updateMany` kèm điều kiện
 *    `balance >= amount`, chỉ lệnh nào thắng mới đổi được dữ liệu.
 * 2. Tiền ra khỏi ví mà KHÔNG có dòng nào trong bảng `transactions` — không đối chiếu được
 *    sổ sách. Nay luôn ghi một giao dịch `purchase` trong cùng transaction.
 * 3. Bấm hai lần / mạng retry là trừ tiền hai lần. Nay nếu truyền `idempotencyKey` đã dùng
 *    thì trả về `alreadyProcessed` mà không trừ thêm.
 */

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

export type ChargeWalletResult =
  | { ok: true; alreadyProcessed: boolean }
  | { ok: false; reason: 'insufficient_balance' };

export async function chargeWallet(opts: {
  userId: bigint;
  amount: number;
  note: string;
  idempotencyKey?: string | null;
  referenceType?: string | null;
  referenceId?: bigint | null;
  /** Thay đổi nghiệp vụ đi kèm (vd đặt hạn VIP cho tin) — chạy trong cùng transaction. */
  apply: (tx: TxClient) => Promise<void>;
}): Promise<ChargeWalletResult> {
  const { userId, amount, note, idempotencyKey, referenceType, referenceId, apply } = opts;

  if (idempotencyKey) {
    const existing = await db.transactions.findUnique({
      where: { idempotency_key: idempotencyKey },
      select: { id: true },
    });
    if (existing) return { ok: true, alreadyProcessed: true };
  }

  try {
    return await db.$transaction(async (tx) => {
      const charged = await tx.users.updateMany({
        where: { id: userId, balance: { gte: amount } },
        data: { balance: { decrement: amount }, updated_at: new Date() },
      });
      if (charged.count === 0) {
        return { ok: false, reason: 'insufficient_balance' as const };
      }

      const now = new Date();
      await tx.transactions.create({
        data: {
          uuid: crypto.randomUUID(),
          user_id: userId,
          type: 'purchase',
          method: 'balance',
          amount,
          status: 'success',
          reference_type: referenceType ?? null,
          reference_id: referenceId ?? null,
          idempotency_key: idempotencyKey ?? null,
          note,
          created_at: now,
          updated_at: now,
        },
      });

      await apply(tx);
      return { ok: true, alreadyProcessed: false as const };
    });
  } catch (err) {
    // Trùng idempotency_key do hai request chạy sát nhau: request sau thua ở ràng buộc unique,
    // nghĩa là lệnh trước đã trừ tiền xong — coi như đã xử lý, KHÔNG trừ lần nữa.
    if ((err as { code?: string })?.code === 'P2002') {
      return { ok: true, alreadyProcessed: true };
    }
    throw err;
  }
}
