'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Star,
  MapPin,
  Home,
  Filter,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { formatPrice } from '@/lib/formatters';

// Mock agents
const agents = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    avatar: null,
    phone: '0901234567',
    email: 'nva@email.com',
    address: 'Đà Nẵng',
    rating: 4.8,
    total_reviews: 156,
    total_listings: 45,
    total_sold: 120,
    bio: 'Chuyên gia bất động sản với 10 năm kinh nghiệm tại Đà Nẵng. Chuyên môn: căn hộ, nhà phố, đất nền.',
    verified: true,
    joined_at: '2020-01-01',
    listings: [
      {
        id: 1,
        title: 'Căn hộ cao cấp 2PN view biển',
        slug: 'can-ho-cao-cap-2pn-view-bien',
        price: 3500000000,
        area: 75,
        thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200',
      },
      {
        id: 2,
        title: 'Nhà phố 3 tầng mặt tiền',
        slug: 'nha-pho-3-tang-mat-tien',
        price: 4500000000,
        area: 120,
        thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200',
      },
    ],
  },
  {
    id: 2,
    name: 'Trần Thị B',
    avatar: null,
    phone: '0912345678',
    email: 'ttb@email.com',
    address: 'Quảng Nam',
    rating: 4.9,
    total_reviews: 203,
    total_listings: 68,
    total_sold: 180,
    bio: 'Môi giới chuyên nghiệp, tận tâm với khách hàng. Chuyên các dự án ven biển Đà Nẵng và Quảng Nam.',
    verified: true,
    joined_at: '2019-06-15',
    listings: [
      {
        id: 3,
        title: 'Biệt thự view biển Mỹ Khê',
        slug: 'biet-thu-view-bien',
        price: 8500000000,
        area: 250,
        thumbnail: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200',
      },
    ],
  },
  {
    id: 3,
    name: 'Lê Văn C',
    avatar: null,
    phone: '0923456789',
    email: 'lvc@email.com',
    address: 'Đà Nẵng',
    rating: 4.6,
    total_reviews: 89,
    total_listings: 32,
    total_sold: 65,
    bio: 'Chuyên đất nền và căn hộ giá rẻ khu vực Đà Nẵng. Luôn đặt lợi ích khách hàng lên hàng đầu.',
    verified: false,
    joined_at: '2021-03-20',
    listings: [
      {
        id: 4,
        title: 'Đất nền KDC An Phú Quý 200m2',
        slug: 'dat-nen-kdc-an-phu-quy',
        price: 1800000000,
        area: 200,
        thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200',
      },
    ],
  },
  {
    id: 4,
    name: 'Phạm Thị D',
    avatar: null,
    phone: '0934567890',
    email: 'ptd@email.com',
    address: 'Đà Nẵng',
    rating: 4.7,
    total_reviews: 134,
    total_listings: 55,
    total_sold: 98,
    bio: '10 năm kinh nghiệm trong lĩnh vực BĐS, chuyên về phân khúc cao cấp và nghỉ dưỡng.',
    verified: true,
    joined_at: '2018-09-01',
    listings: [
      {
        id: 5,
        title: 'Căn hộ penthouse view sông Hàn',
        slug: 'can-ho-penthouse',
        price: 6200000000,
        area: 180,
        thumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200',
      },
    ],
  },
];

export default function AgentsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  const filteredAgents = agents.filter(agent => {
    if (searchQuery && !agent.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (provinceFilter !== 'all' && agent.address !== provinceFilter) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'listings') return b.total_listings - a.total_listings;
    if (sortBy === 'reviews') return b.total_reviews - a.total_reviews;
    return 0;
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Danh sách môi giới</h1>
          <p className="text-gray-500">Tìm kiếm môi giới bất động sản uy tín</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4" />
                  <h3 className="font-semibold">Bộ lọc</h3>
                </div>

                {/* Search */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Tìm kiếm</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Tên môi giới..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Province */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Khu vực</label>
                    <Select value={provinceFilter} onValueChange={(v) => v && setProvinceFilter(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khu vực" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả khu vực</SelectItem>
                        <SelectItem value="Đà Nẵng">Đà Nẵng</SelectItem>
                        <SelectItem value="Quảng Nam">Quảng Nam</SelectItem>
                        <SelectItem value="Quảng Ngãi">Quảng Ngãi</SelectItem>
                        <SelectItem value="Huế">Huế</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Sắp xếp theo</label>
                    <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                        <SelectItem value="listings">Nhiều tin nhất</SelectItem>
                        <SelectItem value="reviews">Nhiều đánh giá nhất</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Thống kê</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tổng môi giới</span>
                    <span className="font-medium">{agents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Đã xác thực</span>
                    <span className="font-medium text-green-600">
                      {agents.filter(a => a.verified).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Đánh giá TB</span>
                    <span className="font-medium">
                      {(agents.reduce((sum, a) => sum + a.rating, 0) / agents.length).toFixed(1)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agents Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-500">{filteredAgents.length} môi giới được tìm thấy</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {filteredAgents.map((agent) => (
                <Link key={agent.id} href={`/moi-gioi/${agent.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Avatar */}
                        <div className="relative">
                          <Avatar className="h-20 w-20">
                            <AvatarImage src={agent.avatar || undefined} />
                            <AvatarFallback className="text-2xl">
                              {agent.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {agent.verified && (
                            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                              <Badge className="h-4 w-4 p-0 bg-blue-500 hover:bg-blue-500">
                                ✓
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{agent.name}</h3>
                            {agent.verified && (
                              <Badge variant="secondary" className="text-xs">Đã xác thực</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                            <MapPin className="h-3 w-3" />
                            {agent.address}
                          </div>

                          <div className="flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1 text-yellow-500">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="font-medium">{agent.rating}</span>
                              <span className="text-gray-400">({agent.total_reviews})</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 mt-4 line-clamp-2">{agent.bio}</p>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-xl font-bold text-gray-900">{agent.total_listings}</p>
                          <p className="text-xs text-gray-500">Tin đăng</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-gray-900">{agent.total_sold}</p>
                          <p className="text-xs text-gray-500">Đã giao dịch</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-gray-900">{agent.total_reviews}</p>
                          <p className="text-xs text-gray-500">Đánh giá</p>
                        </div>
                      </div>

                      {/* Listings Preview */}
                      {agent.listings.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Tin nổi bật</p>
                          <div className="flex gap-2">
                            {agent.listings.slice(0, 2).map((listing) => (
                              <div key={listing.id} className="flex items-center gap-2 text-sm">
                                <img
                                  src={listing.thumbnail}
                                  alt=""
                                  className="w-10 h-8 rounded object-cover"
                                />
                                <div>
                                  <p className="line-clamp-1">{formatPrice(listing.price)}</p>
                                  <p className="text-xs text-gray-500">{listing.area}m²</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
