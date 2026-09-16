import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProjectSeo } from '@/lib/seo/content-metadata';
import { BreadcrumbJsonLd } from '@/components/seo';
import ProjectDetailClient from './project-detail-client';

/**
 * Vỏ SERVER cho trang chi tiết dự án — chỉ để sinh metadata + JSON-LD riêng cho từng dự án.
 * Giao diện giữ nguyên trong `project-detail-client.tsx`; tách vỏ là cách duy nhất có
 * generateMetadata vì client component không hỗ trợ. Cùng khuôn với trang chi tiết tin đăng.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = await getProjectSeo(slug);
  return meta;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data, notFound: missing } = await getProjectSeo(slug);

  // Slug không tồn tại -> 404 THẬT. Trả 200 rồi để client dựng khung lỗi sẽ khiến Google
  // giữ URL rác trong index.
  if (missing) notFound();

  return (
    <>
      {data && (
        <BreadcrumbJsonLd
          items={[
            { name: 'Trang chủ', url: '/' },
            { name: 'Dự án', url: '/du-an' },
            { name: data.name, url: `/du-an/${data.slug}` },
          ]}
        />
      )}
      <ProjectDetailClient params={params} />
    </>
  );
}
