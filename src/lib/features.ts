/**
 * Công tắc bật/tắt tính năng toàn site.
 *
 * Tạm ẩn theo yêu cầu khách (08/10/2026) — mở lại thì đổi giá trị thành `true` rồi deploy:
 * - `messaging`: Tin nhắn (menu, trang /dashboard/tin-nhan, các tuỳ chọn thông báo tin nhắn).
 * - `deposit`: Nạp tiền (menu, trang /dashboard/nap-tien, nút nạp tiền, API tạo lệnh nạp).
 */
export const FEATURES = {
  messaging: false,
  deposit: false,
} as const;

export type FeatureName = keyof typeof FEATURES;

export const isFeatureEnabled = (feature: FeatureName): boolean => FEATURES[feature];
