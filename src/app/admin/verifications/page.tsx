import VerificationsClient from './verifications-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Xác Thực Môi Giới | Quản trị Bất Động Sản Quảng Ngãi',
  description: 'Duyệt hồ sơ đăng ký môi giới cá nhân và công ty đại lý bất động sản Quảng Ngãi.',
};

export default function Page() {
  return <VerificationsClient />;
}
