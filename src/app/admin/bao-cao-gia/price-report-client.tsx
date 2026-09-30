'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, LineChart, Loader2, Printer, RefreshCw, X } from 'lucide-react';
import { MAX_COMPARE_AREAS, parseCompare, priceReportApi } from '@/lib/price-report-api';
import { PriceReportFilters } from '@/components/admin/price-report/PriceReportFilters';
import { PriceKpiGrid } from '@/components/admin/price-report/PriceKpiGrid';
import { ChartLegend, PriceTrendChart } from '@/components/admin/price-report/PriceTrendChart';
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
  const compared = parseCompare(query.compare);
  const compareSeries = report?.compare ?? [];

  /** Tick/bỏ tick một khu vực trên bảng so sánh — lưu vào URL để gửi link giữ nguyên biểu đồ. */
  const toggleCompare = (areaId: string) => {
    const next = compared.includes(areaId)
      ? compared.filter((id) => id !== areaId)
      : [...compared, areaId].slice(0, MAX_COMPARE_AREAS);
    setQuery({ ...query, compare: next.join(',') });
  };

  const exportExcel = useMutation({
    mutationFn: () => priceReportApi.exportExcel(query),
    onError: (err) => toast.error(errMsg(err, 'Không xuất được file Excel.')),
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
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button type="button" onClick={() => exportExcel.mutate()} disabled={exportExcel.isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            {exportExcel.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Xuất Excel
          </button>
          <button type="button" onClick={() => window.print()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Printer className="h-4 w-4" />
            In / Lưu PDF
          </button>
          <button type="button" onClick={() => record.mutate()} disabled={record.isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary px-4 text-sm font-medium text-primary hover:bg-primary-light disabled:opacity-60">
            {record.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Cập nhật số liệu tháng này
          </button>
        </div>
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
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {compareSeries.length > 0 ? 'So sánh giá giữa các khu vực' : 'Diễn biến giá BĐS theo thời gian'}
                </h2>
                <p className="text-xs text-gray-500">
                  {compareSeries.length > 0
                    ? `Giá trung vị/m² của ${compareSeries.length} khu vực đang chọn, ${query.months} tháng gần nhất.`
                    : `Giá trung vị/m² theo từng tháng, ${query.months} tháng gần nhất. Dải mờ là khoảng thấp nhất – cao nhất.`}
                </p>
              </div>
              {compareSeries.length > 0 && (
                <button type="button" onClick={() => setQuery({ ...query, compare: '' })}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 self-start rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 hover:bg-gray-50 print:hidden">
                  <X className="h-3.5 w-3.5" />
                  Bỏ so sánh
                </button>
              )}
            </div>
            <PriceTrendChart points={report.months} series={compareSeries.length > 0 ? compareSeries : undefined} />
            {compareSeries.length > 0 && <ChartLegend series={compareSeries} />}
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-gray-900">So sánh khu vực</h2>
              <p className="text-xs text-gray-500">
                Số liệu tháng {report.kpi ? `${report.kpi.month.slice(5, 7)}/${report.kpi.month.slice(0, 4)}` : 'gần nhất'}.
                Tick cột &quot;So sánh&quot; để vẽ tối đa {MAX_COMPARE_AREAS} khu vực lên cùng biểu đồ, hoặc bấm tên khu vực để xem chi tiết.
              </p>
            </div>
            <AreaComparisonTable rows={report.areas} selectedAreaId={query.area}
              comparedIds={compared} onToggleCompare={toggleCompare}
              detailHref={(id) => `/admin/bao-cao-gia/khu-vuc/${id}${filters}`} />
          </section>
        </>
      )}
    </div>
  );
}
