import type { Metadata } from 'next';
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
  const { jsonLd } = await getPropertySeo(slug, 'rent');

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
