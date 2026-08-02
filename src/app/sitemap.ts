import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { SITE_URL } from '@/lib/site';

/**
 * Sitemap (/sitemap.xml) — dùng file convention của Next thay cho route `/api/sitemap` cũ.
 *
 * Hai lỗi của bản cũ đã sửa ở đây:
 * 1. Bản cũ gọi API qua axios với baseURL rỗng (same-origin). Chạy trong trình duyệt thì được,
 *    nhưng sitemap render phía SERVER — Node không resolve nổi URL tương đối nên fetch luôn
 *    thất bại, `catch` nuốt lỗi và trả về sitemap chỉ còn trang tĩnh (production thực tế chỉ
 *    có 6 URL, không tin đăng nào). Nay truy vấn Prisma thẳng, không đi vòng qua HTTP.
 * 2. Bản cũ khai tin đăng ở `/tin-dang/{slug}` — route KHÔNG tồn tại (404). URL thật phụ thuộc
 *    `type`: bán → /mua-ban/{slug}, thuê → /cho-thue/{slug}.
 *
 * Đặt ở `/sitemap.xml` cũng gỡ xung đột với `Disallow: /api/` trong robots.txt (bản cũ khai
 * sitemap nằm trong chính thư mục bị chặn).
 */

// Sitemap phải phản ánh tin mới đăng — cache 1 giờ thay vì build-time tĩnh.
export const revalidate = 3600;

type Row = { slug: string; updated_at: Date | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/mua-ban`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/cho-thue`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/du-an`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/moi-gioi`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/doanh-nghiep`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/tin-tuc`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/dieu-khoan`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/chinh-sach`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Chỉ đưa tin ĐANG hiển thị công khai vào sitemap — khai tin nháp/hết hạn là đẩy Google vào
  // trang 404/không có nội dung.
  const visible = {
    status: 'active',
    published_at: { not: null },
    OR: [{ expired_at: null }, { expired_at: { gt: now } }],
  };

  let sell: Row[] = [];
  let rent: Row[] = [];
  let projects: Row[] = [];
  let posts: Row[] = [];

  try {
    [sell, rent, projects, posts] = await Promise.all([
      db.properties.findMany({
        where: { ...visible, type: 'sell' },
        select: { slug: true, updated_at: true },
        orderBy: { published_at: 'desc' },
        take: 5000,
      }),
      db.properties.findMany({
        where: { ...visible, type: 'rent' },
        select: { slug: true, updated_at: true },
        orderBy: { published_at: 'desc' },
        take: 5000,
      }),
      db.projects.findMany({
        select: { slug: true, updated_at: true },
        orderBy: { id: 'desc' },
        take: 1000,
      }),
      db.posts.findMany({
        where: { status: 'published' },
        select: { slug: true, updated_at: true },
        orderBy: { id: 'desc' },
        take: 1000,
      }),
    ]);
  } catch (error) {
    // Không nuốt im lặng như bản cũ — log để còn phát hiện khi sitemap co lại chỉ còn trang tĩnh.
    console.error('[sitemap] Không truy vấn được dữ liệu:', error);
  }

  const detail = (prefix: string, rows: Row[], priority: number): MetadataRoute.Sitemap =>
    rows
      .filter((r) => !!r.slug)
      .map((r) => ({
        url: `${SITE_URL}${prefix}/${r.slug}`,
        lastModified: r.updated_at ?? now,
        changeFrequency: 'weekly' as const,
        priority,
      }));

  return [
    ...staticPages,
    ...detail('/mua-ban', sell, 0.8),
    ...detail('/cho-thue', rent, 0.8),
    ...detail('/du-an', projects, 0.7),
    ...detail('/tin-tuc', posts, 0.6),
  ];
}
