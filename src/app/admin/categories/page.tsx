import CategoriesClient from './categories-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản Lý Danh Mục | Quản trị Bất Động Sản Quảng Ngãi',
  description: 'Quản lý phân loại bất động sản bán, cho thuê, sơ đồ cấu trúc icon và thứ tự hiển thị hệ thống.',
};

export default function Page() {
  return <CategoriesClient />;
}
