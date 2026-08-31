/**
 * Hạng hiển thị của tin đăng (gói dịch vụ).
 *
 * Bảng giá mới theo yêu cầu chủ dự án:
 *   - Tin thường  : miễn phí, 30 ngày
 *   - Tin Nổi bật : 40.000đ, 30 ngày  (`featured`)
 *   - Tin VIP     : 99.000đ, 30 ngày  (`vip`)
 *
 * `vip_plus` và `diamond` là hạng CŨ, không bán nữa nhưng vẫn còn tin đang chạy nên phải giữ
 * để hiển thị/xếp hạng đúng cho tới khi hết hạn.
 *
 * Cột `properties.is_vip` là VarChar nên thêm hạng mới không cần đổi kiểu dữ liệu.
 */

export type VipTier = 'normal' | 'featured' | 'vip' | 'vip_plus' | 'diamond';

interface TierConfig {
  label: string;
  /** Số nhỏ = ưu tiên hiển thị cao hơn. */
  rank: number;
  /** Chỉ dùng 2 màu brand: badge VIP dùng CTA (#e03131) theo quy ước trong CLAUDE.md. */
  badgeClass: string;
  /** Còn bán hay không (hạng cũ chỉ để hiển thị tin cũ). */
  sellable: boolean;
}

export const VIP_TIERS: Record<VipTier, TierConfig> = {
  diamond:  { label: 'Kim Cương', rank: 1, badgeClass: 'bg-cta text-white',            sellable: false },
  vip_plus: { label: 'VIP+',      rank: 2, badgeClass: 'bg-cta/85 text-white',         sellable: false },
  vip:      { label: 'VIP',       rank: 3, badgeClass: 'bg-cta text-white',            sellable: true },
  featured: { label: 'Nổi bật',   rank: 4, badgeClass: 'bg-primary-light text-primary', sellable: true },
  normal:   { label: 'Thường',    rank: 5, badgeClass: 'bg-gray-100 text-gray-600',    sellable: false },
};

/** Các hạng đang bán, xếp từ thấp đến cao — dùng cho màn chọn gói. */
export const SELLABLE_TIERS: VipTier[] = ['featured', 'vip'];

function isTier(value: string): value is VipTier {
  return value in VIP_TIERS;
}

/**
 * Hạng THỰC TẾ tại thời điểm hiện tại.
 *
 * Trước đây hệ thống chỉ đọc `is_vip` nên tin đã HẾT HẠN VIP vẫn được xếp trên cùng vĩnh viễn
 * và vẫn đeo nhãn VIP. Theo yêu cầu: hết hạn gói thì tin quay về Tin thường (bản thân tin vẫn
 * còn hiệu lực đăng).
 */
export function effectiveVipTier(
  isVip: string | null | undefined,
  vipExpiredAt: string | Date | null | undefined
): VipTier {
  const raw = isVip && isTier(isVip) ? isVip : 'normal';
  if (raw === 'normal') return 'normal';

  if (!vipExpiredAt) return 'normal';
  const expiry = vipExpiredAt instanceof Date ? vipExpiredAt : new Date(vipExpiredAt);
  if (Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) return 'normal';

  return raw;
}

/** Thứ tự sắp xếp: số nhỏ lên trước. */
export function vipRank(
  isVip: string | null | undefined,
  vipExpiredAt: string | Date | null | undefined
): number {
  return VIP_TIERS[effectiveVipTier(isVip, vipExpiredAt)].rank;
}

export function vipLabel(tier: string): string {
  return isTier(tier) ? VIP_TIERS[tier].label : tier;
}

export function vipBadgeClass(tier: string): string {
  return isTier(tier) ? VIP_TIERS[tier].badgeClass : VIP_TIERS.normal.badgeClass;
}
