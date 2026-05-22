import CreateProjectClient from './create-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thêm Dự Án Mới | Quản trị Bất Động Sản Quảng Ngãi',
  description: 'Thêm dự án mới vào hệ thống quản lý.',
};

export default function Page() {
  return <CreateProjectClient />;
}
