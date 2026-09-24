import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { formatChange, formatPerM2, type AreaRow } from '@/lib/price-report-api';

/** Dưới ngưỡng này, một tin đổi giá cũng làm % biến động nhảy mạnh — gắn nhãn để người xem biết. */
const MIN_RELIABLE_COUNT = 3;

interface AreaComparisonTableProps {
  rows: AreaRow[];
  /** Tạo link trang chi tiết, giữ nguyên bộ lọc đang xem. */
  detailHref: (areaId: string) => string;
  selectedAreaId?: string;
}

export function AreaComparisonTable({ rows, detailHref, selectedAreaId }: AreaComparisonTableProps) {
  if (rows.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-500">Chưa có khu vực nào có dữ liệu với bộ lọc này.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
            <th className="px-4 py-3">Khu vực</th>
            <th className="px-4 py-3 text-right">Giá trung vị/m²</th>
            <th className="px-4 py-3 text-right">Số tin</th>
            <th className="px-4 py-3 text-right">Biến động 3 tháng</th>
            <th className="px-4 py-3 text-right">Biến động 12 tháng</th>
            <th className="w-10 px-2 py-3" aria-hidden />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} data-testid="area-row"
              className={`border-b border-gray-50 transition hover:bg-gray-50 ${row.id === selectedAreaId ? 'bg-primary-light' : ''}`}>
              <td className="px-4 py-3 font-medium text-gray-900">
                <Link href={detailHref(row.id)} className="hover:text-primary">{row.name}</Link>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatPerM2(row.median)}</td>
              <td className="px-4 py-3 text-right text-gray-700">
                {row.count < MIN_RELIABLE_COUNT && (
                  <span title="Ít tin ghi nhận — biến động chỉ mang tính tham khảo"
                    className="mr-2 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                    Ít dữ liệu
                  </span>
                )}
                {row.count.toLocaleString('vi-VN')}
              </td>
              <td className={`px-4 py-3 text-right ${row.count < MIN_RELIABLE_COUNT ? 'text-gray-400' : 'text-gray-700'}`}>
                {formatChange(row.change3m)}
              </td>
              <td className={`px-4 py-3 text-right ${row.count < MIN_RELIABLE_COUNT ? 'text-gray-400' : 'text-gray-700'}`}>
                {formatChange(row.change12m)}
              </td>
              <td className="px-2 py-3">
                <Link href={detailHref(row.id)} aria-label={`Xem chi tiết ${row.name}`} className="text-gray-400 hover:text-primary">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
