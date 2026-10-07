import type { MetadataRoute } from 'next';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';

/**
 * manifest.json — để khi người dùng "Thêm vào màn hình chính" trên điện thoại thì biểu tượng
 * và tên hiện đúng thương hiệu (Notion 06/10 "Favicon – Cập nhật Logo mới").
 *
 * Next tự sinh file tại /manifest.webmanifest và tự chèn thẻ <link rel="manifest">.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Mua Bán Nhà Đất Quảng Ngãi`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1075b1',
    lang: 'vi',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
