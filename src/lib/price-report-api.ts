import api from '@/lib/axios';
import { formatMoneyShort } from '@/lib/formatters';

/** Kiểu dữ liệu phía client cho Báo cáo giá — khớp với src/lib/price-report.ts. */

export const REPORT_MONTH_OPTIONS = [3, 6, 12, 24] as const;

export const DATA_SOURCE_OPTIONS = [
  { value: 'listing', label: 'Giá rao bán' },
  { value: 'transaction', label: 'Giá giao dịch (đã xác nhận)' },
] as const;

export interface PriceReportQuery {
  months: number;
  source: string;
  /** Danh sách id khu vực so sánh, nối bằng dấu phẩy (Notion "So sánh biểu đồ"). */
  compare: string;
  province: string;
  area: string;
  category: string;
  area_min: string;
  area_max: string;
  price_min: string;
  price_max: string;
}

export const DEFAULT_REPORT_QUERY: PriceReportQuery = {
  months: 12, source: 'listing', compare: '', province: '', area: '', category: '',
  area_min: '', area_max: '', price_min: '', price_max: '',
};

/** Nhiều đường quá thì biểu đồ rối — khớp với giới hạn phía server. */
export const MAX_COMPARE_AREAS = 5;

export const parseCompare = (value: string): string[] =>
  value ? value.split(',').filter(Boolean).slice(0, MAX_COMPARE_AREAS) : [];

export interface MonthPoint {
  month: string;
  median: number | null;
  min: number | null;
  max: number | null;
  average: number | null;
  count: number;
  outliers: number;
}

export interface PriceReportKpi {
  month: string;
  median: number | null;
  min: number | null;
  max: number | null;
  average: number | null;
  count: number;
  outliers: number;
  change_1m: number | null;
  change_12m: number | null;
}

export interface AreaRow {
  id: string;
  name: string;
  median: number | null;
  count: number;
  change3m: number | null;
  change6m: number | null;
  change12m: number | null;
}

export interface AreaSeries {
  id: string;
  name: string;
  points: MonthPoint[];
}

export interface PriceReport {
  current_month: string;
  first_month: string | null;
  months: MonthPoint[];
  kpi: PriceReportKpi | null;
  areas: AreaRow[];
  compare: AreaSeries[];
}

export interface PriceMapArea extends AreaRow {
  latitude: number | null;
  longitude: number | null;
}

export interface PriceReportOptions {
  provinces: { id: string; name: string }[];
  areas: { id: string; name: string; province_id: string }[];
  categories: { id: string; name: string }[];
}

/** Bỏ các tham số rỗng để URL gọn và backend dùng mặc định của nó. */
export function toQueryParams(query: PriceReportQuery): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== '' && v !== null).map(([k, v]) => [k, String(v)]),
  );
}

export function parseReportQuery(params: URLSearchParams): PriceReportQuery {
  const months = Number(params.get('months'));
  const read = (key: keyof PriceReportQuery) => params.get(key) ?? '';
  return {
    months: (REPORT_MONTH_OPTIONS as readonly number[]).includes(months) ? months : DEFAULT_REPORT_QUERY.months,
    source: read('source') || DEFAULT_REPORT_QUERY.source,
    compare: read('compare'),
    province: read('province'), area: read('area'), category: read('category'),
    area_min: read('area_min'), area_max: read('area_max'),
    price_min: read('price_min'), price_max: read('price_max'),
  };
}

/** Lấy tên file server đặt trong header Content-Disposition. */
function fileNameFromDisposition(header: unknown): string | null {
  if (typeof header !== 'string') return null;
  return header.match(/filename="([^"]+)"/)?.[1] ?? null;
}

export const priceReportApi = {
  get: (query: PriceReportQuery) =>
    api.get('/api/v2/admin/price-report', { params: toQueryParams(query) }).then((r) => r.data.data as PriceReport),
  options: () =>
    api.get('/api/v2/admin/price-report/options').then((r) => r.data.data as PriceReportOptions),
  /**
   * Tải file Excel. Phải đi qua axios để kèm token đăng nhập (thẻ <a> thường không gửi token,
   * server sẽ trả 401), nhận về dạng nhị phân rồi mới lưu thành file.
   */
  exportExcel: async (query: PriceReportQuery) => {
    const response = await api.get('/api/v2/admin/price-report/export', {
      params: toQueryParams(query),
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileNameFromDisposition(response.headers['content-disposition']) ?? 'bao-cao-gia.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
  map: (query: PriceReportQuery) =>
    api.get('/api/v2/admin/price-report/map', { params: toQueryParams(query) })
      .then((r) => r.data.data as { month: string | null; areas: PriceMapArea[] }),
  recordCurrentMonth: () =>
    api.post('/api/v2/admin/price-report/snapshot').then((r) => r.data as { message: string; data: { count: number } }),
};

/** "2026-09" → "09/2026". */
export const formatMonth = (month: string) => `${month.slice(5, 7)}/${month.slice(0, 4)}`;

/** Giá mỗi m² dạng "53,331 triệu/m²"; thiếu dữ liệu thì trả gạch ngang, không bao giờ hiện 0. */
export const formatPerM2 = (value: number | null) => (value === null ? '—' : `${formatMoneyShort(value)}/m²`);

/** "+2,5%", "-1%", hoặc "—" khi chưa đủ dữ liệu để so sánh. */
export function formatChange(value: number | null): string {
  if (value === null) return '—';
  const text = `${Math.abs(value).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;
  if (value > 0) return `+${text}`;
  if (value < 0) return `-${text}`;
  return text;
}
