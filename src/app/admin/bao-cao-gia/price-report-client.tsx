'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LineChart, Loader2, RefreshCw } from 'lucide-react';
import { priceReportApi } from '@/lib/price-report-api';
import { PriceReportFilters } from '@/components/admin/price-report/PriceReportFilters';
import { PriceKpiGrid } from '@/components/admin/price-report/PriceKpiGrid';
import { PriceTrendChart } from '@/components/admin/price-report/PriceTrendChart';
import { AreaComparisonTable } from '@/components/admin/price-report/AreaComparisonTable';
import { ReportNotice } from '@/components/admin/price-report/ReportNotice';
import { carryFilters, useReportQuery } from '@/components/admin/price-report/use-report-query';

const errMsg = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

/** Admin → Báo cáo giá (Notion 24/09, Phase 1). */
export default function PriceReportClient() {
  const { query, setQuery } = useReportQuery();
  const queryClient = useQueryClient();

  const { data: options } = useQuery({ queryKey: ['price-report-options'], queryFn: priceReportApi.options, staleTime: 5 * 60_000 });
  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['price-report', query],
    queryFn: () => priceReportApi.get(query),
  });
  const record = useMutation({
    mutationFn: priceReportApi.recordCurrentMonth,
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['price-report'] });
      queryClient.invalidateQueries({ queryKey: ['price-report-options'] });
    },
    onError: (err) => toast.error(errMsg(err, 'Không cập nhật được số liệu.')),
  });

  const filters = carryFilters(query);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light">
            <LineChart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Báo cáo giá</h1>
            <p className="mt-0.5 text-sm text-gray-500">Diễn biến giá/m² theo khu vực và loại bất động sản.</p>
          </div>
        </div>
        <button type="button" onClick={() => record.mutate()} disabled={record.isPending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary px-4 text-sm font-medium text-primary hover:bg-primary-light disabled:opacity-60">
          {record.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Cập nhật số liệu tháng này
        </button>
      </div>

      <PriceReportFilters query={query} options={options} onChange={setQuery} />
      <ReportNotice source={query.source} firstMonth={report?.first_month ?? null} />

      {isLoading ? (
        <p className="py-10 text-center text-sm text-gray-500">Đang tải báo cáo...</p>
      ) : isError || !report ? (
        <p className="py-10 text-center text-sm text-cta">Không tải được báo cáo giá.</p>
      ) : (
        <>
          <PriceKpiGrid kpi={report.kpi} />

          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-900">Diễn biến giá BĐS theo thời gian</h2>
              <p className="text-xs text-gray-500">
                Giá trung vị/m² theo từng tháng, {query.months} tháng gần nhất. Dải mờ là khoảng thấp nhất – cao nhất.
              </p>
            </div>
            <PriceTrendChart points={report.months} />
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-gray-900">So sánh khu vực</h2>
              <p className="text-xs text-gray-500">
                Số liệu tháng {report.kpi ? `${report.kpi.month.slice(5, 7)}/${report.kpi.month.slice(0, 4)}` : 'gần nhất'}.
                Bấm vào một khu vực để xem báo cáo chi tiết.
              </p>
            </div>
            <AreaComparisonTable rows={report.areas} selectedAreaId={query.area}
              detailHref={(id) => `/admin/bao-cao-gia/khu-vuc/${id}${filters}`} />
          </section>
        </>
      )}
    </div>
  );
}
