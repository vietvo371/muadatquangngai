'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin } from 'lucide-react';
import { formatMonth, formatPerM2, priceReportApi, type PriceReportQuery } from '@/lib/price-report-api';
import { PriceReportFilters } from '@/components/admin/price-report/PriceReportFilters';
import { PriceKpiGrid } from '@/components/admin/price-report/PriceKpiGrid';
import { PriceTrendChart } from '@/components/admin/price-report/PriceTrendChart';
import { ReportNotice } from '@/components/admin/price-report/ReportNotice';
import { carryFilters, useReportQuery } from '@/components/admin/price-report/use-report-query';

/** Báo cáo chi tiết một khu vực — mở từ bảng So sánh khu vực, giữ nguyên loại BĐS và bộ lọc đã chọn. */
export default function AreaReportClient({ areaId }: { areaId: string }) {
  const { query, setQuery } = useReportQuery();
  const areaQuery: PriceReportQuery = { ...query, area: areaId };

  const { data: options } = useQuery({ queryKey: ['price-report-options'], queryFn: priceReportApi.options, staleTime: 5 * 60_000 });
  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['price-report', areaQuery],
    queryFn: () => priceReportApi.get(areaQuery),
  });

  const area = options?.areas.find((a) => a.id === areaId);
  const province = options?.provinces.find((p) => p.id === area?.province_id);
  const category = options?.categories.find((c) => c.id === query.category);
  const backHref = `/admin/bao-cao-gia${carryFilters(query)}`;
  // Tháng mới nhất lên đầu bảng — khớp cách đọc số liệu "gần đây nhất trước".
  const monthRows = [...(report?.months ?? [])].reverse();

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Báo cáo giá
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{area?.name ?? 'Khu vực'}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {[province?.name, category?.name ?? 'Tất cả loại BĐS'].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <PriceReportFilters hideLocation query={areaQuery} options={options}
        onChange={(next) => setQuery({ ...next, area: '' })} />
      <ReportNotice source={query.source} firstMonth={report?.first_month ?? null} />

      {isLoading ? (
        <p className="py-10 text-center text-sm text-gray-500">Đang tải báo cáo...</p>
      ) : isError || !report ? (
        <p className="py-10 text-center text-sm text-cta">Không tải được báo cáo khu vực.</p>
      ) : (
        <>
          <PriceKpiGrid kpi={report.kpi} />

          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-900">Lịch sử giá khu vực</h2>
              <p className="text-xs text-gray-500">Giá trung vị/m² theo từng tháng, {query.months} tháng gần nhất.</p>
            </div>
            <PriceTrendChart points={report.months} />
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <h2 className="border-b border-gray-100 px-4 py-4 text-base font-semibold text-gray-900 sm:px-6">Số liệu theo tháng</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                    <th className="px-4 py-3">Tháng</th>
                    <th className="px-4 py-3 text-right">Giá trung vị/m²</th>
                    <th className="px-4 py-3 text-right">Thấp nhất</th>
                    <th className="px-4 py-3 text-right">Cao nhất</th>
                    <th className="px-4 py-3 text-right">Số tin</th>
                  </tr>
                </thead>
                <tbody>
                  {monthRows.map((row) => (
                    <tr key={row.month} className="border-b border-gray-50">
                      <td className="px-4 py-3 text-gray-900">{formatMonth(row.month)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatPerM2(row.median)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatPerM2(row.min)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatPerM2(row.max)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{row.count.toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
