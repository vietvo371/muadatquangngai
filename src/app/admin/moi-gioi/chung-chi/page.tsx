import type { Metadata } from 'next';
import CertificationsClient from './certifications-client';

export const metadata: Metadata = {
  title: 'Xác Thực Chứng Chỉ Môi Giới',
  description: 'Duyệt hồ sơ chứng chỉ hành nghề môi giới bất động sản.',
};

export default function Page() {
  return <CertificationsClient />;
}
