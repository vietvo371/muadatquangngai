import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';
import { toVietnamIso8601 } from '@/lib/api-resources/carbon-format';

/**
 * Giao dịch ví của CHÍNH người dùng đang đăng nhập.
 *
 * Trước đây trang /dashboard/nap-tien chỉ `setTimeout` rồi hiện màn hình "thành công" mà
 * KHÔNG gọi API nào — người dùng chuyển khoản thật xong tưởng đã nạp được tiền, trong khi
 * hệ thống không ghi nhận gì. Route này tạo yêu cầu nạp THẬT ở trạng thái `pending`; admin
 * xác nhận qua PUT /api/v2/admin/transactions/[id]/approve thì số dư mới được cộng.
 */

/** Nạp tối thiểu/tối đa mỗi lần — chặn số rác và lệnh nạp bất thường. */
const MIN_AMOUNT = 10_000;
const MAX_AMOUNT = 50_000_000;

/** Chỉ mở phương thức đã dùng được thật. VNPay/MoMo chưa tích hợp cổng nên KHÔNG nhận ở đây,
 *  tránh tạo yêu cầu mà người dùng không có cách nào thanh toán. */
const ALLOWED_METHODS = ['banking'] as const;

function mapOwnTransaction(t: {
  id: bigint; uuid: string; type: string; method: string | null; amount: unknown;
  status: string; note: string | null; created_at: Date | null;
}) {
  return {
    id: Number(t.id),
    uuid: t.uuid,
    /** Mã ngắn để người dùng ghi vào nội dung chuyển khoản, admin đối chiếu nhanh. */
    code: `NAP${String(t.id).padStart(6, '0')}`,
    type: t.type,
    method: t.method,
    amount: Number(t.amount),
    status: t.status,
    note: t.note,
    created_at: toVietnamIso8601(t.created_at),
  };
}

/** GET /api/v2/my/transactions — lịch sử giao dịch ví của chính mình (mới nhất trước). */
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const { searchParams } = new URL(request.url);
  const limitRaw = parseInt(searchParams.get('limit') ?? '20', 10);
  const limit = Math.min(Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 20, 100);

  const rows = await db.transactions.findMany({
    where: { user_id: user.id },
    orderBy: { id: 'desc' },
    take: limit,
    select: {
      id: true, uuid: true, type: true, method: true, amount: true,
      status: true, note: true, created_at: true,
    },
  });

  return apiSuccess(rows.map(mapOwnTransaction));
}

/** POST /api/v2/my/transactions — tạo yêu cầu nạp tiền, trạng thái `pending` chờ admin duyệt. */
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const body = await request.json().catch(() => ({}));

  const amount = Number(body?.amount);
  if (!Number.isInteger(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    return apiError(
      `Số tiền nạp phải là số nguyên từ ${MIN_AMOUNT.toLocaleString('vi-VN')}đ đến ${MAX_AMOUNT.toLocaleString('vi-VN')}đ.`,
      422
    );
  }

  const method = typeof body?.method === 'string' ? body.method : 'banking';
  if (!ALLOWED_METHODS.includes(method as (typeof ALLOWED_METHODS)[number])) {
    return apiError('Phương thức thanh toán này chưa được hỗ trợ.', 422);
  }

  // Chống tạo trùng khi người dùng bấm nhiều lần / mạng retry: cùng khoá thì trả lại đúng
  // giao dịch đã tạo thay vì tạo thêm lệnh nạp mới.
  const idempotencyKey =
    typeof body?.idempotency_key === 'string' && body.idempotency_key.trim().length >= 8
      ? body.idempotency_key.trim().slice(0, 64)
      : crypto.randomUUID();

  const existing = await db.transactions.findUnique({
    where: { idempotency_key: idempotencyKey },
    select: {
      id: true, uuid: true, type: true, method: true, amount: true,
      status: true, note: true, created_at: true, user_id: true,
    },
  });
  if (existing) {
    // Khoá của người khác thì coi như trùng lặp không hợp lệ, không tiết lộ giao dịch đó.
    if (existing.user_id !== user.id) return apiError('Yêu cầu không hợp lệ.', 422);
    return apiSuccess(mapOwnTransaction(existing), 'Yêu cầu nạp tiền đã được ghi nhận trước đó.');
  }

  const now = new Date();
  const created = await db.transactions.create({
    data: {
      uuid: crypto.randomUUID(),
      user_id: user.id,
      type: 'deposit',
      method,
      amount,
      status: 'pending',
      idempotency_key: idempotencyKey,
      created_at: now,
      updated_at: now,
    },
    select: {
      id: true, uuid: true, type: true, method: true, amount: true,
      status: true, note: true, created_at: true,
    },
  });

  return apiSuccess(
    mapOwnTransaction(created),
    'Đã ghi nhận yêu cầu nạp tiền. Số dư sẽ được cộng sau khi quản trị viên xác nhận.',
    201
  );
}
