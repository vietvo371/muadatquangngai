import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/seo';
import ListingClient from './listing-client';

/**
 * Vỏ SERVER cho trang danh sách — chỉ để có metadata tĩnh + JSON-LD. Trước đây trang này là
 * client component không có metadata nên dùng chung title mặc định của layout.
 *
 * Metadata KHÔNG đọc `searchParams`: làm vậy biến route thành dynamic và Suspense boundary của
 * `useSearchParams` trong client component không bao giờ resolve (trang kẹt ở khung xương).
 */
export const metadata: Metadata = {
  title: 'Môi Giới Bất Động Sản Quảng Ngãi',
  description:
    'Danh bạ môi giới bất động sản tại Quảng Ngãi. Xem hồ sơ, đánh giá và tin đăng của từng môi giới trước khi liên hệ.',
  alternates: { canonical: '/moi-gioi' },
  openGraph: {
    title: 'Môi Giới Bất Động Sản Quảng Ngãi',
    description: 'Danh bạ môi giới bất động sản uy tín tại Quảng Ngãi.',
    url: '/moi-gioi',
    type: 'website',
  },
};

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Trang chủ', url: '/' },
          { name: 'Môi giới', url: '/moi-gioi' },
        ]}
      />
      <ListingClient />
    </>
  );
}
