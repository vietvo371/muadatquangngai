import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAgencySeo } from '@/lib/seo/content-metadata';
import { BreadcrumbJsonLd } from '@/components/seo';
import AgencyDetailClient from './agency-detail-client';

/** Vỏ SERVER cho trang hồ sơ doanh nghiệp — metadata riêng cho từng doanh nghiệp. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = await getAgencySeo(slug);
  return meta;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data, notFound: missing } = await getAgencySeo(slug);

  if (missing) notFound();

  return (
    <>
      {data && (
        <BreadcrumbJsonLd
          items={[
            { name: 'Trang chủ', url: '/' },
            { name: 'Doanh nghiệp', url: '/doanh-nghiep' },
            { name: data.name, url: `/doanh-nghiep/${data.slug}` },
          ]}
        />
      )}
      <AgencyDetailClient params={params} />
    </>
  );
}
