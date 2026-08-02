import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Chống "thừa index" cho trang danh sách bằng header `X-Robots-Tag`.
 *
 * Bối cảnh: bộ lọc đẩy tới 13 tham số lên URL (category, khu_vuc, price_min/max, area_min/max,
 * bedrooms, bathrooms, direction, legal, q, sort) cộng page và tpl=map. Tổ hợp của chúng sinh ra
 * vô số URL nội dung gần trùng nhau — để Google index hết thì ngân sách thu thập bị đốt vào
 * trang rác và thứ hạng trang gốc bị pha loãng.
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

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const { searchParams } = request.nextUrl;

  const hasVariant = VARIANT_PARAMS.some((key) => {
    const value = searchParams.get(key);
    return value !== null && value !== '';
  });
  const page = Number(searchParams.get('page') || '1');
  const isPaginated = Number.isFinite(page) && page > 1;

  if (hasVariant || isPaginated) {
    // follow: vẫn cho bot đi tiếp vào từng tin đăng, chỉ không index trang danh sách đã lọc.
    response.headers.set('X-Robots-Tag', 'noindex, follow');
  }

  return response;
}

export const config = {
  matcher: ['/mua-ban', '/cho-thue', '/du-an', '/moi-gioi', '/doanh-nghiep'],
};
