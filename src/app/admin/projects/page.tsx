import ProjectsClient from './projects-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản Lý Dự Án | Quản trị Bất Động Sản Quảng Ngãi',
  description: 'Quản lý các đại dự án, khu dân cư kiểu mẫu và dự án hạ tầng tại Quảng Ngãi.',
};

export default function Page() {
  return <ProjectsClient />;
}
