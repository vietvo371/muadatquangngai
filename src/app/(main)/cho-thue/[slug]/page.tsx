import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPropertySeo } from '@/lib/seo/property-metadata';
import { PropertyJsonLd, BreadcrumbJsonLd } from '@/components/seo';
import PropertyDetailClient from './property-detail-client';

/** Vỏ SERVER cho trang chi tiết tin cho thuê — sinh metadata + JSON-LD riêng từng tin. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = await getPropertySeo(slug, 'rent');
  return meta;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { jsonLd, notFound: missing } = await getPropertySeo(slug, 'rent');

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
              { name: 'Nhà đất cho thuê', url: '/cho-thue' },
              { name: jsonLd.title, url: `/cho-thue/${jsonLd.slug}` },
            ]}
          />
        </>
      )}
      <PropertyDetailClient params={params} />
    </>
  );
}
