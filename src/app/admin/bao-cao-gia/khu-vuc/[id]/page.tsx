import { Suspense } from 'react';
import type { Metadata } from 'next';
import AreaReportClient from './area-report-client';

export const metadata: Metadata = {
  title: 'Báo Cáo Giá Khu Vực',
  description: 'Lịch sử giá rao bán bất động sản của một phường/xã.',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="py-10 text-center text-sm text-gray-500">Đang tải...</p>}>
      <AreaReportClient areaId={id} />
    </Suspense>
  );
}
