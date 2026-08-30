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
import { PropertyMediaSection } from '@/components/property/detail/PropertyMediaSection';
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
  // Tách media theo loại — trước đây chỉ lấy ảnh rồi rút gọn thành mảng URL trần, vứt bỏ hết
  // image_type/sort_order/is_primary và toàn bộ video/tour360/mặt bằng (feedback Đợt 4: những
  // thứ này đã lưu được từ form đăng tin nhưng chưa từng hiển thị cho người mua xem).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allMedia: any[] = apiProp.media ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const images = allMedia
    .filter((m: any) => m.type === 'image')
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videos = allMedia.filter((m: any) => m.type === 'video');
  const tour360Url = allMedia.find((m: any) => m.type === 'virtual_tour')?.url as string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const floorPlans = allMedia.filter((m: any) => m.type === 'floor_plan');

  let mediaUrls = images.length > 0 ? images.map((m: any) => m.url) : [];
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
    // Đủ metadata cho PropertyMediaSection (Đợt 4) — nhóm ảnh theo loại, video, tour 360, mặt bằng.
    images,
    videos,
    tour360Url,
    floorPlans,
    latitude: apiProp.location?.latitude != null ? Number(apiProp.location.latitude) : (apiProp.latitude != null ? Number(apiProp.latitude) : undefined),
    longitude: apiProp.location?.longitude != null ? Number(apiProp.location.longitude) : (apiProp.longitude != null ? Number(apiProp.longitude) : undefined),
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



export default function PropertyDetailClient({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams?.slug;
  const { fetchProperty, fetchSimilar, isLoading } = useProperties();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [propertyData, setPropertyData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [similarData, setSimilarData] = useState<any[]>([]);
  const [loadError, setLoadError] = useState(false);

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
            setSimilarData([]);
          }
        }
      } else {
        // KHÔNG fallback sang tin mẫu: trước đây slug sai/API lỗi lại dựng một tin BỊA (giá,
        // diện tích, liên hệ đều giả) trông y như tin thật. Vỏ server đã trả 404 cho slug không
        // tồn tại; ở đây chỉ cần báo không tải được.
        setLoadError(true);
      }
    };

    loadDetail();
  }, [slug, fetchProperty, fetchSimilar]);

  const { isSaved: isFavorite, toggle: toggleFavorite } = useFavorite(propertyData?.id);

  if (loadError) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-extrabold text-gray-900 mb-2">Không tải được tin đăng</h1>
        <p className="text-gray-500 mb-6">
          Tin này có thể đã được gỡ, hoặc kết nối đang gặp sự cố. Vui lòng thử lại.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-11 px-5 rounded-xl bg-primary text-white font-bold"
          >
            Thử lại
          </button>
          <Link href="/cho-thue" className="h-11 px-5 rounded-xl border border-gray-200 font-bold text-gray-700 flex items-center">
            Xem tin khác
          </Link>
        </div>
      </div>
    );
  }

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
        <PropertyMediaSection
          media={propertyData.media}
          images={propertyData.images}
          videos={propertyData.videos}
          tour360Url={propertyData.tour360Url}
          floorPlans={propertyData.floorPlans}
          latitude={propertyData.latitude}
          longitude={propertyData.longitude}
        />

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
