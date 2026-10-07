'use client';

import { useMemo, useState } from 'react';
import { formatMoney } from '@/lib/display-format';

/**
 * Công cụ tính khoản vay mua nhà.
 *
 * Giá trị ban đầu lấy từ giá thấp nhất của dự án; dự án chưa có giá thì ô để trống cho người
 * xem tự nhập — KHÔNG điền sẵn "3 tỷ" như trước, vì người xem dễ tưởng đó là giá dự án.
 * Đã bỏ dòng "Liên kết 8+ ngân hàng Quảng Ngãi": không có liên kết ngân hàng nào thật.
 */

type PaymentMethod = 'declining' | 'equal';

interface LoanResult {
  loanAmount: number;
  firstMonthPayment: number;
  monthlyPrincipal: number;
  firstMonthInterest: number;
  totalInterest: number;
}

function calculateLoan(value: number, ratio: number, years: number, rate: number, method: PaymentMethod): LoanResult {
  const loanAmount = value * (ratio / 100);
  const r = rate / 12 / 100;
  const n = years * 12;

  if (method === 'declining') {
    const monthlyPrincipal = loanAmount / n;
    // Tổng lãi dư nợ giảm dần: r × gốc × (n + 1) / 2 — cùng kết quả với cộng dồn từng tháng.
    const totalInterest = (r * loanAmount * (n + 1)) / 2;
    const firstMonthInterest = loanAmount * r;
    return { loanAmount, monthlyPrincipal, firstMonthInterest, firstMonthPayment: monthlyPrincipal + firstMonthInterest, totalInterest };
  }

  const firstMonthPayment = r > 0 ? (loanAmount * r * (1 + r) ** n) / ((1 + r) ** n - 1) : loanAmount / n;
  const firstMonthInterest = loanAmount * r;
  return {
    loanAmount,
    firstMonthPayment,
    firstMonthInterest,
    monthlyPrincipal: firstMonthPayment - firstMonthInterest,
    totalInterest: firstMonthPayment * n - loanAmount,
  };
}

const vnd = (n: number) => `${Math.round(n).toLocaleString('vi-VN')} đ`;

export function LoanCalculator({ initialValue }: { initialValue: number | null }) {
  const [value, setValue] = useState<number>(initialValue ?? 0);
  const [ratio, setRatio] = useState(70);
  const [years, setYears] = useState(15);
  const [rate, setRate] = useState(8.5);
  const [method, setMethod] = useState<PaymentMethod>('declining');

  const result = useMemo(() => calculateLoan(value, ratio, years, rate, method), [value, ratio, years, rate, method]);
  const hasValue = value > 0 && rate > 0;

  return (
    <div className="space-y-4 rounded-[var(--radius-card)] border border-gray-100 bg-white p-4">
      <h3 className="border-l-2 border-primary pl-2 text-[11px] font-bold uppercase tracking-wide text-gray-900">
        Công cụ tính khoản vay ngân hàng
      </h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-3.5">
          <label className="block space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Giá trị bất động sản (VNĐ)</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Nhập giá trị cần vay"
              value={value > 0 ? value.toLocaleString('vi-VN') : ''}
              onChange={(e) => {
                const n = parseInt(e.target.value.replace(/\D/g, ''), 10);
                setValue(Number.isFinite(n) ? n : 0);
              }}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary/25"
            />
            {formatMoney(value) && <span className="text-[10px] font-medium text-primary">Bằng chữ: {formatMoney(value)}</span>}
          </label>

          <label className="block space-y-1">
            <span className="flex justify-between text-[11px] font-bold uppercase tracking-wide text-gray-400">
              <span>Tỷ lệ vay vốn</span>
              <span className="font-semibold text-primary">{ratio}%</span>
            </span>
            <input type="range" min={30} max={85} value={ratio} onChange={(e) => setRatio(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-primary" />
          </label>

          <label className="block space-y-1">
            <span className="flex justify-between text-[11px] font-bold uppercase tracking-wide text-gray-400">
              <span>Thời gian vay</span>
              <span className="font-semibold text-primary">
                {years} năm ({years * 12} tháng)
              </span>
            </span>
            <input type="range" min={1} max={25} value={years} onChange={(e) => setYears(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-primary" />
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Lãi suất vay (% / năm)</span>
            <input
              type="number"
              step={0.1}
              min={0.1}
              max={30}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="h-9 w-24 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold outline-none focus:border-primary"
            />
          </label>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Phương thức trả nợ</span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['declining', 'Dư nợ giảm dần'],
                  ['equal', 'Chia đều mỗi tháng'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMethod(key)}
                  className={`h-9 rounded-lg border text-[11px] font-bold transition-all ${
                    method === key ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between space-y-4 rounded-[var(--radius-card)] border border-gray-100 bg-gray-50 p-4">
          {hasValue ? (
            <>
              <div className="space-y-3 text-xs">
                <div className="border-b border-gray-200/50 pb-2.5">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">Cần chuẩn bị ({100 - ratio}%)</p>
                  <p className="font-bold text-gray-700">{vnd(value - result.loanAmount)}</p>
                </div>
                <div className="border-b border-gray-200/50 pb-2.5">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">Số tiền vay ({ratio}%)</p>
                  <p className="font-bold text-primary">{vnd(result.loanAmount)}</p>
                </div>
                <div className="border-b border-gray-200/50 pb-2.5">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">Trả tháng đầu (gốc + lãi)</p>
                  <p className="text-sm font-extrabold text-gray-900">{vnd(result.firstMonthPayment)}</p>
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    Gốc {vnd(result.monthlyPrincipal)} + Lãi {vnd(result.firstMonthInterest)}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">Tổng tiền lãi</p>
                  <p className="font-bold text-gray-700">{vnd(result.totalInterest)}</p>
                </div>
              </div>
              <div className="rounded-lg border border-primary/10 bg-primary/5 p-2.5 text-center">
                <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">Tổng phải trả</p>
                <p className="text-sm font-extrabold text-primary">{vnd(result.loanAmount + result.totalInterest)}</p>
              </div>
              <p className="text-[10px] leading-snug text-gray-400">
                Số liệu chỉ để tham khảo. Lãi suất và điều kiện vay thực tế tuỳ từng ngân hàng.
              </p>
            </>
          ) : (
            <p className="m-auto text-center text-[13px] text-gray-400">Nhập giá trị bất động sản để xem kết quả.</p>
          )}
        </div>
      </div>
    </div>
  );
}
