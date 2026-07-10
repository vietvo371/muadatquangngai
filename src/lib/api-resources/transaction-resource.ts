import { toCarbonDefaultUtc } from './carbon-format';

interface TransactionRow {
  id: bigint;
  uuid: string;
  user_id: bigint;
  type: string;
  method: string | null;
  amount: unknown; // Prisma.Decimal
  status: string;
  reference_type: string | null;
  reference_id: bigint | null;
  gateway_ref: string | null;
  note: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

/**
 * Port của AdminTransactionController@index — Laravel gọi `$this->paginated($transactions)`
 * TRỰC TIẾP trên Eloquent Collection, KHÔNG bọc qua TransactionResource (cùng loại bug đã
 * fix ở PropertyController::index() public, nhưng route này admin-only nên KHÔNG re-fix
 * Laravel — chỉ replicate đúng raw dump, đối chiếu qua curl thật). Thứ tự field khớp thứ
 * tự cột DB (Eloquent's default toArray()).
 */
export function mapTransactionRawDump(t: TransactionRow & { users: { id: bigint; name: string; email: string } }) {
  return {
    id: t.id,
    uuid: t.uuid,
    user_id: t.user_id,
    type: t.type,
    method: t.method,
    amount: String(t.amount),
    status: t.status,
    reference_type: t.reference_type,
    reference_id: t.reference_id,
    gateway_ref: t.gateway_ref,
    note: t.note,
    created_at: toCarbonDefaultUtc(t.created_at),
    updated_at: toCarbonDefaultUtc(t.updated_at),
    user: { id: t.users.id, name: t.users.name, email: t.users.email },
  };
}

/**
 * Port của TransactionResource — class Resource này tham chiếu các cột KHÔNG tồn tại trên
 * bảng `transactions` thật (payment_method, description, transaction_id,
 * vnpay_transaction_no, momo_trans_id, metadata, completed_at — bảng thật chỉ có method,
 * note, reference_type/id, gateway_ref). Eloquent's magic __get trả về null cho attribute
 * không tồn tại thay vì throw, nên response THẬT chứa các field trên với giá trị null,
 * đồng thời BỎ user_id, reference_type, reference_id, gateway_ref, note, updated_at (không được Resource khai
 * báo). Xác nhận qua curl thật. Next.js replicate đúng shape THẬT này, không phải shape
 * "đúng ý đồ" — dùng cho show()/approve()/reject()/refund().
 */
export function mapTransactionResource(t: TransactionRow & { users?: { id: bigint; name: string } | null }) {
  return {
    id: t.id,
    type: t.type,
    amount: String(t.amount),
    status: t.status,
    payment_method: null,
    description: null,
    transaction_id: null,
    vnpay_transaction_no: null,
    momo_trans_id: null,
    metadata: null,
    completed_at: null,
    created_at: toCarbonDefaultUtc(t.created_at),
    ...(t.users ? { user: { id: t.users.id, name: t.users.name } } : {}),
  };
}
