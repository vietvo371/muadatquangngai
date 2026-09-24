import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';
import { buildPriceReport, parsePriceReportFilters } from '@/lib/price-report';

/**
 * GET /api/v2/admin/price-report — Báo cáo giá.
 *
 * Query (đều tùy chọn): months=3|6|12|24 (mặc định 12), source=listing|transaction
 * (mặc định listing = Giá rao bán), province, area, category, area_min, area_max,
 * price_min, price_max (giá tổng, VND).
 */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const filters = parsePriceReportFilters(new URL(request.url).searchParams);
  return apiSuccess(await buildPriceReport(filters));
}
