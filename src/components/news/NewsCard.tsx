import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye } from 'lucide-react';
import type { Post } from '@/lib/post-api';

interface NewsCardProps {
  post: Post;
  featured?: boolean;
}

export function NewsCard({ post, featured = false }: NewsCardProps) {
  const publishedDate = new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  if (featured) {
    return (
      <Link href={`/tin-tuc/${post.slug}`} className="group block">
        <div className="grid md:grid-cols-10 gap-6 lg:gap-8 rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300">
          <div className="relative h-[240px] sm:h-[320px] md:h-[400px] md:col-span-6 w-full overflow-hidden">
            <Image
              src={post.thumbnail || '/images/image_data/banner_hero.jpg'}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              sizes="(max-width: 768px) 100vw, 60vw"
              priority
            />
            <div className="absolute top-4 left-4 z-10">
              <Badge className="bg-primary hover:bg-primary-dark text-white border-0 font-bold uppercase tracking-wider text-[10px] px-2.5 py-1">
                {post.category?.name || 'Tiêu điểm'}
              </Badge>
            </div>
          </div>
          <div className="p-6 md:p-8 flex flex-col justify-center md:col-span-4">
            <span className="text-[12px] font-bold text-primary uppercase tracking-wider mb-2 block">
              {post.category?.name || 'Tin nổi bật'}
            </span>
            <h2 className="text-gray-900 font-extrabold text-[22px] md:text-[28px] leading-snug group-hover:text-primary transition-colors mb-3">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-gray-500 line-clamp-3 leading-relaxed mb-6 text-[14px]">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mt-auto pt-4 border-t border-gray-100 w-full">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{publishedDate}</span>
              </div>
              <span className="text-primary group-hover:underline font-bold flex items-center gap-1">
                Đọc ngay &rarr;
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/tin-tuc/${post.slug}`} className="group h-full block">
      <Card className="overflow-hidden hover:shadow-md transition-all duration-300 h-full rounded-2xl border-gray-100 bg-white flex flex-col">
        <div className="relative h-48 sm:h-52 w-full overflow-hidden shrink-0">
          <Image
            src={post.thumbnail || '/images/image_data/banner_hero.jpg'}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-white/90 backdrop-blur-sm text-gray-900 border-0 font-bold shadow-sm px-2.5 py-0.5">
              {post.category?.name || 'Tin tức'}
            </Badge>
          </div>
        </div>
        <CardContent className="p-5 flex flex-col flex-1">
          <h3 className="font-bold text-gray-900 text-base md:text-[17px] line-clamp-2 group-hover:text-primary transition-colors leading-snug mb-2">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-[14px] text-gray-500 line-clamp-2 leading-relaxed mb-4 flex-1">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center justify-between text-xs font-medium text-gray-400 mt-auto pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{publishedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span>{post.view_count?.toLocaleString() || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
