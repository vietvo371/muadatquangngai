import SettingsClient from './settings-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cấu Hình Hệ Thống | Quản trị Bất Động Sản Quảng Ngãi',
  description: 'Thiết lập các thông số cấu hình vận hành website BatDongSan Quảng Ngãi như logo, liên hệ, mạng xã hội, SEO, nghiệp vụ...',
};

export default function Page() {
  return <SettingsClient />;
}
