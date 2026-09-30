import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { buildPriceReport, currentMonthKey, parsePriceReportFilters } from '@/lib/price-report';
import { buildXlsx, type Sheet } from '@/lib/xlsx-writer';
import { db } from '@/lib/db';

/**
 * GET /api/v2/admin/price-report/export — tải báo cáo giá dạng Excel (.xlsx).
 *
 * Notion 29/09 "Export Report – Phase 2". Dùng đúng bộ lọc của trang báo cáo (khu vực, loại BĐS,
 * khoảng thời gian...) nên số trong file khớp với số đang xem trên màn hình.
 *
 * Bản PDF không làm ở server: trang có nút In / Lưu PDF dùng chức năng in của trình duyệt, vừa
 * giữ đúng dấu tiếng Việt vừa không phải nhúng font vào thư viện PDF.
 *
 * File gồm 3 sheet: Tổng quan (bộ lọc + chỉ số chính), Theo tháng, So sánh khu vực.
 */

const MONEY_NOTE = 'Đơn vị giá: đồng/m². Ô trống = tháng không có tin ghi nhận.';

async function filterLabels(filters: ReturnType<typeof parsePriceReportFilters>) {
  const [province, area, category] = await Promise.all([
    filters.provinceId ? db.provinces.findUnique({ where: { id: filters.provinceId }, select: { name: true } }) : null,
    filters.areaId ? db.districts.findUnique({ where: { id: filters.areaId }, select: { name: true } }) : null,
    filters.categoryId ? db.categories.findUnique({ where: { id: filters.categoryId }, select: { name: true } }) : null,
  ]);
  return {
    province: province?.name ?? 'Tất cả',
    area: area?.name ?? 'Tất cả',
    category: category?.name ?? 'Tất cả',
  };
}

/** Giá đồng/m²: làm tròn về đồng. Phần trăm: 1 chữ số thập phân. Excel không cần số lẻ dài. */
const money = (value: number | null) => (value === null ? null : Math.round(value));

const range = (min: number | null, max: number | null, unit: string) =>
  min === null && max === null ? 'Không giới hạn' : `${min ?? 0} – ${max ?? '∞'} ${unit}`;

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const filters = parsePriceReportFilters(new URL(request.url).searchParams);
  const [report, labels] = await Promise.all([buildPriceReport(filters), filterLabels(filters)]);

  const overview: Sheet = {
    name: 'Tổng quan',
    rows: [
      ['Báo cáo giá bất động sản Quảng Ngãi'],
      [],
      ['Bộ lọc đang áp dụng'],
      ['Nguồn dữ liệu', filters.source === 'transaction' ? 'Giá giao dịch (đã xác nhận)' : 'Giá rao bán'],
      ['Khoảng thời gian', `${filters.months} tháng gần nhất`],
      ['Tỉnh / Thành phố', labels.province],
      ['Khu vực', labels.area],
      ['Loại bất động sản', labels.category],
      ['Diện tích', range(filters.areaMin, filters.areaMax, 'm²')],
      ['Mức giá', range(filters.priceMin, filters.priceMax, 'đồng')],
      [],
      ['Chỉ số tháng gần nhất có dữ liệu'],
      ...(report.kpi
        ? [
            ['Tháng', report.kpi.month],
            ['Giá trung vị (đồng/m²)', money(report.kpi.median)],
            ['Thấp nhất (đồng/m²)', money(report.kpi.min)],
            ['Cao nhất (đồng/m²)', money(report.kpi.max)],
            ['Trung bình (đồng/m²)', money(report.kpi.average)],
            ['Số tin ghi nhận', report.kpi.count],
            ['Số tin bất thường đã loại', report.kpi.outliers],
            ['Biến động so với tháng trước (%)', report.kpi.change_1m],
            ['Biến động so với 12 tháng trước (%)', report.kpi.change_12m],
          ]
        : [['Chưa có dữ liệu trong khoảng thời gian này']]),
      [],
      ['Ghi chú'],
      [MONEY_NOTE],
      ['Trung vị là chỉ số đại diện. Thấp nhất / cao nhất / trung bình đã loại các tin có giá bất thường.'],
      ['Báo cáo chỉ trình bày số liệu lịch sử, không đưa ra khuyến nghị mua bán hay đầu tư.'],
      [`Xuất lúc ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`],
    ],
  };

  const monthly: Sheet = {
    name: 'Theo tháng',
    rows: [
      ['Tháng', 'Giá trung vị', 'Thấp nhất', 'Cao nhất', 'Trung bình', 'Số tin', 'Tin bất thường đã loại'],
      ...report.months.map((point) => [
        point.month, money(point.median), money(point.min), money(point.max), money(point.average),
        point.count, point.outliers,
      ]),
    ],
  };

  const areas: Sheet = {
    name: 'So sánh khu vực',
    rows: [
      ['Khu vực', 'Giá trung vị', 'Số tin', 'Biến động 3 tháng (%)', 'Biến động 6 tháng (%)', 'Biến động 12 tháng (%)'],
      ...report.areas.map((area) => [
        area.name, money(area.median), area.count, area.change3m, area.change6m, area.change12m,
      ]),
    ],
  };

  const file = buildXlsx([overview, monthly, areas]);
  const fileName = `bao-cao-gia-${currentMonthKey()}.xlsx`;

  return new NextResponse(new Uint8Array(file), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
