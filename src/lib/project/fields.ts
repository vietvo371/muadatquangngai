/**
 * Các dòng thông tin dự án dùng chung cho khối Tổng quan và thẻ thông tin ở cột phải.
 *
 * Dòng nào không có dữ liệu thì BỊ BỎ, không hiện "Đang cập nhật" hay "0 block". Trước đây
 * dự án thiếu số tầng vẫn hiện "0 tầng", thiếu ngày bàn giao thì hiện "2026" lấy từ đâu không rõ.
 */

import {
  formatArea,
  formatCount,
  formatPriceRange,
  formatQuarter,
} from '@/lib/display-format';
import type { Project } from './types';

export interface InfoRow {
  label: string;
  value: string;
}

function rows(entries: Array<[string, string | null]>): InfoRow[] {
  return entries.filter((e): e is [string, string] => e[1] !== null).map(([label, value]) => ({ label, value }));
}

export function projectOverviewRows(p: Project): InfoRow[] {
  return rows([
    ['Chủ đầu tư', p.developer],
    ['Loại hình', p.typeLabel || null],
    ['Tổng diện tích', formatArea(p.totalAreaHa, 'ha')],
    ['Số block', formatCount(p.totalBlocks, 'block')],
    ['Số tầng', formatCount(p.totalFloors, 'tầng')],
    [p.unitWord === 'lô' ? 'Số lô đất' : 'Số căn', formatCount(p.totalUnits, p.unitWord)],
    ['Pháp lý', p.legal],
    ['Bàn giao', formatQuarter(p.handoverDate)],
  ]);
}

export function projectSidebarRows(p: Project): InfoRow[] {
  return rows([
    ['Chủ đầu tư', p.developer],
    ['Loại hình', p.typeLabel || null],
    ['Tỉnh / TP', p.location.province],
    // Sau sáp nhập 2025 tỉnh chỉ còn cấp Xã/Phường/Đặc khu.
    ['Xã / Phường', p.location.district],
    ['Tổng diện tích', formatArea(p.totalAreaHa, 'ha')],
    [p.unitWord === 'lô' ? 'Số lô đất' : 'Số căn', formatCount(p.totalUnits, p.unitWord)],
    ['Pháp lý', p.legal],
  ]);
}

export function projectPriceLabel(p: Project): string | null {
  return formatPriceRange(p.priceFrom, p.priceTo);
}

/** Địa chỉ hiển thị: ghép các phần có thật, bỏ phần trùng (address thường đã chứa xã/tỉnh). */
export function projectAddress(p: Project): string | null {
  const { address, district, province } = p.location;
  if (address) return address;
  const parts = [district, province].filter((x): x is string => Boolean(x));
  return parts.length ? parts.join(', ') : null;
}
