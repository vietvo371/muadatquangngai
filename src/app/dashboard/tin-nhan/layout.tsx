import { redirect } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/features';

// Tính năng đang tạm ẩn (src/lib/features.ts) — vào thẳng đường dẫn cũng quay về Tổng quan.
export default function FeatureGateLayout({ children }: { children: React.ReactNode }) {
  if (!isFeatureEnabled('messaging')) redirect('/dashboard');
  return children;
}
