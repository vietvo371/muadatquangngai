import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';
import { buildPriceMap, parsePriceReportFilters } from '@/lib/price-report';

/**
 * GET /api/v2/admin/price-report/map — dữ liệu cho Bản đồ giá (Notion 29/09 "Price Map – Phase 2").
 *
 * Nhận cùng bộ lọc với báo cáo giá. Trả về mỗi khu vực một điểm:
 *   { id, name, latitude, longitude, median, count, change3m, change6m, change12m }
 *
 * Giao diện bản đồ chưa làm ở giai đoạn này (khách ghi rõ "Chưa cần triển khai UI Map ở Phase 1").
 * Toạ độ là trung bình toạ độ các tin trong khu vực; khu vực chưa tin nào ghim bản đồ thì toạ độ
 * null — bản đồ sau này bỏ qua điểm đó, số liệu vẫn tra cứu được.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const filters = parsePriceReportFilters(new URL(request.url).searchParams);
  return apiSuccess(await buildPriceMap(filters));
}
