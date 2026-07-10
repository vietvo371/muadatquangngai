/**
 * Laravel format timestamp qua Carbon::toIso8601String() với APP_TIMEZONE =
 * Asia/Ho_Chi_Minh (+07:00, không DST) — ví dụ "2026-05-25T10:57:02+07:00".
 *
 * Cột Postgres là `timestamp` KHÔNG có timezone. Prisma đọc digit thô và gắn nhãn UTC
 * ("Z"), Carbon đọc CÙNG digit thô đó và gắn nhãn +07:00 — không bên nào convert timezone
 * thật, chỉ khác nhãn suffix. Vì vậy chỉ cần đổi suffix, KHÔNG được cộng/trừ giờ.
 *
 * Xác nhận qua so sánh trực tiếp response Laravel thật (curl) với cùng project.
 */
export function toVietnamIso8601(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString().replace(/\.\d{3}Z$/, '+07:00');
}

/**
 * Format Carbon MẶC ĐỊNH khi model KHÔNG qua accessor/Resource riêng cho field đó
 * (vd `created_at` trong TransactionResource dùng `$this->created_at` thô, không gọi
 * `?->toIso8601String()`) — Carbon::serializeDate() convert sang UTC (trừ 7 giờ so với
 * digit thô +07:00 trong DB) và in 6 chữ số micro giây, khác hẳn format `toVietnamIso8601`
 * ở trên. Xác nhận qua curl thật: "2026-05-25T03:57:02.000000Z" (giờ thô là 10:57:02+07).
 */
export function toCarbonDefaultUtc(date: Date | null | undefined): string | null {
  if (!date) return null;
  const withVnOffset = new Date(date.getTime() - 7 * 60 * 60 * 1000);
  return withVnOffset.toISOString().replace(/\.\d{3}Z$/, '.000000Z');
}
