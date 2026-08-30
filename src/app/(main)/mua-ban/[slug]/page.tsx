import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPropertySeo } from '@/lib/seo/property-metadata';
import { PropertyJsonLd, BreadcrumbJsonLd } from '@/components/seo';
import PropertyDetailClient from './property-detail-client';

/**
 * Vỏ SERVER cho trang chi tiết tin bán — chỉ để sinh metadata + JSON-LD riêng cho từng tin.
 * Toàn bộ giao diện vẫn nằm ở `property-detail-client.tsx` (client component) như cũ, không
 * viết lại; tách vỏ là cách duy nhất để có generateMetadata vì client component không hỗ trợ.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = await getPropertySeo(slug, 'sell');
  return meta;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { jsonLd, notFound: missing } = await getPropertySeo(slug, 'sell');

  // Slug không tồn tại/đã gỡ -> trả HTTP 404 thật + trang "Không tìm thấy".
  // Trước đây trang vẫn trả 200 rồi client dựng khung lỗi "Lỗi Kết Nối Hệ Thống" (sai thông điệp,
  // và Google giữ URL rác trong index vì thấy 200).
  if (missing) notFound();

  return (
    <>
      {jsonLd && (
        <>
          <PropertyJsonLd property={jsonLd} />
          <BreadcrumbJsonLd
            items={[
              { name: 'Trang chủ', url: '/' },
              { name: 'Mua bán nhà đất', url: '/mua-ban' },
              { name: jsonLd.title, url: `/mua-ban/${jsonLd.slug}` },
            ]}
          />
        </>
      )}
      <PropertyDetailClient params={params} />
    </>
  );
}
