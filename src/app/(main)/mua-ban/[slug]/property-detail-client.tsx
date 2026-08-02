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
  let mediaUrls = apiProp.media && apiProp.media.length > 0 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? apiProp.media.map((m: any) => m.url) 
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
  id: '1',
  slug: 'can-ho-cao-cap-2pn-view-bien-my-khe',
  title: 'Căn hộ cao cấp 2PN view biển Mỹ Khê - Đầy đủ nội thất cao cấp',
  type: 'sell',
  isVip: 'vip',
  price: 2800000000,
  priceUnit: 'total',
  priceNegotiable: true,
  area: 75,
  bedrooms: 2,
  bathrooms: 2,
  direction: 'Đông Nam',
  legal: 'so_hong',
  legalNote: 'Sổ hồng chính chủ, đã có thế chấp ngân hàng',
  description: `Căn hộ cao cấp 2 phòng ngủ view biển Mỹ Khê, vị trí đắc địa ngay trung tâm quận Sơn Trà.

**Đặc điểm:**
- Diện tích: 75m² (2PN, 2WC)
- Tầng cao, view biển thoáng mát
- Nội thất cao cấp: giường, tủ, bàn ghế, điều hòa, tivi
- Ban công rộng rãi, có máy giặt riêng

**Tiện ích:**
- Hồ bơi, phòng gym, spa
- Bảo vệ 24/7, camera an ninh
- Gần trường học, bệnh viện, siêu thị
- Cách bãi biển 5 phút đi bộ`,
  media: [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&h=800&fit=crop',
  ],
  address: '123 Đường Võ Nguyên Giáp, Phường Mỹ An, Quận Sơn Trà, Đà Nẵng',
  viewCount: 1234,
  publishedAt: '2024-01-15',
  category: { id: 1, name: 'Căn hộ', slug: 'can-ho' },
  user: {
    id: 1,
    name: 'Nguyễn Văn A',
    avatar: null,
    phone: '0901234567',
    is_verified: true,
    joinDate: '2022',
  },
  features: [
    { id: 1, name: 'Hồ bơi' },
    { id: 2, name: 'Gym' },
    { id: 3, name: 'Bảo vệ 24/7' },
    { id: 4, name: 'Camera' },
    { id: 5, name: 'Thang máy' },
    { id: 6, name: 'Điều hòa' },
  ],
};

const similarProperties = [
  {
    id: '2',
    title: 'Căn hộ 2PN Vincom Đà Nẵng',
    slug: 'can-ho-2pn-vincom-da-nang',
    price: 2200000000,
    priceUnit: 'total',
    area: 70,
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
    location: 'Đà Nẵng, Sơn Trà',
    bedrooms: 2,
    bathrooms: 2,
    isVip: 'normal',
    user: { name: 'Trần Văn B', avatar: null },
  },
  {
    id: '3',
    title: 'Căn hộ cao cấp 3PN view biển',
    slug: 'can-ho-cao-cap-3pn-view-bien',
    price: 4500000000,
    priceUnit: 'total',
    area: 120,
    thumbnail: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
    location: 'Đà Nẵng, Mỹ An',
    bedrooms: 3,
    bathrooms: 2,
    isVip: 'vip',
    user: { name: 'Lê Thị C', avatar: null },
  },
  {
    id: '4',
    title: 'Căn hộ Goldmark City 2PN',
    slug: 'can-ho-goldmark-city-2pn',
    price: 1800000000,
    priceUnit: 'total',
    area: 68,
    thumbnail: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600&h=400&fit=crop',
    location: 'Đà Nẵng, Liên Chiểu',
    bedrooms: 2,
    bathrooms: 1,
    isVip: 'normal',
    user: { name: 'Phạm Văn D', avatar: null },
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
          <div className="w-full lg:w-[320px] h-[300px] bg-gray-200 rounded-2xl animate-pulse animate-pulse shrink-0" />
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
            <Link href="/mua-ban" className="hover:text-primary transition-colors">Mua bán</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/mua-ban?cat=${propertyData.category.slug}`} className="hover:text-primary transition-colors">
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
                <Badge className="bg-primary text-white border-0 shadow-sm uppercase text-[11px] font-bold tracking-wider">
                  Bán
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
              priceNegotiable={propertyData.priceNegotiable}
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
                <h2 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">Đặc điểm bất động sản</h2>
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

            {/* Legal */}
            {propertyData.legal && (
              <div className="mb-8 pt-8 border-t border-gray-100">
                <h2 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">Thông tin pháp lý</h2>
                <div className="bg-primary-light border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-primary text-[14px]">
                      {propertyData.legal === 'so_do' ? 'Sổ đỏ' :
                       propertyData.legal === 'so_hong' ? 'Sổ hồng' :
                       propertyData.legal === 'contract' ? 'Hợp đồng mua bán' : 'Pháp lý khác'}
                    </p>
                    {propertyData.legalNote && (
                      <p className="text-[13px] text-gray-600 mt-1">{propertyData.legalNote}</p>
                    )}
                  </div>
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
