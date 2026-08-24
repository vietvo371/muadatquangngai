'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Wallet,
  Landmark,
  CreditCard,
  Smartphone,
  Clock,
  Copy,
  Info,
  Loader2,
} from 'lucide-react';
import api from '@/lib/axios';
import { formatPrice } from '@/lib/formatters';

/**
 * Nạp tiền vào ví.
 *
 * Bản trước của trang này là GIẢ HOÀN TOÀN: bấm thanh toán chỉ `setTimeout` 2 giây rồi hiện
 * "Thanh toán thành công!", không gọi API, không ghi giao dịch, không cộng số dư — người dùng
 * chuyển khoản thật xong sẽ tin là đã nạp được tiền. Các gói VIP hiển thị ở đó cũng không khớp
 * bảng `packages` thật.
 *
 * Nay: tạo yêu cầu nạp THẬT (`POST /api/v2/my/transactions`) ở trạng thái chờ, admin xác nhận
 * mới cộng số dư. Việc mua gói VIP không nằm ở đây — nó đã có luồng thật ở bước 3 của trang
 * đăng tin (trừ số dư + ghi giao dịch trong cùng transaction).
 */

const AMOUNT_PRESETS = [100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000];
const MIN_AMOUNT = 10_000;
const MAX_AMOUNT = 50_000_000;

interface DepositTransaction {
  id: number;
  code: string;
  type: string;
  method: string | null;
  amount: number;
  status: string;
  created_at: string | null;
}

