import { db } from '@/lib/db';
import { dbNow } from '@/lib/db-time';
import { Prisma } from '@/generated/prisma/client';

/**
 * Báo cáo giá (Notion 24/09, Phase 1) — đọc từ price_observations
 * (prisma/sql/2026-09-24-03-price-report.sql).
 *
 * Nguyên tắc (khách chốt): chỉ đưa dữ liệu lịch sử, biểu đồ và % biến động. Không kết luận
 * "đáy thị trường", "sắp tăng", "nên mua" hay bất kỳ khuyến nghị đầu tư nào.
 *
 * Trung vị là chỉ số đại diện. Min/max/trung bình bỏ các tin bất thường theo hàng rào 1,5×IQR
 * trên giá/m² (khi tháng có từ 4 tin trở lên) — cùng quy tắc với hàm record_price_snapshot.
 */

export const REPORT_MONTH_OPTIONS = [3, 6, 12, 24] as const;
export type ReportMonths = (typeof REPORT_MONTH_OPTIONS)[number];
const DEFAULT_MONTHS: ReportMonths = 12;

export const DATA_SOURCES = ['listing', 'transaction'] as const;
export type DataSource = (typeof DATA_SOURCES)[number];

/** Cần 13 tháng để tính biến động 12 tháng của tháng mới nhất, kể cả khi người xem chọn 3 tháng. */
const MIN_WINDOW_MONTHS = 13;

export interface PriceReportFilters {
  months: ReportMonths;
  source: DataSource;
  provinceId: bigint | null;
  areaId: bigint | null;
  categoryId: bigint | null;
  areaMin: number | null;
  areaMax: number | null;
  priceMin: number | null;
  priceMax: number | null;
}

export interface MonthPoint {
  month: string; // YYYY-MM
  median: number | null;
  min: number | null;
  max: number | null;
  average: number | null;
  count: number;
  outliers: number;
}

export interface AreaRow {
  id: string;
  name: string;
  median: number | null;
  count: number;
  change3m: number | null;
  change12m: number | null;
}

const idParam = (value: string | null) => (value && /^\d+$/.test(value) ? BigInt(value) : null);

