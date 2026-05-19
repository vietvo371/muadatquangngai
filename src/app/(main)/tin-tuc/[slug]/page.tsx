'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageLoader } from '@/components/shared';
import { postApi, type Post } from '@/lib/post-api';
import {
  ChevronLeft,
  Eye,
  Printer,
  Calendar,
  Share2,
  Link2
} from 'lucide-react';
import { toast } from 'sonner';

// Components
import { TableOfContents } from '@/components/news/TableOfContents';
import { NewsCard } from '@/components/news/NewsCard';

export default function BlogDetailPage({ params }: { params: { slug: string } }) {
  const contentRef = useRef<HTMLDivElement>(null!);

  const { data, isLoading, error } = useQuery({
    queryKey: ['post', params.slug],
    queryFn: () => postApi.get(params.slug),
    enabled: !!params.slug,
  });

  const post: Post | null = data?.data || null;

  const { data: relatedData } = useQuery({
    queryKey: ['post-related', post?.id],
    queryFn: () => postApi.related(post!.id, { limit: 3 }),
    enabled: !!post?.id,
  });

  const relatedPosts: Post[] = relatedData?.data || [];

  const handleShare = (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = post?.title || '';
    
    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      toast.success('Đã sao chép đường dẫn bài viết!');
      return;
    }

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`,
    };
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  if (isLoading) return <PageLoader />;

  if (error || !post) {
    return (
      <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center flex-col">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Share2 className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy bài viết</h2>
        <p className="text-gray-500 mb-6">Bài viết có thể đã bị xóa hoặc không tồn tại.</p>
        <Link href="/tin-tuc">
          <Button className="font-bold px-8">Quay lại Tin tức</Button>
        </Link>
      </div>
    );
  }

  const publishedDate = new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="bg-white min-h-screen">
      {/* Header Banner */}
      <div className="relative pt-10 pb-20 md:pt-16 md:pb-28 overflow-hidden z-10 bg-gray-900">
        {post.thumbnail && (
          <>
            <Image
              src={post.thumbnail}
              alt={post.title}
              fill
              className="object-cover opacity-40 scale-105 blur-sm"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
          </>
        )}
        
        <div className="max-w-5xl mx-auto px-4 relative z-20">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300 mb-6 md:mb-8 font-medium">
            <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
            <ChevronLeft className="h-4 w-4 rotate-180 text-gray-500" />
            <Link href="/tin-tuc" className="hover:text-white transition-colors">Tin tức</Link>
            {post.category && (
              <>
                <ChevronLeft className="h-4 w-4 rotate-180 text-gray-500" />
                <span className="text-white bg-white/10 px-2 py-0.5 rounded-md">{post.category.name}</span>
              </>
            )}
          </div>

          {/* Title */}
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight drop-shadow-md">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 text-sm text-gray-300">
              {post.author && (
                <div className="flex items-center gap-3 bg-white/10 pr-4 rounded-full backdrop-blur-sm border border-white/10">
                  <Avatar className="h-10 w-10 border-2 border-white/20">
                    <AvatarImage src={post.author.avatar || undefined} className="object-cover" />
                    <AvatarFallback className="bg-primary text-white font-bold">{post.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-bold text-white">{post.author.name}</span>
                </div>
              )}
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="h-4 w-4 text-primary-light" />
                  {publishedDate}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Eye className="h-4 w-4 text-primary-light" />
                  {post.view_count.toLocaleString()} lượt xem
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative -mt-10 md:-mt-16 z-30">
          
          {/* Main Content */}
          <div className="flex-1 bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-10">
            
            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-lg md:text-xl text-gray-700 font-medium leading-relaxed mb-10 pb-10 border-b border-gray-100 italic">
                {post.excerpt}
              </p>
            )}

            {/* Mobile TOC (shows only on small screens) */}
            <div className="lg:hidden mb-10">
              <TableOfContents contentRef={contentRef} />
            </div>

            {/* Article Content */}
            <div 
              ref={contentRef}
              className="prose prose-lg md:prose-xl max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-h2:text-2xl md:prose-h2:text-3xl prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-primary hover:prose-a:text-primary-dark prose-img:rounded-2xl prose-img:shadow-md"
            >
              {post.content ? (
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              ) : (
                <div className="text-center py-20 text-gray-500">Nội dung đang cập nhật...</div>
              )}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-gray-100">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="bg-gray-50 text-gray-600 hover:bg-gray-100 font-medium px-3 py-1 text-sm border-gray-200">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Share Bottom */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8 pt-8 border-t border-gray-100">
              <span className="font-bold text-gray-900 text-lg">Chia sẻ bài viết</span>
              <div className="flex flex-wrap items-center gap-3">
                 <Button variant="outline" size="icon" className="rounded-full w-10 h-10 bg-[#e8f4fb] text-[#1075b1] border-0 hover:bg-[#d0e9f5] hover:text-[#0c5d8f]" onClick={() => handleShare('facebook')}>
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                  </svg>
                </Button>
                 <Button variant="outline" size="icon" className="rounded-full w-10 h-10 bg-sky-50 text-sky-500 border-0 hover:bg-sky-100 hover:text-sky-600" onClick={() => handleShare('twitter')}>
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </Button>
                <Button variant="outline" size="icon" className="rounded-full w-10 h-10 bg-[#e8f4fb] text-[#1075b1] border-0 hover:bg-[#d0e9f5] hover:text-[#0c5d8f]" onClick={() => handleShare('linkedin')}>
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </Button>
                <Button variant="outline" size="icon" className="rounded-full w-10 h-10 bg-gray-50 text-gray-600 border-0 hover:bg-gray-100" onClick={() => handleShare('copy')}>
                  <Link2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full w-10 h-10 bg-gray-50 text-gray-600 border-0 hover:bg-gray-100" onClick={() => typeof window !== 'undefined' && window.print()}>
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 shrink-0 space-y-8 mt-10 lg:mt-0">
            {/* Desktop TOC */}
            <div className="hidden lg:block sticky top-24">
              <TableOfContents contentRef={contentRef} />
              
              {/* Author Bio (Sidebar variant) */}
              {post.author && (
                <Card className="mt-8 rounded-2xl border-gray-100 shadow-sm bg-gray-50/50">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-20 w-20 border-4 border-white shadow-sm mb-4">
                        <AvatarImage src={post.author.avatar || undefined} className="object-cover" />
                        <AvatarFallback className="bg-primary text-white font-bold text-xl">
                          {post.author.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Tác giả</p>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{post.author.name}</h3>
                      {post.author.bio && (
                        <p className="text-gray-600 text-sm leading-relaxed">{post.author.bio}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-20 mb-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Bài viết liên quan</h2>
              <Link href="/tin-tuc">
                <Button variant="ghost" className="font-bold text-primary hover:bg-primary-light/10">
                  Xem tất cả
                </Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((p) => (
                <NewsCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
