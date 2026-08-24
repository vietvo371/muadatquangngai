import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';

/**
 * Thông tin chuyển khoản để người dùng nạp tiền vào ví.
 *
 * CỐ Ý không có giá trị mặc định: số tài khoản là dữ liệu thật của chủ site, bịa ra một dãy
 * số sẽ khiến khách chuyển tiền vào tài khoản người khác. Chưa cấu hình thì trả null và UI
 * hiển thị hướng dẫn liên hệ thay vì thông tin sai.
 *
 * Cấu hình bằng cách thêm các dòng vào bảng `settings` (group = 'payment'):
 *   payment_bank_name, payment_bank_account, payment_bank_holder, payment_hotline
 */
export async function GET() {
  const rows = await db.settings.findMany({
    where: { group: 'payment' },
    select: { key: true, value: true },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const val = (key: string) => {
    const v = map.get(key);
    return v && v.trim() ? v.trim() : null;
  };

  const bankName = val('payment_bank_name');
  const bankAccount = val('payment_bank_account');
  const bankHolder = val('payment_bank_holder');

  return apiSuccess({
    bank_name: bankName,
    bank_account: bankAccount,
    bank_holder: bankHolder,
    hotline: val('payment_hotline'),
    /** UI dựa vào cờ này để biết có đủ thông tin hiển thị hướng dẫn chuyển khoản hay không. */
    configured: Boolean(bankName && bankAccount && bankHolder),
  });
}
