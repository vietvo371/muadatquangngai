import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Điều khiển việc lập chỉ mục bằng header `X-Robots-Tag`. Hai nhóm:
 *
 * 1. KHU VỰC RIÊNG TƯ (/dashboard, /admin, trang đăng nhập/đăng ký): `noindex, nofollow`.
 *    robots.txt đã Disallow những đường dẫn này, nhưng Disallow chỉ chặn CRAWL — nếu có link
 *    trỏ tới từ nơi khác, Google vẫn có thể đưa URL vào kết quả tìm kiếm (không kèm nội dung).
 *    Chỉ `noindex` mới thực sự giữ chúng ra ngoài. Hai layout này là client component nên không
 *    export được `metadata`, dùng header là cách duy nhất gọn gàng.
 *
 * 2. TRANG DANH SÁCH ĐÃ LỌC: `noindex, follow`. Bộ lọc đẩy tới 13 tham số lên URL (category,
 *    khu_vuc, price_min/max, area_min/max, bedrooms, bathrooms, direction, legal, q, sort) cộng
 *    page và tpl=map; tổ hợp sinh ra vô số URL gần trùng nhau, để index hết thì ngân sách thu
 *    thập bị đốt vào trang rác và thứ hạng trang gốc bị pha loãng. `follow` để bot vẫn đi tiếp
 *    vào từng tin đăng.
 *
 * VÌ SAO DÙNG HEADER CHỨ KHÔNG PHẢI generateMetadata: đọc `searchParams` trong generateMetadata
 * khiến route thành dynamic và Suspense boundary của `useSearchParams` trong client component
 * KHÔNG BAO GIỜ resolve — trang danh sách kẹt ở khung xương vĩnh viễn (đã dựng lại và xác nhận
 * bằng production build: bỏ generateMetadata thì 6 thẻ hiện bình thường, thêm vào là kẹt).
 * `X-Robots-Tag` cho kết quả tương đương với Google mà không đụng tới cơ chế render.
 *
 * Canonical vẫn khai trong metadata tĩnh của từng trang (luôn trỏ URL sạch) — xem page.tsx.
 */

/** Tham số biến URL thành "bản sao đã lọc" của trang danh sách gốc. */
const VARIANT_PARAMS = [
  'category', 'khu_vuc', 'price_min', 'price_max', 'area_min', 'area_max',
  'bedrooms', 'bathrooms', 'direction', 'legal', 'q', 'sort', 'tpl',
];

/** Đường dẫn không bao giờ nên xuất hiện trong kết quả tìm kiếm. */
const PRIVATE_PREFIXES = [
  '/dashboard', '/admin',
  '/login', '/login-phone', '/register',
  '/forgot-password', '/reset-password', '/verify-email', '/oauth-callback',
];

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname, searchParams } = request.nextUrl;

  if (PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  const hasVariant = VARIANT_PARAMS.some((key) => {
    const value = searchParams.get(key);
    return value !== null && value !== '';
  });
  const page = Number(searchParams.get('page') || '1');
  const isPaginated = Number.isFinite(page) && page > 1;

  if (hasVariant || isPaginated) {
    response.headers.set('X-Robots-Tag', 'noindex, follow');
  }

  return response;
}

export const config = {
  matcher: [
    '/mua-ban',
    '/cho-thue',
    '/du-an',
    '/moi-gioi',
    '/doanh-nghiep',
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/login-phone',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/oauth-callback',
  ],
};
