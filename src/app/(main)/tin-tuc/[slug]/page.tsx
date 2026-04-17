'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PropertyCard } from '@/components/property/PropertyCard';
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Bookmark,
  Clock,
  Eye,
  MessageSquare,
  Printer,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';

// Mock blog post
const blogPost = {
  id: 1,
  title: 'Thị trường bất động sản Đà Nẵng 2024: Xu hướng nào đáng đầu tư?',
  slug: 'thi-truong-bds-da-nang-2024',
  content: `
<p>Năm 2024, thị trường bất động sản Đà Nẵng được dự báo sẽ có nhiều biến động. Cùng phân tích các xu hướng đáng chú ý trong bài viết dưới đây.</p>

<h2>1. Tổng quan thị trường</h2>
<p>Thị trường bất động sản Đà Nẵng đã có sự phục hồi đáng kể trong năm 2023 với lượng giao dịch tăng 25% so với cùng kỳ năm trước. Nhiều chuyên gia dự báo xu hướng này sẽ tiếp tục trong năm 2024.</p>

<h2>2. Các phân khúc tiềm năng</h2>

<h3>2.1 Căn hộ cao cấp</h3>
<p>Phân khúc căn hộ cao cấp tại Đà Nẵng tiếp tục thu hút nhà đầu tư với mức sinh lời từ 8-12%/năm. Vị trí ven biển vẫn là lựa chọn hàng đầu.</p>

<h3>2.2 Đất nền vùng ven</h3>
<p>Đất nền tại các huyện vùng ven như Hòa Vang, Liên Chiểu đang có mức tăng giá ấn tượng, trung bình 15-20% trong năm 2023.</p>

<h3>2.3 Bất động sản nghỉ dưỡng</h3>
<p>Với lợi thế du lịch, condotel và villa nghỉ dưỡng tại Đà Nẵng vẫn là phân khúc hot, đặc biệt là các sản phẩm có view biển.</p>

<h2>3. Dự báo cho năm 2024</h2>
<p>Theo các chuyên gia, một số xu hướng đáng chú ý trong năm 2024:</p>
<ul>
  <li>Giá bất động sản tiếp tục tăng 10-15% ở khu vực trung tâm</li>
  <li>Nhu cầu nhà ở xã hội tăng mạnh</li>
  <li>Các dự án hạ tầng giao thông được đẩy mạnh</li>
  <li>Thị trường condotel ổn định hơn với các quy định mới</li>
</ul>

<h2>4. Lời khuyên cho nhà đầu tư</h2>
<p>Đối với những ai đang có ý định đầu tư vào thị trường Đà Nẵng, đây là một số lời khuyên:</p>
<ol>
  <li>Nghiên cứu kỹ vị trí trước khi mua</li>
  <li>Chú ý đến pháp lý của dự án</li>
  <li>Đa dạng hóa danh mục đầu tư</li>
  <li>Theo dõi sát các quy hoạch hạ tầng</li>
  <li>Tính toán kỹ khả năng tài chính</li>
</ol>

<h2>Kết luận</h2>
<p>Thị trường bất động sản Đà Nẵng vẫn còn nhiều tiềm năng phát triển. Tuy nhiên, nhà đầu tư cần cân nhắc kỹ lưỡng và đưa ra quyết định dựa trên phân tích thực tế.</p>
  `,
  thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=600&fit=crop',
  category: 'Thị trường',
  author: {
    id: 1,
    name: 'Admin',
    avatar: null,
    bio: 'Chuyên gia phân tích thị trường bất động sản',
  },
  created_at: '2024-01-20',
  updated_at: '2024-01-20',
  views: 1523,
  comments: 24,
  tags: ['Đà Nẵng', 'Thị trường', 'Đầu tư', '2024'],
};

// Related posts
const relatedPosts = [
  {
    id: 2,
    title: 'Hướng dẫn mua nhà lần đầu: Những điều cần biết',
    slug: 'huong-dan-mua-nha-lan-dau',
    thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
    category: 'Hướng dẫn',
    created_at: '2024-01-19',
  },
  {
    id: 3,
    title: 'Top 5 khu vực có tiềm năng sinh lời cao tại Đà Nẵng',
    slug: 'top-5-khu-vuc-dau-tu-da-nang',
    thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
    category: 'Đầu tư',
    created_at: '2024-01-18',
  },
  {
    id: 4,
    title: 'Những lỗi thường gặp khi làm sổ đỏ lần đầu',
    slug: 'loi-thuong-gap-lam-so-do',
    thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
    category: 'Pháp lý',
    created_at: '2024-01-17',
  },
];

// Comments
const comments = [
  {
    id: 1,
    user: { name: 'Nguyễn Văn A', avatar: null },
    content: 'Bài viết rất chi tiết và hữu ích! Cảm ơn tác giả.',
    created_at: '2024-01-20',
    replies: [
      {
        id: 2,
        user: { name: 'Admin', avatar: null },
        content: 'Cảm ơn bạn đã đọc và feedback tích cực!',
        created_at: '2024-01-20',
      },
    ],
  },
  {
    id: 3,
    user: { name: 'Trần Thị B', avatar: null },
    content: 'Mình đang có ý định đầu tư vào Đà Nẵng, bài viết giúp mình nắm bắt thông tin rất tốt.',
    created_at: '2024-01-21',
    replies: [],
  },
];

export default function BlogDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const [showComments, setShowComments] = useState(true);
  const [newComment, setNewComment] = useState('');

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = blogPost.title;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`);
        break;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/tin-tuc" className="hover:text-blue-600">Tin tức</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 line-clamp-1">{blogPost.title}</span>
          </div>

          {/* Category */}
          <Badge className="mb-3">{blogPost.category}</Badge>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {blogPost.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={blogPost.author.avatar || undefined} />
                <AvatarFallback>{blogPost.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{blogPost.author.name}</span>
            </div>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(blogPost.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {blogPost.views} lượt xem
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {comments.length} bình luận
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm">
          {/* Featured Image */}
          <div className="aspect-[16/9]">
            <img
              src={blogPost.thumbnail}
              alt={blogPost.title}
              className="w-full h-full object-cover rounded-t-xl"
            />
          </div>

          {/* Article Content */}
          <div className="p-8">
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: blogPost.content }}
            />

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t">
              {blogPost.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                </Badge>
              ))}
            </div>

            {/* Share */}
            <div className="flex items-center gap-4 mb-6">
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
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Author Bio */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={blogPost.author.avatar || undefined} />
                <AvatarFallback className="text-xl">
                  {blogPost.author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{blogPost.author.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{blogPost.author.bio}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related Posts */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Bài viết liên quan</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedPosts.map((post) => (
              <Link key={post.id} href={`/tin-tuc/${post.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[16/10]">
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {post.category}
                    </Badge>
                    <h3 className="font-semibold line-clamp-2 hover:text-blue-600">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">
                      {formatDate(post.created_at)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div className="mt-12" id="comments">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Bình luận ({comments.length})
          </h2>

          {/* Comment Form */}
          <Card className="mb-8">
            <CardContent className="p-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <div className="flex justify-end mt-3">
                <Button>Đăng bình luận</Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{comment.user.name}</span>
                          <span className="text-xs text-gray-400">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-700 mt-2">{comment.content}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Trả lời
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div className="ml-12 space-y-4">
                    {comment.replies.map((reply) => (
                      <Card key={reply.id}>
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {reply.user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{reply.user.name}</span>
                                <Badge variant="secondary" className="text-xs">Admin</Badge>
                                <span className="text-xs text-gray-400">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-gray-700 mt-1 text-sm">{reply.content}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
