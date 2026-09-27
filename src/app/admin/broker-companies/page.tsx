import { redirect } from 'next/navigation';

/**
 * Đường dẫn /admin/broker-companies (Notion "Route cũ") đã gộp vào Admin → Doanh nghiệp / Sàn giao dịch (bảng businesses, Notion 25/09).
 * Giữ route để link/bookmark cũ không bị 404.
 */
export default function LegacyPage() {
  redirect('/admin/businesses');
}
