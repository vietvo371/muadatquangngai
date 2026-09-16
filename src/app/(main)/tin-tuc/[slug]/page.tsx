import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostSeo } from '@/lib/seo/content-metadata';
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo';
import PostDetailClient from './post-detail-client';

/**
 * Vỏ SERVER cho trang chi tiết bài viết — metadata + JSON-LD Article riêng cho từng bài.
 * Trước đây mọi bài viết dùng chung một `<title>` mặc định của layout, trong khi sitemap lại
 * khai đủ slug cho Google. Giao diện giữ nguyên trong `post-detail-client.tsx`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = await getPostSeo(slug);
  return meta;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data, notFound: missing } = await getPostSeo(slug);

  if (missing) notFound();

  return (
    <>
      {data && (
        <>
          <ArticleJsonLd
            article={{
              title: data.title,
              description: data.excerpt,
              image: data.thumbnail,
              path: `/tin-tuc/${data.slug}`,
              publishedAt: data.published_at,
              updatedAt: data.updated_at,
            }}
          />
          <BreadcrumbJsonLd
            items={[
              { name: 'Trang chủ', url: '/' },
              { name: 'Tin tức', url: '/tin-tuc' },
              { name: data.title, url: `/tin-tuc/${data.slug}` },
            ]}
          />
        </>
      )}
      <PostDetailClient params={params} />
    </>
  );
}
