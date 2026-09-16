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
  title: 'Dự Án Bất Động Sản Quảng Ngãi',
  description:
    'Danh sách dự án bất động sản tại Quảng Ngãi: khu đô thị, đất nền, chung cư. Xem vị trí, quy mô, tiện ích và sản phẩm đang mở bán.',
  alternates: { canonical: '/du-an' },
  openGraph: {
    title: 'Dự Án Bất Động Sản Quảng Ngãi',
    description: 'Danh sách dự án bất động sản đang mở bán tại Quảng Ngãi.',
    url: '/du-an',
    type: 'website',
  },
};

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Trang chủ', url: '/' },
          { name: 'Dự án', url: '/du-an' },
        ]}
      />
      <ListingClient />
    </>
  );
}
