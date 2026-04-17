'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PropertyCard } from '@/components/property/PropertyCard';
import { ReviewCard } from '@/components/property/ReviewCard';
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  Home,
  CheckCircle,
  MessageSquare,
  ChevronLeft,
  Share2,
  Heart,
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';

// Mock agent data
const agent = {
  id: 1,
  name: 'Nguyễn Văn A',
  avatar: null,
  phone: '0901234567',
  email: 'nguyenvana@email.com',
  address: 'Đà Nẵng',
  rating: 4.8,
  total_reviews: 156,
  total_listings: 45,
  total_sold: 120,
  bio: 'Chuyên gia bất động sản với 10 năm kinh nghiệm tại Đà Nẵng. Chuyên môn: căn hộ, nhà phố, đất nền. Tôi cam kết mang đến cho khách hàng những sản phẩm BĐS chất lượng nhất với dịch vụ tận tâm.',
  verified: true,
  verified_at: '2023-01-01',
  joined_at: '2020-01-01',
  social: {
    facebook: 'https://facebook.com',
    zalo: 'zalo.me',
  },
  stats: {
    response_rate: 98,
    response_time: '< 1 giờ',
    years_experience: 10,
  },
};

// Mock listings
const listings = [
  {
    id: 1,
    title: 'Căn hộ cao cấp 2PN view biển Mỹ Khê',
    slug: 'can-ho-cao-cap-2pn-view-bien',
    price: 3500000000,
    area: 75,
    thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
    address: 'Đường Võ Nguyên Giáp, Sơn Trà, Đà Nẵng',
    type: 'apartment',
    bedrooms: 2,
    status: 'active',
  },
  {
    id: 2,
    title: 'Nhà phố 3 tầng mặt tiền đường lớn',
    slug: 'nha-pho-3-tang-mat-tien',
    price: 4500000000,
    area: 120,
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
    address: 'Quang Trung, Hải Châu, Đà Nẵng',
    type: 'townhouse',
    bedrooms: 4,
    status: 'active',
  },
  {
    id: 3,
    title: 'Đất nền KDC An Phú Quý 200m2',
    slug: 'dat-nen-kdc-an-phu-quy',
    price: 1800000000,
    area: 200,
    thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop',
    address: 'Tịnh Long, Quảng Ngãi',
    type: 'land',
    status: 'active',
  },
];

// Mock reviews
const reviews = [
  {
    id: 1,
    user: { name: 'Khách hàng A', avatar: null },
    rating: 5,
    content: 'Anh A rất nhiệt tình, tư vấn chi tiết và hỗ trợ xuyên suốt quá trình giao dịch. Highly recommended!',
    created_at: '2024-01-15',
    property: 'Căn hộ cao cấp 2PN',
  },
  {
    id: 2,
    user: { name: 'Khách hàng B', avatar: null },
    rating: 5,
    content: 'Dịch vụ chuyên nghiệp, thủ tục nhanh gọn. Đã mua nhà thành công nhờ sự hỗ trợ của anh A.',
    created_at: '2024-01-10',
    property: 'Nhà phố 3 tầng',
  },
  {
    id: 3,
    user: { name: 'Khách hàng C', avatar: null },
    rating: 4,
    content: 'Tư vấn tốt, nhưng thời gian xem nhà hơi lâu do lịch bận.',
    created_at: '2024-01-05',
    property: 'Đất nền KDC',
  },
];

export default function AgentProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const [activeTab, setActiveTab] = useState('listings');

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/moi-gioi" className="hover:text-blue-600 flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Danh sách môi giới
            </Link>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar & Basic Info */}
            <div className="flex-shrink-0 text-center md:text-left">
              <div className="relative inline-block">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={agent.avatar || undefined} />
                  <AvatarFallback className="text-4xl">
                    {agent.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {agent.verified && (
                  <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full p-2">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{agent.name}</h1>
                {agent.verified && (
                  <Badge variant="secondary" className="text-xs">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Đã xác thực
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1 text-gray-500 mb-4">
                <MapPin className="h-4 w-4" />
                {agent.address}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(agent.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="font-semibold ml-2">{agent.rating}</span>
                  <span className="text-gray-500">({agent.total_reviews} đánh giá)</span>
                </div>
              </div>

              {/* Bio */}
              <p className="text-gray-600 mb-6">{agent.bio}</p>

              {/* Contact Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button className="gap-2">
                  <Phone className="h-4 w-4" />
                  {agent.phone}
                </Button>
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Nhắn tin
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex-shrink-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{agent.total_listings}</p>
                  <p className="text-sm text-gray-500">Tin đăng</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{agent.total_sold}</p>
                  <p className="text-sm text-gray-500">Đã giao dịch</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{agent.stats.response_rate}%</p>
                  <p className="text-sm text-gray-500">Phản hồi</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{agent.stats.years_experience}</p>
                  <p className="text-sm text-gray-500">Năm kinh nghiệm</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="listings" className="gap-2">
              <Home className="h-4 w-4" />
              Tin đăng ({listings.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <Star className="h-4 w-4" />
              Đánh giá ({reviews.length})
            </TabsTrigger>
            <TabsTrigger value="about">Giới thiệu</TabsTrigger>
          </TabsList>

          {/* Listings Tab */}
          <TabsContent value="listings" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={{
                    id: property.id,
                    title: property.title,
                    slug: property.slug,
                    price: property.price,
                    area: property.area,
                    thumbnail: property.thumbnail,
                    address: property.address,
                    type: property.type,
                    bedrooms: 'bedrooms' in property ? property.bedrooms : undefined,
                  }}
                />
              ))}
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} showProperty />
              ))}
            </div>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Giới thiệu</h3>
                <p className="text-gray-600 mb-6">{agent.bio}</p>

                <Separator className="my-6" />

                <h4 className="font-medium mb-4">Thông tin liên hệ</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{agent.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{agent.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{agent.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Tham gia từ {formatDate(agent.joined_at)}</span>
                  </div>
                </div>

                <Separator className="my-6" />

                <h4 className="font-medium mb-4">Thống kê</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{agent.stats.response_rate}%</p>
                    <p className="text-sm text-gray-500">Tỷ lệ phản hồi</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{agent.stats.response_time}</p>
                    <p className="text-sm text-gray-500">Thời gian phản hồi</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{agent.total_sold}</p>
                    <p className="text-sm text-gray-500">Giao dịch thành công</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
