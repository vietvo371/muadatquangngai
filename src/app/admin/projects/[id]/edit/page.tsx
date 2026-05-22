import EditProjectClient from './edit-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chỉnh Sửa Dự Án | Quản trị Bất Động Sản Quảng Ngãi',
  description: 'Chỉnh sửa dự án trong hệ thống quản lý.',
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <EditProjectClient params={params} />;
}
