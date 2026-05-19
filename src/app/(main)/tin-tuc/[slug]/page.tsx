'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageLoader } from '@/components/shared';
import { postApi, type Post, type PostComment } from '@/lib/post-api';
import {
  ChevronLeft,
  Share2,
  Eye,
  MessageSquare,
  Printer,
  ExternalLink,
  Calendar,
} from 'lucide-react';

export default function BlogDetailPage({ params }: { params: { slug: string } }) {
  const [relatedPosts] = useState<Post[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['post', params.slug],
    queryFn: () => postApi.get(params.slug),
    enabled: !!params.slug,
  });

  const post: Post | null = data?.data || null;

  const handleShare = (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = post?.title || '';
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`,
    };
    if (shareUrls[platform]) {
      window.open(shareUrls[platform]);
    }
  };

  if (isLoading) return <PageLoader />;

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy bài viết</h2>
          <Link href="/tin-tuc" className="text-primary hover:underline">Quay lại tin tức</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-primary">Trang chủ</Link>
            <ChevronLeft className="h-4 w-4 rotate-180" />
            <Link href="/tin-tuc" className="hover:text-primary">Tin tức</Link>
            <ChevronLeft className="h-4 w-4 rotate-180" />
            <span className="text-gray-900 line-clamp-1">{post.title}</span>
          </div>

          {/* Category */}
          {post.category && <Badge className="mb-3">{post.category.name}</Badge>}

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
            {post.author && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={post.author.avatar || undefined} />
                  <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{post.author.name}</span>
              </div>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.view_count.toLocaleString()} lượt xem
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm">
          {/* Featured Image */}
          {post.thumbnail && (
            <div className="aspect-[16/9] rounded-t-xl overflow-hidden">
              <Image
                src={post.thumbnail}
                alt={post.title}
                width={800}
                height={450}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="p-8">
            {post.content ? (
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            ) : post.excerpt ? (
              <p className="text-gray-600 leading-relaxed">{post.excerpt}</p>
            ) : null}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Share */}
            <div className="flex items-center gap-4 mb-6 mt-6">
              <span className="text-gray-500">Chia sẻ:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('facebook')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('twitter')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('linkedin')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => typeof window !== 'undefined' && window.print()}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Author Bio */}
        {post.author && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={post.author.avatar || undefined} />
                  <AvatarFallback className="text-xl">
                    {post.author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{post.author.name}</h3>
                  {post.author.bio && (
                    <p className="text-gray-500 text-sm mt-1">{post.author.bio}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Bài viết liên quan</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((p) => (
                <Link key={p.id} href={`/tin-tuc/${p.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    {p.thumbnail && (
                      <div className="aspect-[16/10] relative">
                        <Image
                          src={p.thumbnail}
                          alt={p.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      {p.category && (
                        <Badge variant="secondary" className="mb-2 text-xs">
                          {p.category.name}
                        </Badge>
                      )}
                      <h3 className="font-semibold line-clamp-2 hover:text-primary">
                        {p.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(p.published_at || p.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
