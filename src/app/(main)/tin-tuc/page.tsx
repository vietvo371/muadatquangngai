'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared';
import { postApi, type Post, type PostCategory } from '@/lib/post-api';
import { SectionHeading } from '@/components/home/SectionHeading';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

import { NewsHero } from '@/components/news/NewsHero';
import { NewsCard } from '@/components/news/NewsCard';
import { NewsCardSkeleton, NewsListSkeleton } from '@/components/news/NewsCardSkeleton';

export default function BlogListPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['post-categories'],
    queryFn: () => postApi.categories(),
  });

  const { data: postsData, isLoading } = useQuery({
    queryKey: ['posts', selectedCategory, searchQuery, page],
    queryFn: () => postApi.list({
      category: selectedCategory || undefined,
      search: searchQuery || undefined,
      page,
      per_page: 12,
    }),
  });

  const categories: PostCategory[] = categoriesData?.data || [];
  const posts: Post[] = postsData?.data || [];
  const meta = postsData?.meta;
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setPage(1);
  };

  return (
    <div className="flex flex-col bg-white">
      {/* HERO */}
      <NewsHero
        searchQuery={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setPage(1); }}
      />

      {/* FEATURED POST — chỉ render khi đang load hoặc có data */}
      {(isLoading || featuredPost) && (
        <section className="py-14 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <SectionHeading
              title="Bài viết nổi bật"
              subtitle="Tiêu điểm thị trường bất động sản tuần này"
            />
            {isLoading ? (
              <NewsCardSkeleton featured />
            ) : (
              <NewsCard post={featuredPost!} featured />
            )}
          </div>
        </section>
      )}

      {/* CATEGORIES + POSTS GRID */}
      <section className="py-10 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">

          {/* Category pills — chỉ hiện khi đang load hoặc có categories */}
          {(categoriesLoading || categories.length > 0) && (
          <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
            {categoriesLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-28 rounded-full shrink-0" />
              ))
            ) : (
              <>
                <Button
                  variant={selectedCategory === '' ? 'default' : 'outline'}
                  onClick={() => handleCategoryChange('')}
                  className={`shrink-0 rounded-full font-bold h-10 px-6 transition-all ${
                    selectedCategory === ''
                      ? 'bg-primary shadow-md hover:bg-primary/90 text-white border-primary'
                      : 'bg-white text-gray-600 hover:text-gray-900 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Tất cả tin tức
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={`shrink-0 rounded-full font-bold h-10 px-6 transition-all ${
                      selectedCategory === cat.slug
                        ? 'bg-primary shadow-md hover:bg-primary/90 text-white border-primary'
                        : 'bg-white text-gray-600 hover:text-gray-900 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {cat.name}
                  </Button>
                ))}
              </>
            )}
          </div>
          )}

          {/* Posts grid / loading / empty */}
          {isLoading ? (
            <NewsListSkeleton count={6} />
          ) : remainingPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {remainingPosts.map((post) => (
                  <NewsCard key={post.id} post={post} />
                ))}
              </div>

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex justify-center mt-12">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-10 h-10 rounded-xl bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <Button
                          key={p}
                          variant={p === page ? 'default' : 'outline'}
                          className={`w-10 h-10 rounded-xl font-bold ${
                            p === page
                              ? 'bg-primary text-white shadow-sm border-primary hover:bg-primary/90'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      );
                    })}
                    {meta.last_page > 5 && (
                      <span className="px-2 self-center text-gray-400 font-bold">...</span>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-10 h-10 rounded-xl bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                      disabled={page === meta.last_page}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : !isLoading && !featuredPost ? (
            /* Không có bài viết nào — chỉ show 1 empty state duy nhất ở đây */
            <div className="py-16">
              <EmptyState
                title="Chưa có bài viết nào"
                description="Hệ thống đang cập nhật các tin tức mới nhất. Vui lòng quay lại sau."
                action={{ label: 'Tải lại trang', onClick: () => window.location.reload() }}
              />
            </div>
          ) : searchQuery || selectedCategory ? (
            /* Có filter nhưng không tìm thấy */
            <div className="py-12">
              <EmptyState
                title="Không tìm thấy bài viết"
                description="Không có bài viết nào phù hợp. Hãy thử từ khóa hoặc danh mục khác."
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* Khối "Nhận bản tin thị trường" đã gỡ: ô email + nút "Đăng Ký Ngay" không nối gì,
          không có API và không có bảng lưu người đăng ký — khách nhập email rồi bấm là mất
          luôn, nhưng lại tưởng đã đăng ký. Khi nào làm thật (bảng subscribers + endpoint)
          thì dựng lại. */}
    </div>
  );
}
