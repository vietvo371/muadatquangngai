'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Calendar,
  Eye,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { SectionHeading } from '@/components/home/SectionHeading';

const blogPosts = [
  {
    id: 1,
    title: 'Thị trường bất động sản Quảng Ngãi 2026: Xu hướng nào đáng đầu tư?',
    slug: 'thi-truong-bds-quang-ngai-2026',
    excerpt: 'Năm 2026, thị trường bất động sản Quảng Ngãi được dự báo sẽ có nhiều biến động. Cùng phân tích các xu hướng đáng chú ý.',
    thumbnail: '/images/image_data/Haus-Coastal.jpg',
    category: 'Thị trường',
    author: { name: 'Ban biên tập', avatar: null },
    created_at: '2026-04-15',
    views: 4521,
  },
  {
    id: 2,
    title: 'Hướng dẫn mua nhà lần đầu: Những điều cần biết',
    slug: 'huong-dan-mua-nha-lan-dau',
    excerpt: 'Mua nhà lần đầu có thể gặp nhiều bỡ ngỡ. Bài viết này sẽ giúp bạn nắm rõ các bước và lưu ý quan trọng.',
    thumbnail: '/images/image_data/nha-pho-de-palace-river.jpg',
    category: 'Hướng dẫn',
    author: { name: 'Tư vấn BDS', avatar: null },
    created_at: '2026-04-12',
    views: 6231,
  },
  {
    id: 3,
    title: 'Top 5 khu vực có tiềm năng sinh lời cao tại Quảng Ngãi',
    slug: 'top-5-khu-vuc-dau-tu-quang-ngai',
    excerpt: 'Khám phá những khu vực đang thu hút nhà đầu tư với tiềm năng sinh lời hấp dẫn.',
    thumbnail: '/images/image_data/Starlight---suc-hut-den-tu-vi-tri-dac-dia-nhat-trung-tam-Quang-Ngai-suc-hut-3-1733900371-424-width1000height563.jpg',
    category: 'Đầu tư',
    author: { name: 'Chuyên gia', avatar: null },
    created_at: '2026-04-10',
    views: 3987,
  },
  {
    id: 4,
    title: 'Những lỗi thường gặp khi làm sổ đỏ lần đầu',
    slug: 'loi-thuong-gap-lam-so-do',
    excerpt: 'Làm sổ đỏ là thủ tục pháp lý quan trọng. Tránh những sai lầm phổ biến để quá trình diễn ra suôn sẻ.',
    thumbnail: '/images/image_data/du-lich-binh-son-quang-ngai-phan-van-travel-1.webp',
    category: 'Pháp lý',
    author: { name: 'Luật sư', avatar: null },
    created_at: '2026-04-08',
    views: 2109,
  },
  {
    id: 5,
    title: 'De Palace River Nam Sông Trà – Sản phẩm không dành cho số đông',
    slug: 'de-palace-river-phan-tich',
    excerpt: 'Phân tích chi tiết về tiềm năng tăng giá và lợi thế vị trí của dự án ven sông Trà Khúc.',
    thumbnail: '/images/image_data/nha-pho-de-palace-river.jpg',
    category: 'Dự án',
    author: { name: 'Research Team', avatar: null },
    created_at: '2026-04-05',
    views: 3541,
  },
  {
    id: 6,
    title: 'Lý Sơn – Hòn đảo bất động sản tiếp theo cần theo dõi năm 2026',
    slug: 'ly-son-bat-dong-san-2026',
    excerpt: 'Phân tích chi tiết về tiềm năng tăng giá và lợi thế vị trí của dự án trên đảo Lý Sơn.',
    thumbnail: '/images/image_data/shutterstock2065827521lyson-1701400873758.jpg',
    category: 'Phân tích',
    author: { name: 'Chuyên gia', avatar: null },
    created_at: '2026-04-03',
    views: 2876,
  },
];

const categories = ['Tất cả', 'Thị trường', 'Đầu tư', 'Hướng dẫn', 'Pháp lý', 'Dự án', 'Phân tích'];

export default function BlogListPage() {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = blogPosts.filter((post) => {
    if (selectedCategory !== 'Tất cả' && post.category !== selectedCategory) return false;
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const featuredPost = filteredPosts[0];

  return (
    <div className="flex flex-col bg-white">

      {/* ══════════════════════════════════
          HERO
      ══════════════════════════════════ */}
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl h-11"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FEATURED POST
      ══════════════════════════════════ */}
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
                  src={featuredPost.thumbnail}
                  alt={featuredPost.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <Badge className="mb-3 bg-cta text-white">{featuredPost.category}</Badge>
                  <h2 className="text-white font-bold text-xl md:text-2xl leading-snug drop-shadow-sm group-hover:text-white/80 transition-colors">
                    {featuredPost.title}
                  </h2>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-2">{featuredPost.created_at}</p>
            {featuredPost.excerpt && (
              <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed max-w-3xl">
                {featuredPost.excerpt}
              </p>
            )}
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════
          CATEGORIES + POSTS
      ══════════════════════════════════ */}
      <section className="py-6 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          {/* Category pills */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-primary-light hover:text-primary border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Posts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.slice(1).map((post) => (
              <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group">
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                  <div className="relative h-44">
                    <Image
                      src={post.thumbnail}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-primary text-white">{post.category}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-bold text-gray-900 line-clamp-2 mb-3 group-hover:text-primary transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{post.created_at}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{post.views.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Empty State */}
          {filteredPosts.length <= 1 && (
            <div className="text-center py-20 bg-white rounded-2xl">
              <p className="text-gray-500">Không có bài viết nào trong danh mục này</p>
            </div>
          )}

          {/* Pagination */}
          {filteredPosts.length > 1 && (
            <div className="flex justify-center mt-10">
              <div className="flex gap-1.5">
                <Button variant="outline" size="icon" className="w-9 h-9" disabled>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button className="w-9 h-9 bg-primary hover:bg-primary/90 text-white">1</Button>
                <Button variant="outline" className="w-9 h-9">2</Button>
                <Button variant="outline" className="w-9 h-9">3</Button>
                <Button variant="outline" className="w-9 h-9">...</Button>
                <Button variant="outline" className="w-9 h-9">10</Button>
                <Button variant="outline" size="icon" className="w-9 h-9">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════
          NEWSLETTER CTA
      ══════════════════════════════════ */}
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
            {/* Decorative */}
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
