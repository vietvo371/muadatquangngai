import PackagesClient from './packages-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản Lý Gói Dịch Vụ | Quản trị Bất Động Sản Quảng Ngãi',
  description: 'Cấu hình các loại gói tin đăng VIP, VIP+, Diamond hỗ trợ kích hoạt và thúc đẩy giao dịch Quảng Ngãi.',
};

export default function Page() {
  return <PackagesClient />;
}
