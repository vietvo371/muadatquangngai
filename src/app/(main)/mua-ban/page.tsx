import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/seo';
import ListingClient from './listing-client';

/**
 * Vỏ SERVER cho trang danh sách mua bán — chỉ để có metadata tĩnh + JSON-LD.
 *
 * Metadata KHÔNG đọc `searchParams`: làm vậy khiến route thành dynamic và Suspense boundary của
 * `useSearchParams` bên trong client component không bao giờ resolve (trang kẹt ở khung xương —
 * đã dựng lại và xác nhận bằng production build). Phần `noindex` cho URL đã lọc/phân trang xử lý
 * bằng header `X-Robots-Tag` trong `src/proxy.ts`.
 */
export const metadata: Metadata = {
  title: 'Mua Bán Nhà Đất Quảng Ngãi — Giá Mới Nhất',
  description:
    'Tin mua bán nhà đất, đất nền, căn hộ, nhà mặt tiền tại Quảng Ngãi. Lọc theo khu vực, mức giá, diện tích và xem vị trí trên bản đồ.',
  // Canonical luôn trỏ URL sạch — mọi biến thể ?category=&price_min=&tpl=map gom về một trang.
  alternates: { canonical: '/mua-ban' },
  openGraph: {
    title: 'Mua Bán Nhà Đất Quảng Ngãi — Giá Mới Nhất',
    description: 'Tin mua bán nhà đất, đất nền, căn hộ tại Quảng Ngãi.',
    url: '/mua-ban',
    type: 'website',
  },
};

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Trang chủ', url: '/' },
          { name: 'Mua bán nhà đất', url: '/mua-ban' },
        ]}
      />
      <ListingClient />
    </>
  );
}