function numberParam(value: string | null): number | null {
  if (value === null || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function parsePriceReportFilters(params: URLSearchParams): PriceReportFilters {
  const months = Number(params.get('months'));
  const source = params.get('source');
  return {
    months: (REPORT_MONTH_OPTIONS as readonly number[]).includes(months) ? (months as ReportMonths) : DEFAULT_MONTHS,
    source: (DATA_SOURCES as readonly string[]).includes(source ?? '') ? (source as DataSource) : 'listing',
    provinceId: idParam(params.get('province')),
    areaId: idParam(params.get('area')),
    categoryId: idParam(params.get('category')),
    areaMin: numberParam(params.get('area_min')),
    areaMax: numberParam(params.get('area_max')),
    priceMin: numberParam(params.get('price_min')),
    priceMax: numberParam(params.get('price_max')),
  };
}

/** Tháng hiện tại theo giờ Việt Nam, dạng YYYY-MM. */
export function currentMonthKey(): string {
  return dbNow().toISOString().slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthIndex - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

/** Danh sách tháng liên tiếp, kết thúc ở `lastMonth`. */
export function monthRange(lastMonth: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => shiftMonth(lastMonth, i - count + 1));
}

export function percentChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function buildWhere(filters: PriceReportFilters, fromMonth: string, { withArea }: { withArea: boolean }) {
  const parts: Prisma.Sql[] = [
    Prisma.sql`data_source = ${filters.source}`,
    Prisma.sql`period_month >= ${`${fromMonth}-01`}::date`,
  ];
  if (filters.provinceId !== null) parts.push(Prisma.sql`province_id = ${filters.provinceId}`);
  if (withArea && filters.areaId !== null) parts.push(Prisma.sql`area_id = ${filters.areaId}`);
  if (filters.categoryId !== null) parts.push(Prisma.sql`category_id = ${filters.categoryId}`);
  if (filters.areaMin !== null) parts.push(Prisma.sql`area_m2 >= ${filters.areaMin}`);
  if (filters.areaMax !== null) parts.push(Prisma.sql`area_m2 <= ${filters.areaMax}`);
  if (filters.priceMin !== null) parts.push(Prisma.sql`price >= ${filters.priceMin}`);
  if (filters.priceMax !== null) parts.push(Prisma.sql`price <= ${filters.priceMax}`);
  return Prisma.join(parts, ' AND ');
}

async function loadMonthlySeries(filters: PriceReportFilters, fromMonth: string): Promise<Map<string, MonthPoint>> {
  const where = buildWhere(filters, fromMonth, { withArea: true });
  const rows = await db.$queryRaw<MonthPoint[]>`
    WITH obs AS (
      SELECT period_month, price_per_m2 FROM price_observations WHERE ${where}
    ),
    stats AS (
      SELECT period_month,
             percentile_cont(0.25) WITHIN GROUP (ORDER BY price_per_m2) AS q1,
             percentile_cont(0.75) WITHIN GROUP (ORDER BY price_per_m2) AS q3,
             percentile_cont(0.5) WITHIN GROUP (ORDER BY price_per_m2) AS median,
             count(*) AS n
      FROM obs GROUP BY period_month
    )
    SELECT to_char(o.period_month, 'YYYY-MM') AS month,
           s.median::float8 AS median,
           (min(o.price_per_m2) FILTER (WHERE NOT x.is_outlier))::float8 AS min,
           (max(o.price_per_m2) FILTER (WHERE NOT x.is_outlier))::float8 AS max,
           (avg(o.price_per_m2) FILTER (WHERE NOT x.is_outlier))::float8 AS average,
           s.n::int AS count,
           (count(*) FILTER (WHERE x.is_outlier))::int AS outliers
    FROM obs o
    JOIN stats s USING (period_month)
    CROSS JOIN LATERAL (
      SELECT (s.n >= 4 AND (o.price_per_m2 < s.q1 - 1.5 * (s.q3 - s.q1)
                            OR o.price_per_m2 > s.q3 + 1.5 * (s.q3 - s.q1))) AS is_outlier
    ) x
    GROUP BY o.period_month, s.median, s.n
    ORDER BY o.period_month`;
  return new Map(rows.map((row) => [row.month, row]));
}

const emptyPoint = (month: string): MonthPoint => ({
  month, median: null, min: null, max: null, average: null, count: 0, outliers: 0,
});

/** So sánh khu vực — bỏ qua bộ lọc khu vực để luôn so được các phường/xã với nhau. */
async function loadAreaRows(filters: PriceReportFilters, fromMonth: string, referenceMonth: string): Promise<AreaRow[]> {
  const where = buildWhere(filters, fromMonth, { withArea: false });
  const rows = await db.$queryRaw<{ id: string; name: string; month: string; median: number; count: number }[]>`
    SELECT o.area_id::text AS id, d.name, to_char(o.period_month, 'YYYY-MM') AS month,
           (percentile_cont(0.5) WITHIN GROUP (ORDER BY o.price_per_m2))::float8 AS median,
           count(*)::int AS count
    FROM price_observations o
    JOIN districts d ON d.id = o.area_id
    WHERE ${where}
    GROUP BY o.area_id, d.name, o.period_month`;

  const byArea = new Map<string, { name: string; months: Map<string, { median: number; count: number }> }>();
  rows.forEach((row) => {
    const entry = byArea.get(row.id) ?? { name: row.name, months: new Map() };
    entry.months.set(row.month, { median: row.median, count: row.count });
    byArea.set(row.id, entry);
  });

  const medianAt = (months: Map<string, { median: number }>, month: string) => months.get(month)?.median ?? null;
  return [...byArea.entries()]
    .map(([id, { name, months }]) => {
      const current = months.get(referenceMonth);
      const median = current?.median ?? null;
      return {
        id,
        name,
        median,
        count: current?.count ?? 0,
        change3m: percentChange(median, medianAt(months, shiftMonth(referenceMonth, -3))),
        change12m: percentChange(median, medianAt(months, shiftMonth(referenceMonth, -12))),
      };
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));
}

export async function buildPriceReport(filters: PriceReportFilters) {
  const current = currentMonthKey();
  const windowMonths = Math.max(filters.months, MIN_WINDOW_MONTHS);
  const fromMonth = shiftMonth(current, -(windowMonths - 1));
  const series = await loadMonthlySeries(filters, fromMonth);

  // Tháng tham chiếu cho KPI: tháng hiện tại, hoặc tháng gần nhất có dữ liệu trong khoảng đã chọn.
  const visibleMonths = monthRange(current, filters.months);
  const referenceMonth = [...visibleMonths].reverse().find((m) => (series.get(m)?.count ?? 0) > 0) ?? null;
  const reference = referenceMonth ? series.get(referenceMonth)! : null;
  const medianAt = (month: string) => series.get(month)?.median ?? null;

  const [areas, firstMonthRow] = await Promise.all([
    referenceMonth ? loadAreaRows(filters, fromMonth, referenceMonth) : Promise.resolve([]),
    db.$queryRaw<{ month: string | null }[]>`
      SELECT to_char(min(period_month), 'YYYY-MM') AS month
      FROM price_observations WHERE data_source = ${filters.source}`,
  ]);

  return {
    current_month: current,
    first_month: firstMonthRow[0]?.month ?? null,
    months: visibleMonths.map((m) => series.get(m) ?? emptyPoint(m)),
    kpi: reference && referenceMonth
      ? {
          month: referenceMonth,
          median: reference.median,
          min: reference.min,
          max: reference.max,
          average: reference.average,
          count: reference.count,
          outliers: reference.outliers,
          change_1m: percentChange(reference.median, medianAt(shiftMonth(referenceMonth, -1))),
          change_12m: percentChange(reference.median, medianAt(shiftMonth(referenceMonth, -12))),
        }
      : null,
    areas,
  };
}

/** Ghi nhận lại số liệu tháng hiện tại (nút trong trang admin; cron chạy cùng hàm SQL này). */
export async function recordCurrentMonthSnapshot(): Promise<number> {
  const rows = await db.$queryRaw<{ count: number }[]>`
    SELECT record_price_snapshot(${`${currentMonthKey()}-01`}::date) AS count`;
  return Number(rows[0]?.count ?? 0);
}
