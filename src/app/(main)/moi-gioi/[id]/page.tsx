'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PropertyCard } from '@/components/property/PropertyCard';
import { ReviewCard } from '@/components/property/ReviewCard';
import { PillTabs } from '@/components/ui/pill-tabs';
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  Home,
  MessageSquare,
  ChevronLeft,
  Share2,
  Building,
  TrendingUp,
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
  areas: ['TP Quảng Ngãi', 'Lý Sơn'],
  company: 'Sàn GD BĐS Quảng Ngãi',
  rating: 4.8,
  total_reviews: 156,
  total_listings: 45,
  total_sold: 120,
  bio: 'Tôi là chuyên gia bất động sản với 10 năm kinh nghiệm tại khu vực Quảng Ngãi và Đà Nẵng. Chuyên môn chính của tôi là phân khúc căn hộ cao cấp, nhà phố thương mại và đất nền dự án ven biển. Phương châm làm việc: Uy tín tạo niềm tin, tận tâm tạo giá trị. Tôi cam kết mang đến cho khách hàng những sản phẩm BĐS chất lượng nhất với dịch vụ pháp lý minh bạch, nhanh gọn.',
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
    content: 'Anh A rất nhiệt tình, tư vấn chi tiết và hỗ trợ xuyên suốt quá trình giao dịch. Các thủ tục pháp lý được xử lý nhanh gọn. Highly recommended!',
    created_at: '2024-01-15',
    property: 'Căn hộ cao cấp 2PN',
  },
  {
    id: 2,
    user: { name: 'Khách hàng B', avatar: null },
    rating: 5,
    content: 'Dịch vụ chuyên nghiệp, thủ tục nhanh gọn. Đã mua nhà thành công nhờ sự hỗ trợ của anh A. Sẽ tiếp tục hợp tác trong tương lai.',
    created_at: '2024-01-10',
    property: 'Nhà phố 3 tầng',
  },
  {
    id: 3,
    user: { name: 'Khách hàng C', avatar: null },
    rating: 4,
    content: 'Tư vấn tốt, sản phẩm đa dạng và giá cả hợp lý so với thị trường. Điểm trừ nhỏ là do lịch bận nên thời gian xem nhà bị dời lại 1 ngày.',
    created_at: '2024-01-05',
    property: 'Đất nền KDC',
  },
];

