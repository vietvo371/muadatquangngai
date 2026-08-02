'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  Heart,
  Share2,
  MapPin,
  Clock,
  CheckCircle,
  Home,
  ChevronRight,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { HeroGallery } from '@/components/property/detail/HeroGallery';
import { SpecBoxes } from '@/components/property/detail/SpecBoxes';
import { ContactSidebar } from '@/components/property/detail/ContactSidebar';
import { SimilarListings } from '@/components/property/detail/SimilarListings';
import { timeAgo } from '@/lib/formatters';
import { CONFIG } from '@/lib/config';
import { useProperties } from '@/hooks/useProperties';
import { useFavorite } from '@/hooks/useFavorite';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapApiProperty = (apiProp: any) => {
  return {
    id: apiProp.id,
    title: apiProp.title,
    slug: apiProp.slug,
    price: Number(apiProp.price),
    priceUnit: apiProp.price_unit === 'month' || apiProp.price_unit === 'per_month' ? 'per_month' : (apiProp.price_unit === 'per_m2' || apiProp.price_unit === 'm2' ? 'per_m2' : 'total'),
    priceDisplayFormat: apiProp.price_display_format,
    area: Number(apiProp.area),
    type: apiProp.type,
    category: apiProp.category?.name || 'Bất động sản',
    thumbnail: apiProp.thumbnail || '/images/image_data/Haus-Coastal.jpg',
    location: apiProp.location?.district ? `${apiProp.location.district.name}, Quảng Ngãi` : apiProp.address || 'Quảng Ngãi',
    bedrooms: Number(apiProp.bedrooms || 0),
    bathrooms: Number(apiProp.bathrooms || 0),
    isVip: apiProp.is_vip || 'normal',
    // Field tên thật trên response là "owner", không phải "user".
    user: {
      name: apiProp.owner?.name || 'Môi giới',
      avatar: apiProp.owner?.avatar || null,
    },
    created_at: apiProp.created_at,
    views: apiProp.view_count || 0,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapApiPropertyDetail = (apiProp: any) => {
  // Chỉ lấy ảnh cho gallery — media giờ có thêm virtual_tour/floor_plan (feedback I.12/I.13),
  // đưa cả vào đây làm next/image vỡ vì URL không phải ảnh (domain lạ hoặc PDF).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imageMedia = (apiProp.media ?? []).filter((m: any) => m.type === 'image');
  let mediaUrls = imageMedia.length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? imageMedia.map((m: any) => m.url)
    : [];
  if (mediaUrls.length === 0 && apiProp.thumbnail) {
    mediaUrls = [apiProp.thumbnail];
  }
  if (mediaUrls.length === 0) {
    mediaUrls = ['/images/image_data/Haus-Coastal.jpg'];
  }

  return {
    id: apiProp.id.toString(),
    slug: apiProp.slug,
    title: apiProp.title,
    type: apiProp.type,
    isVip: apiProp.is_vip || 'normal',
    price: Number(apiProp.price),
    priceUnit: apiProp.price_unit === 'month' || apiProp.price_unit === 'per_month' ? 'per_month' : (apiProp.price_unit === 'per_m2' || apiProp.price_unit === 'm2' ? 'per_m2' : 'total'),
    priceDisplayFormat: apiProp.price_display_format,
    priceNegotiable: Boolean(apiProp.price_negotiable),
    area: Number(apiProp.area),
    bedrooms: Number(apiProp.bedrooms || 0),
    bathrooms: Number(apiProp.bathrooms || 0),
    direction: apiProp.direction || 'Không xác định',
    legal: apiProp.legal || 'other',
    legalNote: null,
    description: apiProp.description || '',
    media: mediaUrls,
    address: apiProp.address || 'Quảng Ngãi',
    viewCount: Number(apiProp.stats?.view_count || apiProp.view_count || 0),
    publishedAt: apiProp.published_at || apiProp.created_at,
    category: {
      id: apiProp.category?.id || 1,
      name: apiProp.category?.name || 'Bất động sản',
      slug: apiProp.category?.slug || 'nha-dat',
    },
    user: {
      id: apiProp.owner?.id || 1,
      name: apiProp.owner?.name || 'Môi giới',
      avatar: apiProp.owner?.avatar || null,
      phone: apiProp.owner?.phone || '0901234567',
      is_verified: true,
      joinDate: '2024',
    },
    features: apiProp.features || [],
  };
};

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
  address: '123 Đường Trần Phú, Quảng Ngãi, Quảng Ngãi',
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

export default function PropertyDetailClient({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams?.slug;
  const { fetchProperty, fetchSimilar, isLoading } = useProperties();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [propertyData, setPropertyData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [similarData, setSimilarData] = useState<any[]>([]);

  useEffect(() => {
    const loadDetail = async () => {
      const res = await fetchProperty(slug);
      if (res.success && res.data) {
        const mapped = mapApiPropertyDetail(res.data);
        setPropertyData(mapped);

        // Fetch similar properties
        if (res.data.id) {
          const simRes = await fetchSimilar(res.data.id, 3);
          if (simRes.success && simRes.data && simRes.data.length > 0) {
            setSimilarData(simRes.data.map(mapApiProperty));
          } else {
            setSimilarData(similarProperties);
          }
        }
      } else {
        // Fallback to static mock property
        setPropertyData(property);
        setSimilarData(similarProperties);
      }
    };

    loadDetail();
  }, [slug, fetchProperty, fetchSimilar]);

  const { isSaved: isFavorite, toggle: toggleFavorite } = useFavorite(propertyData?.id);

  if (isLoading || !propertyData) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="h-6 w-1/4 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-[300px] md:h-[450px] w-full bg-gray-200 rounded-2xl animate-pulse mb-8" />
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="h-10 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
            <div className="h-24 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-40 w-full bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-full lg:w-[320px] h-[300px] bg-gray-200 rounded-2xl animate-pulse shrink-0" />
        </div>
      </div>
    );
  }

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
            <Link href={`/cho-thue?cat=${propertyData.category.slug}`} className="hover:text-primary transition-colors">
              {propertyData.category.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 truncate max-w-[200px] sm:max-w-none">{propertyData.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-6">
        
        {/* Gallery */}
        <HeroGallery images={propertyData.media} />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            
            {/* Header Info */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-green-600 text-white border-0 shadow-sm uppercase text-[11px] font-bold tracking-wider">
                  Cho thuê
                </Badge>
                {CONFIG.enableVip && propertyData.isVip !== 'normal' && (
                  <Badge className="bg-[#e03131] text-white border-0 shadow-sm uppercase text-[11px] font-bold tracking-wider">
                    {propertyData.isVip === 'vip' ? 'VIP' : propertyData.isVip === 'vip_plus' ? 'VIP+' : 'DIAMOND'}
                  </Badge>
                )}
              </div>
              <h1 className="text-[24px] sm:text-[28px] font-extrabold text-gray-900 leading-[1.3] mb-3 tracking-tight">
                {propertyData.title}
              </h1>
              <div className="flex items-center gap-2 text-[14px] text-gray-500 font-medium">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{propertyData.address}</span>
              </div>
            </div>

            {/* Spec Boxes */}
            <SpecBoxes
              price={propertyData.price}
              priceUnit={propertyData.priceUnit}
              priceDisplayFormat={propertyData.priceDisplayFormat}
              area={propertyData.area}
              bedrooms={propertyData.bedrooms}
              bathrooms={propertyData.bathrooms}
              direction={propertyData.direction}
            />

            {/* Stats and Actions row */}
            <div className="flex items-center justify-between border-y border-gray-100 py-4 mb-8">
              <div className="flex items-center gap-4 sm:gap-6 text-[13px] text-gray-500 font-medium flex-wrap">
                {/* Đã bỏ lượt xem theo yêu cầu khách. */}
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-400" />
                  Đăng {timeAgo(propertyData.publishedAt)}
                </span>
                <span className="text-gray-400 hidden sm:inline">Mã tin: #{propertyData.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFavorite}
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
              <div className="text-[14px] text-gray-600 leading-relaxed space-y-2">
                {propertyData.description.split('\n').map((line: string, i: number) => {
                  if (!line.trim()) return <div key={i} className="h-1" />;
                  const rendered = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                  if (line.trim().startsWith('- ')) {
                    return (
                      <div key={i} className="flex gap-2">
                        <span className="text-primary mt-1 shrink-0">•</span>
                        <span dangerouslySetInnerHTML={{ __html: rendered.replace(/^-\s+/, '') }} />
                      </div>
                    );
                  }
                  return <p key={i} dangerouslySetInnerHTML={{ __html: rendered }} />;
                })}
              </div>
            </div>

            {/* Features */}
            {propertyData.features && propertyData.features.length > 0 && (
              <div className="mb-8 pt-8 border-t border-gray-100">
                <h2 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">Đặc điểm / Tiện ích</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {propertyData.features.map((feature: any) => (
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
            <ContactSidebar user={propertyData.user} />
          </aside>
          
        </div>

        {/* Similar Listings */}
        <SimilarListings properties={similarData} />

      </div>

      {/* Mobile sticky bottom contact bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <a
          href={`tel:${propertyData.user.phone}`}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-white font-bold text-[15px] transition-colors"
        >
          <Phone className="w-5 h-5" />
          Gọi điện
        </a>
        <button className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-primary text-primary font-bold text-[15px] transition-colors hover:bg-primary-light">
          <MessageSquare className="w-5 h-5" />
          Nhắn tin
        </button>
      </div>

      {/* Bottom padding for mobile sticky bar */}
      <div className="lg:hidden h-[72px]" />
    </div>
  );
}
