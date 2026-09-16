import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAgentSeo } from '@/lib/seo/content-metadata';
import { BreadcrumbJsonLd } from '@/components/seo';
import AgentDetailClient from './agent-detail-client';

/** Vỏ SERVER cho trang hồ sơ môi giới — metadata riêng cho từng người. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { meta } = await getAgentSeo(id);
  return meta;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, notFound: missing } = await getAgentSeo(id);

  // Môi giới bị khoá/đóng tài khoản cũng rơi vào đây — trang công khai phải biến mất thật,
  // không để Google giữ hồ sơ kèm số điện thoại của người đã rời sàn.
  if (missing) notFound();

  return (
    <>
      {data && (
        <BreadcrumbJsonLd
          items={[
            { name: 'Trang chủ', url: '/' },
            { name: 'Môi giới', url: '/moi-gioi' },
            { name: data.name, url: `/moi-gioi/${data.id}` },
          ]}
        />
      )}
      <AgentDetailClient params={params} />
    </>
  );
}
