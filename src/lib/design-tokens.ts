/**
 * Design token phía JavaScript (Notion 07/10 "Design Token").
 *
 * Màu, bo góc, đổ bóng, chiều cao header nằm ở `:root` trong src/app/globals.css — đó là
 * nguồn duy nhất. File này chỉ giữ những giá trị mà CODE (không phải CSS) cần đọc, và trỏ
 * thẳng tới biến CSS thay vì chép lại mã màu, để không bao giờ có hai nơi lệch nhau.
 */

/**
 * Breakpoint trùng khớp `md` / `lg` / `xl` mặc định của Tailwind. Dùng khi code cần biết khổ
 * màn hình (vd. nút bản đồ nổi: máy tính cuộn về bản đồ, điện thoại mở toàn màn hình) —
 * dùng chung con số với CSS để giao diện và hành vi không đổi ở hai mốc khác nhau.
 */
export const BREAKPOINTS = {
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type UnitStatus = 'available' | 'reserved' | 'sold' | 'unknown';

/** Nhãn + màu của từng trạng thái căn/lô. Màu là biến CSS, sửa ở globals.css. */
export const UNIT_STATUS_STYLES: Record<UnitStatus, { label: string; color: string; background: string }> = {
  available: { label: 'Còn hàng', color: 'var(--unit-available)', background: 'var(--unit-available-bg)' },
  reserved: { label: 'Giữ chỗ', color: 'var(--unit-reserved)', background: 'var(--unit-reserved-bg)' },
  sold: { label: 'Đã bán', color: 'var(--unit-sold)', background: 'var(--unit-sold-bg)' },
  unknown: { label: 'Chưa rõ', color: 'var(--unit-unknown)', background: 'var(--unit-unknown-bg)' },
};
