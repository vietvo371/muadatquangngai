'use client';

import { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';

interface MortgageCalculatorProps {
  /** Tổng giá trị bất động sản (VNĐ). Khối sẽ ẩn nếu không có giá hợp lệ. */
  totalPrice: number | null | undefined;
}

const DEFAULT_DOWN_PAYMENT_PERCENT = 30;
const DEFAULT_ANNUAL_RATE = 10;
const DEFAULT_TERM_YEARS = 20;
const MONTHS_PER_YEAR = 12;

function formatVnd(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')} đ`;
}

/**
 * Công cụ ước tính khoản vay mua bất động sản.
 * Công thức niên kim (annuity): M = P * r / (1 - (1 + r)^-n)
 *   P = số tiền vay = giá × (1 - % trả trước)
 *   r = lãi suất tháng = lãi suất năm / 12
 *   n = số kỳ trả = số năm × 12
 * Khi lãi suất bằng 0 thì M = P / n (tránh chia cho 0).
 */
export function MortgageCalculator({ totalPrice }: MortgageCalculatorProps) {
  const [downPercent, setDownPercent] = useState(DEFAULT_DOWN_PAYMENT_PERCENT);
  const [annualRate, setAnnualRate] = useState(DEFAULT_ANNUAL_RATE);
  const [termYears, setTermYears] = useState(DEFAULT_TERM_YEARS);

  const price = Number(totalPrice) || 0;

  const result = useMemo(() => {
    const loanAmount = price * (1 - downPercent / 100);
    const months = termYears * MONTHS_PER_YEAR;
    if (loanAmount <= 0 || months <= 0) {
      return { loanAmount: Math.max(loanAmount, 0), monthly: 0, totalInterest: 0, months };
    }

    const monthlyRate = annualRate / 100 / MONTHS_PER_YEAR;
    const monthly =
      monthlyRate === 0
        ? loanAmount / months
        : (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

    return {
      loanAmount,
      monthly,
      totalInterest: monthly * months - loanAmount,
      months,
    };
  }, [price, downPercent, annualRate, termYears]);

  if (price <= 0) return null;

  const fields: {
    label: string;
    suffix: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
  }[] = [
    { label: 'Trả trước', suffix: '%', value: downPercent, min: 0, max: 90, step: 5, onChange: setDownPercent },
    { label: 'Lãi suất', suffix: '%/năm', value: annualRate, min: 0, max: 25, step: 0.5, onChange: setAnnualRate },
    { label: 'Thời hạn vay', suffix: 'năm', value: termYears, min: 1, max: 35, step: 1, onChange: setTermYears },
  ];

  return (
    <div className="mb-8 pt-8 border-t border-gray-100">
      <h2 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
        <Calculator className="h-[18px] w-[18px] text-primary" />
        Tính khoản vay
      </h2>

      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {fields.map((field) => (
            <div key={field.label}>
              <label
                htmlFor={`loan-${field.label}`}
                className="block text-[13px] font-semibold text-gray-700 mb-1.5"
              >
                {field.label} <span className="text-gray-400 font-medium">({field.suffix})</span>
              </label>
              <input
                id={`loan-${field.label}`}
                type="number"
                inputMode="decimal"
                min={field.min}
                max={field.max}
                step={field.step}
                value={field.value}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (Number.isNaN(next)) return;
                  field.onChange(Math.min(Math.max(next, field.min), field.max));
                }}
                className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-[15px] font-semibold text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="range"
                aria-label={`${field.label} (${field.suffix})`}
                min={field.min}
                max={field.max}
                step={field.step}
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
                className="w-full mt-2 accent-[#1075b1]"
              />
            </div>
          ))}
        </div>

        <div className="mt-5 pt-5 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border border-primary/20 p-4 sm:col-span-1">
            <div className="text-[12px] text-gray-500 uppercase tracking-wide mb-1">Trả hàng tháng</div>
            <div className="text-[20px] font-extrabold text-primary leading-tight">
              {formatVnd(result.monthly)}
            </div>
            <div className="text-[12px] text-gray-400 mt-0.5">
              trong {result.months} tháng ({termYears} năm)
            </div>
          </div>
          <div className="rounded-xl bg-white border border-gray-100 p-4">
            <div className="text-[12px] text-gray-500 uppercase tracking-wide mb-1">Số tiền vay</div>
            <div className="text-[16px] font-bold text-gray-900">{formatVnd(result.loanAmount)}</div>
            <div className="text-[12px] text-gray-400 mt-0.5">
              Trả trước {formatPrice(price - result.loanAmount)}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-gray-100 p-4">
            <div className="text-[12px] text-gray-500 uppercase tracking-wide mb-1">Tổng tiền lãi</div>
            <div className="text-[16px] font-bold text-gray-900">{formatVnd(result.totalInterest)}</div>
            <div className="text-[12px] text-gray-400 mt-0.5">
              Tổng phải trả {formatPrice(result.loanAmount + result.totalInterest)}
            </div>
          </div>
        </div>

        <p className="mt-4 text-[12px] text-gray-500 leading-relaxed">
          Kết quả chỉ là ước tính tham khảo theo phương pháp trả góp đều (niên kim), chưa gồm phí,
          bảo hiểm khoản vay và các thay đổi lãi suất theo từng thời kỳ. Đây không phải cam kết cho
          vay của bất kỳ ngân hàng nào.
        </p>
      </div>
    </div>
  );
}