interface PaymentInfo {
  bank_name: string | null;
  bank_account: string | null;
  bank_holder: string | null;
  hotline: string | null;
  configured: boolean;
  simulate_mode: boolean;
}

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  pending: { text: 'Chờ xác nhận', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  success: { text: 'Đã cộng tiền', className: 'bg-green-50 text-green-700 border-green-200' },
  failed: { text: 'Từ chối', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  refunded: { text: 'Đã hoàn', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export default function NapTienPage() {
  const [amount, setAmount] = useState<number>(200_000);
  const [customAmount, setCustomAmount] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [history, setHistory] = useState<DepositTransaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<DepositTransaction | null>(null);

  const loadBalance = useCallback(() => {
    api.get('/api/v2/auth/me')
      .then((res) => setBalance(Number(res.data?.data?.balance ?? 0)))
      .catch(() => setBalance(null));
  }, []);

  const loadHistory = useCallback(() => {
    api.get('/api/v2/my/transactions', { params: { limit: 10 } })
      .then((res) => setHistory(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    loadBalance();
    loadHistory();
    api.get('/api/v2/settings/payment')
      .then((res) => setPayment(res.data?.data ?? null))
      .catch(() => setPayment(null));
  }, [loadBalance, loadHistory]);

  const effectiveAmount = useMemo(() => {
    if (customAmount.trim()) {
      const n = Number(customAmount.replace(/\D/g, ''));
      return Number.isFinite(n) ? n : 0;
    }
    return amount;
  }, [amount, customAmount]);

  const amountError =
    effectiveAmount < MIN_AMOUNT || effectiveAmount > MAX_AMOUNT
      ? `Số tiền nạp từ ${MIN_AMOUNT.toLocaleString('vi-VN')}đ đến ${MAX_AMOUNT.toLocaleString('vi-VN')}đ.`
      : null;

  const submit = async () => {
    if (amountError) {
      toast.error(amountError);
      return;
    }
    setIsSubmitting(true);
    try {
      // Khoá chống tạo trùng nếu bấm nhiều lần hoặc mạng retry.
      const idempotencyKey = `dep-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const res = await api.post('/api/v2/my/transactions', {
        amount: effectiveAmount,
        method: 'banking',
        idempotency_key: idempotencyKey,
      });
      const tx = res.data?.data as DepositTransaction | undefined;
      if (!tx) throw new Error('Phản hồi không hợp lệ');
      setCreated(tx);
      loadHistory();
      if (tx.status === 'success') {
        // Chế độ thử nghiệm cộng tiền ngay -> nạp lại số dư để hiển thị đúng.
        loadBalance();
        toast.success('Chế độ thử nghiệm: đã cộng tiền vào ví.');
      } else {
        toast.success('Đã ghi nhận yêu cầu nạp tiền.');
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không tạo được yêu cầu nạp tiền. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text)
      .then(() => toast.success(`Đã copy ${label}.`))
      .catch(() => toast.error('Không copy được, vui lòng chọn và copy thủ công.'));
  };

  return (
    <div className="max-w-[900px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Nạp tiền vào ví</h1>
        <p className="text-gray-500 text-[15px] mt-1">
          Số dư trong ví dùng để mua gói VIP khi đăng tin.
        </p>
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary-light flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Số dư hiện tại</p>
              <p className="text-xl font-extrabold text-gray-900">
                {balance === null ? '—' : `${balance.toLocaleString('vi-VN')} đ`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nói thẳng đang ở chế độ thử nghiệm — người dùng phải biết tiền này không phải nạp thật. */}
      {payment?.simulate_mode && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex gap-2 text-sm">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <span className="text-gray-700">
            <span className="font-bold">Chế độ thử nghiệm đang bật.</span> Tiền sẽ được cộng vào ví
            ngay khi bấm, không cần chuyển khoản thật. Dùng để chạy thử luồng nạp tiền.
          </span>
        </div>
      )}

      {/* Yêu cầu vừa tạo — nêu rõ CHƯA cộng tiền, tránh gây hiểu là đã nạp xong. */}
      {created && (
        <Card className="rounded-2xl border-amber-200 bg-amber-50/60 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                {created.status === 'success' ? (
                  <>
                    <p className="font-bold text-gray-900">Đã cộng tiền vào ví (thử nghiệm)</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Giao dịch <span className="font-bold text-gray-900">{created.code}</span> —
                      <span className="font-bold text-gray-900"> {formatPrice(created.amount)}</span> đã được
                      cộng ngay vì hệ thống đang ở chế độ thử nghiệm. Đây KHÔNG phải giao dịch nạp tiền thật.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-gray-900">Yêu cầu nạp tiền đã được ghi nhận</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Mã yêu cầu <span className="font-bold text-gray-900">{created.code}</span> —
                      số tiền <span className="font-bold text-gray-900">{formatPrice(created.amount)}</span>.
                      Số dư sẽ được cộng <span className="font-semibold">sau khi quản trị viên xác nhận</span> đã
                      nhận được chuyển khoản.
                    </p>
                  </>
                )}
              </div>
            </div>

            {created.status === 'success' ? null : payment?.configured ? (
              <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-2 text-sm">
                <p className="font-bold text-gray-900 mb-1">Thông tin chuyển khoản</p>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Ngân hàng</span>
                  <span className="font-semibold text-gray-900">{payment.bank_name}</span>
                </div>
                <div className="flex justify-between gap-3 items-center">
                  <span className="text-gray-500">Số tài khoản</span>
                  <span className="font-semibold text-gray-900 flex items-center gap-2">
                    {payment.bank_account}
                    <button
                      type="button"
                      onClick={() => copy(payment.bank_account ?? '', 'số tài khoản')}
                      className="p-1 rounded hover:bg-gray-100"
                      title="Copy số tài khoản"
                    >
                      <Copy className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Chủ tài khoản</span>
                  <span className="font-semibold text-gray-900">{payment.bank_holder}</span>
                </div>
                <div className="flex justify-between gap-3 items-center">
                  <span className="text-gray-500">Nội dung chuyển khoản</span>
                  <span className="font-semibold text-gray-900 flex items-center gap-2">
                    {created.code}
                    <button
                      type="button"
                      onClick={() => copy(created.code, 'nội dung chuyển khoản')}
                      className="p-1 rounded hover:bg-gray-100"
                      title="Copy nội dung chuyển khoản"
                    >
                      <Copy className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                  </span>
                </div>
                <p className="text-xs text-gray-500 pt-1">
                  Ghi đúng nội dung <span className="font-semibold">{created.code}</span> để được đối chiếu nhanh.
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-white border border-gray-200 p-4 text-sm text-gray-600 flex gap-2">
                <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>
                  Thông tin chuyển khoản chưa được cấu hình. Vui lòng liên hệ quản trị viên
                  {payment?.hotline ? ` (${payment.hotline})` : ''} kèm mã yêu cầu{' '}
                  <span className="font-semibold text-gray-900">{created.code}</span> để được hướng dẫn.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardContent className="p-5 space-y-5">
          <div>
            <Label className="font-semibold text-gray-700">Chọn số tiền</Label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMOUNT_PRESETS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => { setAmount(v); setCustomAmount(''); }}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    !customAmount.trim() && amount === v
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {v.toLocaleString('vi-VN')} đ
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="font-semibold text-gray-700">Hoặc nhập số tiền khác</Label>
            <input
              type="text"
              inputMode="numeric"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="VD: 350000"
              className="mt-2 w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {customAmount.trim() && (
              <p className="text-xs text-gray-500 mt-1">
                Tương đương {Number(customAmount).toLocaleString('vi-VN')} đ
              </p>
            )}
          </div>

          <div>
            <Label className="font-semibold text-gray-700">Phương thức</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-3 rounded-xl border border-primary bg-primary-light px-4 py-3">
                <Landmark className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">Chuyển khoản ngân hàng</p>
                  <p className="text-xs text-gray-600">Quản trị viên xác nhận và cộng tiền vào ví</p>
                </div>
              </div>
              {/* Chưa tích hợp cổng thanh toán — hiển thị rõ "Sắp có" và KHÔNG cho chọn, thay vì
                  nhận yêu cầu rồi người dùng không có cách nào trả tiền. */}
              {[
                { name: 'VNPay', desc: 'Cổng thanh toán VNPay-QR', Icon: CreditCard },
                { name: 'MoMo', desc: 'Ví điện tử MoMo', Icon: Smartphone },
              ].map(({ name, desc, Icon }) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 opacity-60"
                >
                  <Icon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-600 text-sm">{name}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  <Badge variant="outline" className="text-gray-500 border-gray-300">Sắp có</Badge>
                </div>
              ))}
            </div>
          </div>

          {amountError && <p className="text-sm text-red-600">{amountError}</p>}

          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-sm text-gray-500">Số tiền nạp</p>
              <p className="text-2xl font-extrabold text-gray-900">
                {effectiveAmount > 0 ? `${effectiveAmount.toLocaleString('vi-VN')} đ` : '—'}
              </p>
            </div>
            <Button
              onClick={submit}
              disabled={isSubmitting || !!amountError}
              className="h-12 px-6 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang gửi...</>
              ) : (
                'Tạo yêu cầu nạp tiền'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardContent className="p-5">
          <p className="font-bold text-gray-900 mb-3">Yêu cầu gần đây</p>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có yêu cầu nạp tiền nào.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {history.map((tx) => {
                const st = STATUS_LABEL[tx.status] ?? {
                  text: tx.status,
                  className: 'bg-gray-100 text-gray-600 border-gray-200',
                };
                return (
                  <div key={tx.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {tx.code} · {formatPrice(tx.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tx.created_at ? new Date(tx.created_at).toLocaleString('vi-VN') : ''}
                      </p>
                    </div>
                    <Badge variant="outline" className={`${st.className} shrink-0`}>{st.text}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
