'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Calendar,
  Clock,
  Share2,
  Bookmark,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';

// Mock blog posts
const blogPosts = [
  {
    id: 1,
    title: 'Thị trường bất động sản Đà Nẵng 2024: Xu hướng nào đáng đầu tư?',
    slug: 'thi-truong-bds-da-nang-2024',
    excerpt: 'Năm 2024, thị trường bất động sản Đà Nẵng được dự báo sẽ có nhiều biến động. Cùng phân tích các xu hướng đáng chú ý.',
    thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop',
    category: 'Thị trường',
    author: { name: 'Admin', avatar: null },
    created_at: '2024-01-20',
    views: 1523,
    comments: 24,
  },
  {
    id: 2,
    title: 'Hướng dẫn mua nhà lần đầu: Những điều cần biết',
    slug: 'huong-dan-mua-nha-lan-dau',
    excerpt: 'Mua nhà lần đầu có thể gặp nhiều bỡ ngỡ. Bài viết này sẽ giúp bạn nắm rõ các bước và lưu ý quan trọng.',
    thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop',
    category: 'Hướng dẫn',
    author: { name: 'Tư vấn BDS', avatar: null },
    created_at: '2024-01-19',
    views: 2341,
    comments: 45,
  },
  {
    id: 3,
    title: 'Top 5 khu vực có tiềm năng sinh lời cao tại Đà Nẵng',
    slug: 'top-5-khu-vuc-dau-tu-da-nang',
    excerpt: 'Khám phá những khu vực đang thu hút nhà đầu tư với tiềm năng sinh lời hấp dẫn.',
    thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop',
    category: 'Đầu tư',
    author: { name: 'Chuyên gia', avatar: null },
    created_at: '2024-01-18',
    views: 987,
    comments: 12,
  },
  {
    id: 4,
    title: 'Những lỗi thường gặp khi làm sổ đỏ lần đầu',
    slug: 'loi-thuong-gap-lam-so-do',
    excerpt: 'Làm sổ đỏ là thủ tục pháp lý quan trọng. Tránh những sai lầm phổ biến để quá trình diễn ra suôn sẻ.',
    thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop',
    category: 'Pháp lý',
    author: { name: 'Luật sư', avatar: null },
    created_at: '2024-01-17',
    views: 1567,
    comments: 33,
  },
  {
    id: 5,
    title: 'Cập nhật giá thuê văn phòng tại các thành phố lớn',
    slug: 'cap-nhat-gia-thue-van-phong',
    excerpt: 'Báo cáo mới nhất về giá thuê văn phòng tại TP.HCM, Hà Nội và Đà Nẵng quý 4/2023.',
    thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop',
    category: 'Báo cáo',
    author: { name: 'Research Team', avatar: null },
    created_at: '2024-01-16',
    views: 654,
    comments: 8,
  },
  {
    id: 6,
    title: 'Mua đất nền hay căn hộ: Nên chọn loại hình nào?',
    slug: 'mua-dat-nen-hay-can-ho',
    excerpt: 'So sánh chi tiết ưu nhược điểm giữa đất nền và căn hộ để bạn đưa ra quyết định phù hợp.',
    thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop',
    category: 'Hướng dẫn',
    author: { name: 'Tư vấn BDS', avatar: null },
    created_at: '2024-01-15',
    views: 2109,
    comments: 56,
  },
];

const categories = ['Tất cả', 'Thị trường', 'Đầu tư', 'Hướng dẫn', 'Pháp lý', 'Báo cáo'];

export default function BlogListPage() {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = blogPosts.filter(post => {
    if (selectedCategory !== 'Tất cả' && post.category !== selectedCategory) return false;
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const featuredPost = blogPosts[0];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tin tức Bất động sản</h1>
          <p className="text-gray-500">Cập nhật những tin tức mới nhất về thị trường BĐS</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Featured Post */}
            <Link href={`/tin-tuc/${featuredPost.slug}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-[16/9]">
                  <img
                    src={featuredPost.thumbnail}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <Badge className="mb-3">{featuredPost.category}</Badge>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 hover:text-blue-600">
                    {featuredPost.title}
                  </h2>
                  <p className="text-gray-500 mb-4">{featuredPost.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(featuredPost.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {featuredPost.views} lượt xem
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Post Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {filteredPosts.slice(1).map((post) => (
                <Link key={post.id} href={`/tin-tuc/${post.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
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
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 hover:text-blue-600">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{post.author.name}</span>
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="default" size="sm">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <Button variant="outline" size="sm">...</Button>
              <Button variant="outline" size="sm">10</Button>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm tin tức..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Danh mục
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Popular Posts */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Bài viết phổ biến</h3>
                <div className="space-y-4">
                  {blogPosts.slice(0, 5).map((post, index) => (
                    <Link
                      key={post.id}
                      href={`/tin-tuc/${post.slug}`}
                      className="flex gap-3 group"
                    >
                      <span className="text-2xl font-bold text-gray-200">{index + 1}</span>
                      <div>
                        <p className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">
                          {post.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {post.views} lượt xem
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Newsletter */}
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0">
              <CardContent className="p-6 text-white">
                <h3 className="font-semibold mb-2">Đăng ký nhận tin</h3>
                <p className="text-sm text-blue-100 mb-4">
                  Nhận thông tin mới nhất về thị trường BĐS qua email
                </p>
                <Input
                  placeholder="Email của bạn"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60 mb-3"
                />
                <Button className="w-full bg-white text-blue-600 hover:bg-blue-50">
                  Đăng ký
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
