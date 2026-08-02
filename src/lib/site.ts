/**
 * Thông tin site dùng chung cho SEO (metadata, canonical, sitemap, JSON-LD).
 *
 * Mặc định cũ rải rác trong code là `https://batdongsanquangngai.vn` — tên miền CHẾT, không
 * thuộc dự án (xem robots.ts/sitemap cũ). Nếu thiếu NEXT_PUBLIC_SITE_URL thì rơi về tên miền
 * thật đang chạy, để lỡ quên set env cũng không khai báo sai cho Google.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://muadatquangngai.com').replace(/\/$/, '');

export const SITE_NAME = 'Bất Động Sản Quảng Ngãi';

export const SITE_DESCRIPTION =
  'Nền tảng mua bán, cho thuê bất động sản tại Quảng Ngãi: nhà đất, đất nền, căn hộ, nhà xưởng. Tin đăng có xác thực, thông tin pháp lý rõ ràng.';

/** Ảnh chia sẻ mặc định (Zalo/Facebook). Ảnh riêng của tin đăng sẽ ghi đè khi có. */
export const SITE_OG_IMAGE = `${SITE_URL}/images/og-default.jpg`;

/** Ghép URL tuyệt đối từ path nội bộ — dùng cho canonical/OG để không phụ thuộc metadataBase. */
export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Đường dẫn chi tiết tin đăng theo loại — bán và thuê nằm ở 2 route khác nhau. */
export function propertyPath(type: string | null | undefined, slug: string): string {
  return `/${type === 'rent' ? 'cho-thue' : 'mua-ban'}/${slug}`;
}
