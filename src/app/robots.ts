import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * robots.txt
 *
 * Sửa 2 lỗi của bản cũ:
 * 1. Sitemap khai ở `/api/sitemap` trong khi chính file này `Disallow: /api/` — Google bị chặn
 *    đọc sitemap của mình. Sitemap nay ở `/sitemap.xml` (file convention của Next).
 * 2. Mặc định site URL là `batdongsanquangngai.vn` — tên miền chết, không thuộc dự án.
 *
 * Lưu ý cố ý: KHÔNG chặn các tham số lọc (?category=, ?page=...) bằng Disallow. Chặn crawl thì
 * Google vẫn có thể index URL mà không đọc được nội dung, lại càng khó gỡ. Cách xử lý đúng là
 * canonical + noindex khai trong metadata của trang (xem generateMetadata ở /mua-ban, /cho-thue).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Khu vực cần đăng nhập + endpoint API: không có nội dung cho người tìm kiếm.
      // Kèm theo, `src/proxy.ts` đặt X-Robots-Tag: noindex cho đúng những đường dẫn này —
      // Disallow chỉ chặn crawl, còn noindex mới thực sự giữ URL ra khỏi kết quả tìm kiếm.
      disallow: [
        '/dashboard/', '/admin/', '/api/',
        '/login', '/login-phone', '/register',
        '/forgot-password', '/reset-password', '/verify-email', '/oauth-callback',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
