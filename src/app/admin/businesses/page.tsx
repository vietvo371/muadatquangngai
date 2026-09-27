import type { Metadata } from 'next';
import BusinessesClient from './businesses-client';

export const metadata: Metadata = {
  title: 'Doanh Nghiệp / Sàn Giao Dịch',
  description: 'Quản lý Doanh nghiệp / Sàn giao dịch: duyệt, từ chối, chỉnh sửa.',
};

export default function Page() {
  return <BusinessesClient />;
}