export default function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const id = unwrappedParams?.id;
  const [activeTab, setActiveTab] = useState('listings');

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* ══════════════════════════════════
          COVER & HEADER INFO
      ══════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 relative">
        {/* Abstract Cover Background */}
        <div className="absolute top-0 left-0 right-0 h-40 md:h-52 bg-gradient-to-r from-primary to-primary-dark overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute top-10 right-20 w-80 h-80 bg-white rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-4 pb-8 relative z-10">
          {/* Breadcrumb - Over Cover */}
          <div className="flex items-center gap-2 text-sm text-white/80 mb-10 md:mb-16">
            <Link href="/moi-gioi" className="hover:text-white flex items-center gap-1 font-medium transition-colors">
              <ChevronLeft className="h-4 w-4" />
              Danh sách môi giới
            </Link>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end mt-4 md:mt-12 bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-50 relative -mt-16 md:-mt-10">
            {/* Avatar */}
            <div className="flex-shrink-0 relative -mt-16 md:-mt-24 self-center md:self-start">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-8 border-white shadow-lg bg-white">
                <AvatarImage src={agent.avatar || undefined} className="object-cover" />
                <AvatarFallback className="text-5xl font-bold bg-primary-light text-primary">
                  {agent.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {agent.verified && (
                <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-2 border-4 border-white shadow-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{agent.name}</h1>
                    {agent.verified && (
                      <Badge className="bg-green-100 hover:bg-green-100 text-green-700 border-0 text-xs px-2 py-0.5">
                        Đã xác thực
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-3 text-sm text-gray-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Building className="h-4 w-4 text-gray-400" />
                      {agent.company}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {agent.areas.join(', ')}
                    </span>
                  </div>
                </div>

                {/* Rating Badge */}
                <div className="inline-flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                  <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
                  <div className="text-left">
                    <p className="text-lg font-black text-gray-900 leading-none">{agent.rating} <span className="text-sm font-medium text-gray-500">/ 5</span></p>
                    <p className="text-xs font-bold text-gray-500 uppercase">{agent.total_reviews} đánh giá</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                <Button className="bg-primary hover:bg-primary-dark font-bold px-6 h-12 rounded-xl shadow-md gap-2 text-[15px]">
                  <Phone className="h-4 w-4" />
                  {agent.phone}
                </Button>
                <Button variant="outline" className="font-bold px-6 h-12 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Gửi tin nhắn
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-gray-200 text-gray-500 hover:bg-gray-50 shrink-0">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar - Agent Details */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* Stats Card */}
            <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Thống kê giao dịch
                </h3>
              </div>
              <CardContent className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
                    <p className="text-3xl font-black text-gray-900 mb-1">{agent.total_sold}</p>
                    <p className="text-xs font-bold text-gray-500 uppercase">Đã bán/thuê</p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
                    <p className="text-3xl font-black text-primary mb-1">{agent.total_listings}</p>
                    <p className="text-xs font-bold text-gray-500 uppercase">Tin đang đăng</p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
                    <p className="text-2xl font-black text-gray-900 mb-1">{agent.stats.response_rate}%</p>
                    <p className="text-xs font-bold text-gray-500 uppercase">Tỷ lệ phản hồi</p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
                    <p className="text-2xl font-black text-gray-900 mb-1">{agent.stats.years_experience} năm</p>
                    <p className="text-xs font-bold text-gray-500 uppercase">Kinh nghiệm</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About Card */}
            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <div className="p-4 border-b border-gray-50">
                <h3 className="font-bold text-gray-900">Giới thiệu</h3>
              </div>
              <CardContent className="p-5">
                <p className="text-[15px] text-gray-600 leading-relaxed mb-6">
                  {agent.bio}
                </p>

                <Separator className="my-5" />

                <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Thông tin liên hệ</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-[15px]">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-gray-500" />
                    </div>
                    <span className="font-medium text-gray-900">{agent.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-gray-500" />
                    </div>
                    <span className="font-medium text-gray-900">{agent.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-gray-500" />
                    </div>
                    <span className="font-medium text-gray-900">{agent.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-gray-500" />
                    </div>
                    <span className="font-medium text-gray-500">Thành viên từ {formatDate(agent.joined_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-8">
            <PillTabs 
              tabs={[
                { id: 'listings', label: `Tin đang bán (${listings.length})`, icon: <Home className="h-4 w-4" /> },
                { id: 'reviews', label: `Đánh giá (${reviews.length})`, icon: <Star className="h-4 w-4" /> },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div className="mt-8">
              {/* Listings Tab */}
              {activeTab === 'listings' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="grid sm:grid-cols-2 gap-6">
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
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
                  {/* Rating Summary inside Reviews Tab */}
                  <Card className="rounded-2xl border-gray-100 bg-amber-50/50 mb-6">
                    <CardContent className="p-6 flex flex-col md:flex-row items-center gap-8">
                      <div className="text-center">
                        <p className="text-5xl font-black text-gray-900 mb-2">{agent.rating}</p>
                        <div className="flex items-center justify-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-5 w-5 ${i < Math.floor(agent.rating) ? 'fill-amber-500 text-amber-500' : 'text-amber-200 fill-amber-200'}`} />
                          ))}
                        </div>
                        <p className="text-sm font-bold text-gray-500 uppercase">{agent.total_reviews} đánh giá</p>
                      </div>
                      
                      <div className="flex-1 w-full space-y-2">
                        {[5, 4, 3, 2, 1].map(stars => {
                          const percentage = stars === 5 ? 85 : stars === 4 ? 10 : stars === 3 ? 5 : 0;
                          return (
                            <div key={stars} className="flex items-center gap-3">
                              <span className="text-sm font-bold text-gray-600 w-12 flex items-center justify-end">{stars} <Star className="h-3 w-3 ml-1 fill-gray-400 text-gray-400" /></span>
                              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }}></div>
                              </div>
                              <span className="text-sm text-gray-400 w-8">{percentage}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} showProperty />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
