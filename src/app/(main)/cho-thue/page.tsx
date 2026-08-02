import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/seo';
import ListingClient from './listing-client';

/** Vỏ SERVER cho trang danh sách cho thuê — xem ghi chú ở /mua-ban/page.tsx về lý do metadata
 *  tĩnh (không đọc searchParams) và noindex xử lý bằng X-Robots-Tag trong src/proxy.ts. */
export const metadata: Metadata = {
  title: 'Cho Thuê Nhà Đất Quảng Ngãi — Tin Mới Nhất',
  description:
    'Tin cho thuê nhà trọ, căn hộ, mặt bằng, nhà nguyên căn tại Quảng Ngãi. Lọc theo khu vực, giá thuê, diện tích và xem vị trí trên bản đồ.',
  alternates: { canonical: '/cho-thue' },
  openGraph: {
    title: 'Cho Thuê Nhà Đất Quảng Ngãi — Tin Mới Nhất',
    description: 'Tin cho thuê nhà trọ, căn hộ, mặt bằng tại Quảng Ngãi.',
    url: '/cho-thue',
    type: 'website',
  },
};

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Trang chủ', url: '/' },
          { name: 'Nhà đất cho thuê', url: '/cho-thue' },
        ]}
      />
      <ListingClient />
    </>
  );
}
