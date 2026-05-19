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
        <div className="relative rounded-2xl overflow-hidden shadow-sm mb-6 bg-gray-900 isolate">
          <div className="relative h-[300px] md:h-[400px] w-full">
            <Image
              src={post.thumbnail || '/images/image_data/banner_hero.jpg'}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8 z-10">
              <Badge className="mb-4 bg-primary hover:bg-primary-dark text-white border-0 font-bold uppercase tracking-wider text-[10px] px-2.5 py-1">
                {post.category?.name || 'Tiêu điểm'}
              </Badge>
              <h2 className="text-white font-bold text-2xl md:text-3xl leading-snug drop-shadow-md group-hover:text-primary-light transition-colors mb-3">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="text-gray-300 line-clamp-2 leading-relaxed max-w-3xl mb-4 text-[15px] font-medium hidden sm:block">
                  {post.excerpt}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{publishedDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  <span>{post.view_count?.toLocaleString() || 0} lượt xem</span>
                </div>
              </div>
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
