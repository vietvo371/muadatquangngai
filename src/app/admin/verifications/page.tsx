import { redirect } from 'next/navigation';

/**
 * Luồng "Xác thực môi giới" cũ (bảng `verifications`) đã gộp vào Xác thực chứng chỉ hành nghề
 * (Notion 25/09 — chỉ một nguồn xác thực môi giới). Giữ route để link/bookmark cũ không bị 404.
 */
export default function LegacyVerificationsPage() {
  redirect('/admin/moi-gioi/chung-chi');
}
