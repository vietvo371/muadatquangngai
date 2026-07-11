import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/api-response';
import { toVietnamIso8601 } from '@/lib/api-resources/carbon-format';

const POST_TYPE_LABEL: Record<string, string> = {
  news: 'Tin tức',
  blog: 'Blog',
  guide: 'Hướng dẫn',
  legal: 'Pháp lý',
  market_update: 'Tin thị trường',
};

/**
 * GET /api/v2/posts/[slug] — port của PostController@show.
 *
 * LƯU Ý: DB hiện có 0 bài viết (tính năng tin tức chưa có nội dung) → thực tế route này
 * luôn đi nhánh 404 "Không tìm thấy bài viết.". Mapper đầy đủ đã viết sẵn theo PostResource
 * nhưng CHƯA verify byte-for-byte (không có post thật để so). Bỏ qua incrementView +
 * PostView tracking (side-effect chỉ chạy khi tìm thấy post, không tái hiện được khi rỗng;
 * post_views là bảng analytics, để Phase sau). content luôn có mặt vì đây là route slug.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = await db.posts.findFirst({
    where: { slug, status: 'published', deleted_at: null, OR: [{ published_at: null }, { published_at: { lte: new Date() } }] },
    include: {
      users: { select: { id: true, name: true, avatar: true, bio: true } },
      post_categories: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!post) return apiError('Không tìm thấy bài viết.', 404);

  const data: Record<string, unknown> = {
    id: post.id,
    uuid: post.uuid,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content, // route slug -> luôn trả content
    thumbnail: post.thumbnail,
    type: post.type,
    type_label: POST_TYPE_LABEL[post.type] ?? post.type,
    status: post.status,
    view_count: post.view_count,
    is_featured: post.is_featured,
    tags: post.tags ?? [],
    reading_time: null, // không phải cột thật -> Eloquent trả null
    published_at: toVietnamIso8601(post.published_at),
    created_at: toVietnamIso8601(post.created_at),
    author: post.users
      ? { id: post.users.id, name: post.users.name, avatar: post.users.avatar, ...(post.users.bio ? { bio: post.users.bio } : {}) }
      : undefined,
    category: post.post_categories
      ? { id: post.post_categories.id, name: post.post_categories.name, slug: post.post_categories.slug }
      : null,
  };

  if (post.meta_title || post.meta_description) {
    data.meta = { title: post.meta_title, description: post.meta_description, keywords: post.seo_keywords };
  }

  return apiSuccess(data);
}
