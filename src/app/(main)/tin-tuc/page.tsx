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
  title: 'Tin Tức Bất Động Sản Quảng Ngãi',
  description:
    'Tin tức thị trường bất động sản Quảng Ngãi: biến động giá, quy hoạch, hạ tầng và kinh nghiệm mua bán nhà đất.',
  alternates: { canonical: '/tin-tuc' },
  openGraph: {
    title: 'Tin Tức Bất Động Sản Quảng Ngãi',
    description: 'Tin tức và phân tích thị trường bất động sản Quảng Ngãi.',
    url: '/tin-tuc',
    type: 'website',
  },
};

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Trang chủ', url: '/' },
          { name: 'Tin tức', url: '/tin-tuc' },
        ]}
      />
      <ListingClient />
    </>
  );
}
