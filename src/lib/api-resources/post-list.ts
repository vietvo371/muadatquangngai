import { db } from '@/lib/db';
import { toVietnamIso8601 } from './carbon-format';

/**
 * Query + mapper dùng chung cho danh sách bài viết (tin tức) — được gọi từ cả
 * route GET /api/v2/posts và server data fetcher của trang chủ (src/app/(main)/home-data.ts).
 *
 * LƯU Ý: DB production hiện có 0 bài viết → các hàm này trả mảng rỗng (không lỗi).
 */

export const POST_TYPE_LABEL: Record<string, string> = {
  news: 'Tin tức',
  blog: 'Blog',
  guide: 'Hướng dẫn',
  legal: 'Pháp lý',
  market_update: 'Tin thị trường',
};

/** Bài đã publish, chưa xoá mềm, và (không hẹn giờ HOẶC đã tới giờ đăng). */
export async function fetchPublishedPosts(limit: number) {
  return db.posts.findMany({
    where: {
      status: 'published',
      deleted_at: null,
      OR: [{ published_at: null }, { published_at: { lte: new Date() } }],
    },
    include: {
      post_categories: { select: { id: true, name: true, slug: true } },
      users: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: [{ is_featured: 'desc' }, { published_at: 'desc' }],
    take: limit,
  });
}

type PostListRow = Awaited<ReturnType<typeof fetchPublishedPosts>>[number];

/** Resource shape gọn cho list — chỉ các field cần cho card/carousel. */
export function mapPostListResource(post: PostListRow) {
  return {
    id: post.id,
    uuid: post.uuid,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    thumbnail: post.thumbnail,
    type: post.type,
    type_label: POST_TYPE_LABEL[post.type] ?? post.type,
    category: post.post_categories
      ? { id: post.post_categories.id, name: post.post_categories.name, slug: post.post_categories.slug }
      : null,
    published_at: toVietnamIso8601(post.published_at),
    view_count: post.view_count,
    is_featured: post.is_featured,
  };
}
