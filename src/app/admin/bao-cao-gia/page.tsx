import { Suspense } from 'react';
import type { Metadata } from 'next';
import PriceReportClient from './price-report-client';

export const metadata: Metadata = {
  title: 'Báo Cáo Giá',
  description: 'Diễn biến giá rao bán bất động sản theo khu vực và loại BĐS.',
};

export default function Page() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sm text-gray-500">Đang tải...</p>}>
      <PriceReportClient />
    </Suspense>
  );
}
