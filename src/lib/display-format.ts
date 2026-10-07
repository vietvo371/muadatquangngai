/**
 * Hàm định dạng dữ liệu hiển thị, an toàn với dữ liệu thiếu (Notion 07/10 "Shared UI / Format"
 * và "Quy tắc dữ liệu").
 *
 * Quy ước chung: dữ liệu thiếu hoặc vô nghĩa (null, undefined, NaN, số âm, chuỗi rỗng, ngày
 * không hợp lệ) thì trả về `null` — KHÔNG trả "Đang cập nhật", "0", "NaN" hay "01/01/1970".
 * Nơi gọi thấy `null` thì ẩn hẳn ô đó. Lý do: "Đang cập nhật" lặp lại ở chục ô trông như trang
 * bỏ dở, còn "0 m²" hay "01/01/1970" thì là thông tin SAI mà người mua có thể tin.
 *
 * Các hàm cũ trong src/lib/formatters.ts giữ nguyên vì đang có nhiều nơi gọi; trang mới nên
 * dùng file này.
 */

import { formatDirection } from '@/lib/formatters';

/** Ép về số hữu hạn; chuỗi số từ Decimal của Prisma cũng nhận. Còn lại → null. */
export function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toPositive(value: unknown): number | null {
  const n = toFiniteNumber(value);
  return n !== null && n > 0 ? n : null;
}

const BILLION = 1_000_000_000;
const MILLION = 1_000_000;

/** Bỏ ".0" thừa: 2.0 tỷ → 2 tỷ, 2.5 tỷ giữ nguyên. */
function trimDecimal(n: number, digits = 1): string {
  return Number(n.toFixed(digits)).toLocaleString('vi-VN');
}

/** 2500000000 → "2,5 tỷ"; 850000000 → "850 triệu". */
export function formatMoney(value: unknown): string | null {
  const n = toPositive(value);
  if (n === null) return null;
  if (n >= BILLION) return `${trimDecimal(n / BILLION, 2)} tỷ`;
  if (n >= MILLION) return `${trimDecimal(n / MILLION, 0)} triệu`;
  return `${Math.round(n).toLocaleString('vi-VN')} đ`;
}

/**
 * Khoảng giá dự án: "Từ 1,2 tỷ", "Đến 3 tỷ", "1,2 – 3 tỷ". Có cả hai đầu mà cùng đơn vị thì
 * gộp đơn vị một lần cho gọn. Không có đầu nào → null (ẩn, KHÔNG ghi "Liên hệ" thay người bán).
 */
export function formatPriceRange(from: unknown, to: unknown): string | null {
  const low = toPositive(from);
  const high = toPositive(to);
  if (low === null && high === null) return null;
  if (low !== null && high === null) return `Từ ${formatMoney(low)}`;
  if (low === null && high !== null) return `Đến ${formatMoney(high)}`;
  if (low === high) return formatMoney(low);

  const bothBillion = (low as number) >= BILLION && (high as number) >= BILLION;
  if (bothBillion) return `${trimDecimal((low as number) / BILLION, 2)} – ${formatMoney(high)}`;
  return `${formatMoney(low)} – ${formatMoney(high)}`;
}

/**
 * Diện tích. `unit: 'ha'` cho tổng diện tích dự án — cột projects.total_area lưu theo HA chứ
 * không phải m² (đã từng hiện "12 m²" cho một khu đô thị 12 ha).
 */
export function formatArea(value: unknown, unit: 'm2' | 'ha' = 'm2'): string | null {
  const n = toPositive(value);
  if (n === null) return null;
  return unit === 'ha' ? `${trimDecimal(n, 2)} ha` : `${trimDecimal(n, 1)} m²`;
}

/** Hướng nhà: slug "dong_nam" → "Đông Nam". Slug lạ thì ẩn thay vì in nguyên slug ra. */
export function formatDirectionLabel(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const label = formatDirection(value.trim());
  return label === value.trim() && /_/.test(label) ? null : label;
}

function toValidDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value as string);
  // Năm < 2000 gần như chắc chắn là ngày mặc định/rác (vd. epoch 1970), không phải dữ liệu thật.
  return Number.isNaN(d.getTime()) || d.getFullYear() < 2000 ? null : d;
}

/** "07/10/2026". */
export function formatDateVi(value: unknown): string | null {
  const d = toValidDate(value);
  return d ? d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null;
}

/** "Quý 4/2026" — dùng cho ngày bàn giao, nơi ngày cụ thể thường chỉ là ước lượng. */
export function formatQuarter(value: unknown): string | null {
  const d = toValidDate(value);
  return d ? `Quý ${Math.floor(d.getMonth() / 3) + 1}/${d.getFullYear()}` : null;
}

/** Tiến độ xây dựng 0–100 → "65%". Ngoài khoảng đó là dữ liệu sai, ẩn đi. */
export function formatProgress(value: unknown): string | null {
  const n = toFiniteNumber(value);
  if (n === null || n < 0 || n > 100) return null;
  return `${Math.round(n)}%`;
}

/** Dung lượng tệp: 1536000 → "1,5 MB". */
export function formatFileSize(bytes: unknown): string | null {
  const n = toPositive(bytes);
  if (n === null) return null;
  if (n >= 1024 * 1024) return `${trimDecimal(n / (1024 * 1024), 1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${Math.round(n)} B`;
}

/** Khoảng cách theo km: 0.35 → "350 m", 2.4 → "2,4 km". */
export function formatDistanceKm(km: unknown): string | null {
  const n = toFiniteNumber(km);
  if (n === null || n < 0) return null;
  return n < 1 ? `${Math.round(n * 1000)} m` : `${trimDecimal(n, 1)} km`;
}

/** Thời lượng theo phút: 8 → "8 phút", 75 → "1 giờ 15 phút". */
export function formatDurationMinutes(minutes: unknown): string | null {
  const n = toFiniteNumber(minutes);
  if (n === null || n < 0) return null;
  const total = Math.max(1, Math.round(n));
  if (total < 60) return `${total} phút`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
}

/** Số lượng có đơn vị: (1200, 'căn') → "1.200 căn". 0 hoặc thiếu → null. */
export function formatCount(value: unknown, unit: string): string | null {
  const n = toPositive(value);
  return n === null ? null : `${Math.round(n).toLocaleString('vi-VN')} ${unit}`;
}

/** Chuỗi văn bản: bỏ khoảng trắng; rỗng, "null", "undefined" → null. */
export function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t && t !== 'null' && t !== 'undefined' ? t : null;
}
