'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared';
import { PageLoader } from '@/components/shared';
import { postApi, type Post, type PostCategory } from '@/lib/post-api';
import {
  Search,
  Calendar,
  Eye,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { SectionHeading } from '@/components/home/SectionHeading';

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

  return (
    <div className="flex flex-col bg-white">

      {/* HERO */}
      <section className="relative h-[320px] md:h-[380px] z-10">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/images/image_data/banner_hero.jpg"
            alt="Tin tức bất động sản Quảng Ngãi"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/5" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 gap-5">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white drop-shadow-xl leading-tight mb-3 tracking-tight">
              Tin tức bất động sản
              <br />
              <span className="text-red-400">Quảng Ngãi</span>
            </h1>
            <p className="text-white/75 text-sm sm:text-base font-medium tracking-widest uppercase">
              Cập nhật thông tin mới nhất về thị trường
            </p>
          </div>

          {/* Search */}
          <div className="w-full max-w-xl bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-2xl relative z-50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
              <Input
                placeholder="Tìm kiếm tin tức..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl h-11"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED POST */}
      {isLoading ? (
        <section className="py-14 px-4 bg-white">
          <div className="max-w-6xl mx-auto"><PageLoader /></div>
        </section>
      ) : featuredPost ? (
        <section className="py-14 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <SectionHeading
              title="Bài viết nổi bật"
              subtitle="Những tin tức được quan tâm nhất"
            />

            <Link href={`/tin-tuc/${featuredPost.slug}`} className="group block">
              <div className="relative rounded-2xl overflow-hidden shadow-md mb-8">
                <div className="relative h-64 md:h-80">
                  <Image
                    src={featuredPost.thumbnail || '/images/image_data/banner_hero.jpg'}
                    alt={featuredPost.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1200px) 100vw, 1200px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <Badge className="mb-3 bg-cta text-white">
                      {featuredPost.category?.name || 'Tin tức'}
                    </Badge>
                    <h2 className="text-white font-bold text-xl md:text-2xl leading-snug drop-shadow-sm group-hover:text-white/80 transition-colors">
                      {featuredPost.title}
                    </h2>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-2">
                {new Date(featuredPost.published_at || featuredPost.created_at).toLocaleDateString('vi-VN')}
              </p>
              {featuredPost.excerpt && (
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed max-w-3xl">
                  {featuredPost.excerpt}
                </p>
              )}
            </Link>
          </div>
        </section>
      ) : (
        <section className="py-14 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <EmptyState
              title="Chưa có bài viết nào"
              description="Hãy là người đầu tiên đăng tin tức bất động sản."
              action={{ label: 'Quay lại', onClick: () => {} }}
            />
          </div>
        </section>
      )}

      {/* CATEGORIES + POSTS */}
      <section className="py-6 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          {/* Category pills */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              onClick={() => { setSelectedCategory(''); setPage(1); }}
              className={`shrink-0 rounded-full ${selectedCategory === '' ? 'bg-primary' : ''}`}
            >
              Tất cả
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                className={`shrink-0 rounded-full ${selectedCategory === cat.slug ? 'bg-primary' : ''}`}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {/* Posts grid */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : remainingPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {remainingPosts.map((post) => (
                  <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group">
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                      <div className="relative h-44">
                        <Image
                          src={post.thumbnail || '/images/image_data/banner_hero.jpg'}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-primary text-white">
                            {post.category?.name || 'Tin tức'}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            <span>{post.view_count.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex justify-center mt-10">
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-9 h-9"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <Button
                          key={p}
                          variant={p === page ? 'default' : 'outline'}
                          className={`w-9 h-9 ${p === page ? 'bg-primary hover:bg-primary/90' : ''}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      );
                    })}
                    {meta.last_page > 5 && <span className="px-2 self-center text-gray-400">...</span>}
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-9 h-9"
                      onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                      disabled={page === meta.last_page}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="Không có bài viết nào"
              description="Hãy thử tìm kiếm với từ khóa khác."
            />
          )}
        </div>
      </section>

      {/* NEWSLETTER CTA */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-8 md:p-12">
            <div className="relative z-10 max-w-lg">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Đăng ký nhận tin mới
              </h2>
              <p className="text-white/80 text-sm mb-6">
                Nhận thông tin mới nhất về thị trường bất động sản Quảng Ngãi qua email
              </p>
              <div className="flex gap-3">
                <Input
                  placeholder="Email của bạn"
                  className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/60 rounded-xl h-11"
                />
                <Button className="bg-white text-primary hover:bg-white/90 h-11 px-6 font-semibold shrink-0">
                  Đăng ký
                </Button>
              </div>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10">
              <Image
                src="/images/image_data/banner_hero.jpg"
                alt=""
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
