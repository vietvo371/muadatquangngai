'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  Share2, 
  MapPin, 
  Clock,
  Eye,
  CheckCircle,
  Home,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { HeroGallery } from '@/components/property/detail/HeroGallery';
import { SpecBoxes } from '@/components/property/detail/SpecBoxes';
import { ContactSidebar } from '@/components/property/detail/ContactSidebar';
import { SimilarListings } from '@/components/property/detail/SimilarListings';

// Mock property data
const property = {
  id: '4',
  slug: 'can-ho-chung-cu-mini-cho-thue-35m2-day-du-noi-that',
  title: 'Căn hộ chung cư mini cho thuê 35m2 đầy đủ nội thất - Dọn vào ở ngay',
  type: 'rent',
  isVip: 'vip',
  price: 5000000,
  priceUnit: 'per_month',
  area: 35,
  bedrooms: 1,
  bathrooms: 1,
  direction: 'Đông',
  description: `Cho thuê chung cư mini 35m2, đầy đủ nội thất, xách vali vào ở ngay.
Khu vực an ninh tốt, gần chợ, trường học, siêu thị.

**Nội thất bao gồm:**
- Giường, đệm, tủ quần áo
- Điều hòa, bình nóng lạnh
- Máy giặt, tủ lạnh
- Bếp từ, hút mùi, kệ bếp

**Tiện ích:**
- Giờ giấc tự do, không chung chủ
- Khu vực để xe rộng rãi dưới tầng trệt
- Camera an ninh 24/7
- Wifi tốc độ cao

Phù hợp cho sinh viên, người đi làm hoặc vợ chồng trẻ.`,
  media: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop',
  ],
  address: '123 Đường Trần Phú, Thành phố Quảng Ngãi, Quảng Ngãi',
  viewCount: 450,
  publishedAt: '2024-03-20',
  category: { id: 2, name: 'Căn hộ cho thuê', slug: 'can-ho-cho-thue' },
  user: {
    id: 2,
    name: 'Phạm Thị D',
    avatar: null,
    phone: '0987654321',
    is_verified: true,
    joinDate: '2023',
  },
  features: [
    { id: 1, name: 'Wifi miễn phí' },
    { id: 2, name: 'Chỗ để xe' },
    { id: 3, name: 'Camera' },
    { id: 4, name: 'Giờ giấc tự do' },
  ],
};

const similarProperties = [
  {
    id: '7',
    title: 'Nhà trọ 1PN cho thuê 20m2 gần trường đại học',
    slug: 'nha-tro-1pn-cho-thue-20m2-gan-truong-dai-hoc',
    price: 2000000,
    priceUnit: 'per_month',
    area: 20,
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
    location: 'Quảng Ngãi, Trần Phú',
    bedrooms: 1,
    bathrooms: 1,
    isVip: 'normal',
    user: { name: 'Nguyễn Văn E', avatar: null },
  },
  {
    id: '8',
    title: 'Văn phòng cho thuê 50m2 tại trung tâm thành phố',
    slug: 'van-phong-cho-thue-50m2-tai-trung-tam-thanh-pho',
    price: 15000000,
    priceUnit: 'per_month',
    area: 50,
    thumbnail: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
    location: 'Quảng Ngãi, Lê Lợi',
    bedrooms: 0,
    bathrooms: 1,
    isVip: 'vip_plus',
    user: { name: 'Trần Văn F', avatar: null },
  },
];

export default function ChoThueDetailPage({ params }: { params: { slug: string } }) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-[1200px] mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-[13px] text-gray-500 font-medium overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              Trang chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/cho-thue" className="hover:text-primary transition-colors">Cho thuê</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/cho-thue?cat=${property.category.slug}`} className="hover:text-primary transition-colors">
              {property.category.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 truncate max-w-[200px] sm:max-w-none">{property.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-6">
        
        {/* Gallery */}
        <HeroGallery images={property.media} />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            
            {/* Header Info */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-green-600 text-white border-0 shadow-sm uppercase text-[11px] font-bold tracking-wider">
                  Cho thuê
                </Badge>
                {property.isVip !== 'normal' && (
                  <Badge className="bg-[#e03131] text-white border-0 shadow-sm uppercase text-[11px] font-bold tracking-wider">
                    {property.isVip === 'vip' ? 'VIP' : property.isVip === 'vip_plus' ? 'VIP+' : 'DIAMOND'}
                  </Badge>
                )}
              </div>
              <h1 className="text-[24px] sm:text-[28px] font-extrabold text-gray-900 leading-[1.3] mb-3 tracking-tight">
                {property.title}
              </h1>
              <div className="flex items-center gap-2 text-[14px] text-gray-500 font-medium">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{property.address}</span>
              </div>
            </div>

            {/* Spec Boxes */}
            <SpecBoxes 
              price={property.price} 
              priceUnit={property.priceUnit}
              area={property.area}
              bedrooms={property.bedrooms}
              bathrooms={property.bathrooms}
              direction={property.direction}
            />

            {/* Stats and Actions row */}
            <div className="flex items-center justify-between border-y border-gray-100 py-4 mb-8">
              <div className="flex items-center gap-6 text-[13px] text-gray-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-gray-400" />
                  {property.viewCount} lượt xem
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-400" />
                  Đăng {property.publishedAt}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ${
                    isFavorite ? 'text-[#e03131] bg-red-50' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                  Lưu tin
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                  <Share2 className="h-4 w-4" />
                  Chia sẻ
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">Thông tin mô tả</h2>
              <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line leading-relaxed">
                {property.description}
              </div>
            </div>

            {/* Features */}
            {property.features.length > 0 && (
              <div className="mb-8 pt-8 border-t border-gray-100">
                <h2 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">Đặc điểm / Tiện ích</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                  {property.features.map((feature) => (
                    <div key={feature.id} className="flex items-center gap-2.5">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-[14px] text-gray-700 font-medium">{feature.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Sidebar */}
          <aside className="w-full lg:w-[320px] xl:w-[340px] shrink-0">
            <ContactSidebar user={property.user} />
          </aside>
          
        </div>

        {/* Similar Listings */}
        <SimilarListings properties={similarProperties} />

      </div>
    </div>
  );
}
