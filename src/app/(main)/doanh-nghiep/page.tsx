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
  title: 'Doanh Nghiệp Bất Động Sản Quảng Ngãi',
  description:
    'Danh bạ doanh nghiệp, sàn giao dịch bất động sản tại Quảng Ngãi. Xem thông tin liên hệ và tin đăng của từng đơn vị.',
  alternates: { canonical: '/doanh-nghiep' },
  openGraph: {
    title: 'Doanh Nghiệp Bất Động Sản Quảng Ngãi',
    description: 'Danh bạ doanh nghiệp bất động sản tại Quảng Ngãi.',
    url: '/doanh-nghiep',
    type: 'website',
  },
};

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Trang chủ', url: '/' },
          { name: 'Doanh nghiệp', url: '/doanh-nghiep' },
        ]}
      />
      <ListingClient />
    </>
  );
}
