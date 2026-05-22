import EditProjectClient from './edit-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chỉnh Sửa Dự Án | Quản trị Bất Động Sản Quảng Ngãi',
  description: 'Chỉnh sửa dự án trong hệ thống quản lý.',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <EditProjectClient id={resolvedParams.id} />;
}
