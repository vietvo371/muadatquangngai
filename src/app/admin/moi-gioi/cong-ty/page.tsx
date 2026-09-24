import type { Metadata } from 'next';
import CompaniesClient from './companies-client';

export const metadata: Metadata = {
  title: 'Công Ty/Sàn Giao Dịch',
  description: 'Duyệt Công ty/Sàn giao dịch mà môi giới trực thuộc.',
};

export default function Page() {
  return <CompaniesClient />;
}
