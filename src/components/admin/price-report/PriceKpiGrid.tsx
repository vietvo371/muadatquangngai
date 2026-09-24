import { formatChange, formatMonth, formatPerM2, type PriceReportKpi } from '@/lib/price-report-api';

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}

function KpiCard({ label, value, hint, emphasis }: KpiCardProps) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${emphasis ? 'border-primary bg-primary-light' : 'border-gray-100 bg-white'}`}>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1 truncate text-xl font-bold ${emphasis ? 'text-primary' : 'text-gray-900'}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

/** Biến động chỉ là con số lịch sử — màu trung tính, không tô xanh/đỏ để tránh gợi ý tốt/xấu. */
const changeHint = (value: number | null, base: string) =>
  value === null ? `Chưa đủ dữ liệu ${base} để so sánh` : `So với ${base}`;

export function PriceKpiGrid({ kpi }: { kpi: PriceReportKpi | null }) {
  if (!kpi) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
        Không có tin nào khớp bộ lọc trong khoảng thời gian đã chọn.
      </div>
    );
  }
  const month = formatMonth(kpi.month);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <KpiCard emphasis label="Giá trung vị/m²" value={formatPerM2(kpi.median)} hint={`Tháng ${month} — chỉ số đại diện`} />
      <KpiCard label="Giá thấp nhất/m²" value={formatPerM2(kpi.min)} hint={`Tháng ${month}`} />
      <KpiCard label="Giá cao nhất/m²" value={formatPerM2(kpi.max)} hint={`Tháng ${month}`} />
      <KpiCard label="Số tin ghi nhận" value={kpi.count.toLocaleString('vi-VN')}
        hint={kpi.outliers > 0 ? `${kpi.outliers} tin giá bất thường không tính vào thấp/cao nhất` : `Tháng ${month}`} />
      <KpiCard label="Biến động tháng trước" value={formatChange(kpi.change_1m)} hint={changeHint(kpi.change_1m, 'tháng trước')} />
      <KpiCard label="Biến động 12 tháng" value={formatChange(kpi.change_12m)} hint={changeHint(kpi.change_12m, 'cùng kỳ năm trước')} />
    </div>
  );
}
