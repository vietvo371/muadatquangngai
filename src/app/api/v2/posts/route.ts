import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api-response';
import { fetchPublishedPosts, mapPostListResource } from '@/lib/api-resources/post-list';

/**
 * GET /api/v2/posts — danh sách bài viết đã publish (tin tức), sắp theo nổi bật rồi mới nhất.
 * Query: ?limit= (mặc định 12, tối đa 50).
 *
 * DB production hiện 0 bài → trả `data: []` (không lỗi).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = parseInt(searchParams.get('limit') ?? '12', 10);
  const limit = Math.min(Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 12, 50);

  const posts = await fetchPublishedPosts(limit);

  return apiSuccess(posts.map(mapPostListResource));
}
