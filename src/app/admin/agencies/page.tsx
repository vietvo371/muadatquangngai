import AgenciesClient from './agencies-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản Lý Doanh Nghiệp | Quản trị Bất Động Sản Quảng Ngãi',
  description: 'Quản lý danh bạ doanh nghiệp / sàn giao dịch bất động sản hiển thị công khai tại /doanh-nghiep.',
};

export default function Page() {
  return <AgenciesClient />;
}
