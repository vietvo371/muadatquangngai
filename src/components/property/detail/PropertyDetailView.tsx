'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { shareCurrentPage } from '@/lib/share';
import {
  Heart,
  Share2,
  MapPin,
  Clock,
  CheckCircle,
  Home,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PropertyMediaSection } from '@/components/property/detail/PropertyMediaSection';
import { SpecBoxes } from '@/components/property/detail/SpecBoxes';
import { ContactSidebar } from '@/components/property/detail/ContactSidebar';
import { SimilarListings } from '@/components/property/detail/SimilarListings';
import { DescriptionCollapse } from '@/components/property/detail/DescriptionCollapse';
import { FeatureList } from '@/components/property/detail/FeatureList';
import { MortgageCalculator } from '@/components/property/detail/MortgageCalculator';
import { MobileStickyCta } from '@/components/property/detail/MobileStickyCta';
import { timeAgo, derivePrices } from '@/lib/formatters';
import { CONFIG } from '@/lib/config';
import { useProperties } from '@/hooks/useProperties';
import { useFavorite } from '@/hooks/useFavorite';

const CONTACT_ANCHOR_ID = 'lien-he-nguoi-dang';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapApiProperty = (apiProp: any) => {
  return {
    id: apiProp.id,
    title: apiProp.title,
    slug: apiProp.slug,
    price: Number(apiProp.price),
    priceUnit:
      apiProp.price_unit === 'month' || apiProp.price_unit === 'per_month'
        ? 'per_month'
        : apiProp.price_unit === 'per_m2' || apiProp.price_unit === 'm2'
          ? 'per_m2'
          : 'total',
    priceDisplayFormat: apiProp.price_display_format,
    area: Number(apiProp.area),
    type: apiProp.type,
    category: apiProp.category?.name || 'Bất động sản',
    thumbnail: apiProp.thumbnail || '/images/image_data/Haus-Coastal.jpg',
    location: apiProp.location?.district
      ? `${apiProp.location.district.name}, Quảng Ngãi`
      : apiProp.address || 'Quảng Ngãi',
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
  // image_type/sort_order/is_primary và toàn bộ video/tour360/mặt bằng (feedback Đợt 4).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allMedia: any[] = apiProp.media ?? [];
  const images = allMedia
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((m: any) => m.type === 'image')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videos = allMedia.filter((m: any) => m.type === 'video');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tour360Url = allMedia.find((m: any) => m.type === 'virtual_tour')?.url as string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const floorPlans = allMedia.filter((m: any) => m.type === 'floor_plan');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    priceUnit:
      apiProp.price_unit === 'month' || apiProp.price_unit === 'per_month'
        ? 'per_month'
        : apiProp.price_unit === 'per_m2' || apiProp.price_unit === 'm2'
          ? 'per_m2'
          : 'total',
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
    images,
    videos,
    tour360Url,
    floorPlans,
    projectName: apiProp.project?.name || null,
    projectSlug: apiProp.project?.slug || null,
    latitude:
      apiProp.location?.latitude != null
        ? Number(apiProp.location.latitude)
        : apiProp.latitude != null
          ? Number(apiProp.latitude)
          : undefined,
    longitude:
      apiProp.location?.longitude != null
        ? Number(apiProp.location.longitude)
        : apiProp.longitude != null
          ? Number(apiProp.longitude)
          : undefined,
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

interface PropertyDetailViewProps {
  slug: string;
  /** 'sell' → /mua-ban, 'rent' → /cho-thue. Quyết định breadcrumb, nhãn và khối tính khoản vay. */
  listingType: 'sell' | 'rent';
}

/**
 * Thân trang chi tiết dùng chung cho cả /mua-ban/[slug] và /cho-thue/[slug].
 * Desktop: 2 cột 70% nội dung + 30% sidebar. Mobile: 1 cột + thanh CTA cố định đáy.
 */
export function PropertyDetailView({ slug, listingType }: PropertyDetailViewProps) {
  const isSell = listingType === 'sell';
  const basePath = isSell ? '/mua-ban' : '/cho-thue';
  const baseLabel = isSell ? 'Mua bán' : 'Cho thuê';

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
        setPropertyData(mapApiPropertyDetail(res.data));

        if (res.data.id) {
          const simRes = await fetchSimilar(res.data.id, 6);
          if (simRes.success && simRes.data && simRes.data.length > 0) {
            setSimilarData(simRes.data.map(mapApiProperty));
          } else {
            setSimilarData([]);
          }
        }
      } else {
        // KHÔNG fallback sang tin mẫu: slug sai/API lỗi thì báo thật, không dựng tin bịa.
        setLoadError(true);
      }
    };

    loadDetail();
  }, [slug, fetchProperty, fetchSimilar]);

  const { isSaved: isFavorite, toggle: toggleFavorite } = useFavorite(propertyData?.id);

  const scrollToContact = () => {
    document
      .getElementById(CONTACT_ANCHOR_ID)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
          <Link
            href={basePath}
            className="h-11 px-5 rounded-xl border border-gray-200 font-bold text-gray-700 flex items-center"
          >
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
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] gap-8">
          <div className="space-y-6">
            <div className="h-10 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
            <div className="h-24 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-40 w-full bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-full h-[300px] bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const { total: totalPrice } = derivePrices(
    propertyData.price,
    propertyData.priceUnit,
    propertyData.area
  );
  // Chỉ tính khoản vay cho tin bán có giá thật (tin thỏa thuận hoặc giá thuê/tháng thì ẩn).
  const showMortgage =
    isSell && !propertyData.priceNegotiable && propertyData.priceUnit !== 'per_month';

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
            <Link href={basePath} className="hover:text-primary transition-colors">
              {baseLabel}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href={`${basePath}?cat=${propertyData.category.slug}`}
              className="hover:text-primary transition-colors"
            >
              {propertyData.category.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 truncate max-w-[200px] sm:max-w-none">
              {propertyData.title}
            </span>
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
          propertyId={propertyData.id}
          propertyTitle={propertyData.title}
          contactPhone={propertyData.user?.phone}
        />

        {/* Desktop: 70% nội dung + 30% sidebar — Mobile: 1 cột */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] gap-8 items-start">
          {/* Main Content */}
          <div className="min-w-0">
            {/* Header Info */}
            <div className="mb-5">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-primary text-white border-0 shadow-sm uppercase text-[11px] font-bold tracking-wider">
                  {isSell ? 'Bán' : 'Cho thuê'}
                </Badge>
                {CONFIG.enableVip && propertyData.isVip !== 'normal' && (
                  <Badge className="bg-[#e03131] text-white border-0 shadow-sm uppercase text-[11px] font-bold tracking-wider">
                    {propertyData.isVip === 'vip'
                      ? 'VIP'
                      : propertyData.isVip === 'vip_plus'
                        ? 'VIP+'
                        : 'DIAMOND'}
                  </Badge>
                )}
              </div>
              <h1 className="text-[24px] sm:text-[28px] font-extrabold text-gray-900 leading-[1.3] mb-3 tracking-tight">
                {propertyData.title}
              </h1>
              {propertyData.projectName && (
                <div className="mb-2 text-[14px] font-semibold text-primary">
                  {propertyData.projectSlug ? (
                    <Link href={`/du-an/${propertyData.projectSlug}`} className="hover:underline">
                      Dự án {propertyData.projectName}
                    </Link>
                  ) : (
                    <span>Dự án {propertyData.projectName}</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 text-[14px] text-gray-500 font-medium">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{propertyData.address}</span>
              </div>
            </div>

            {/* Spec Boxes — Giá, diện tích và các thông số chính */}
            <SpecBoxes
              price={propertyData.price}
              priceUnit={propertyData.priceUnit}
              priceNegotiable={propertyData.priceNegotiable}
              priceDisplayFormat={propertyData.priceDisplayFormat}
              area={propertyData.area}
              bedrooms={propertyData.bedrooms}
              bathrooms={propertyData.bathrooms}
              direction={propertyData.direction}
            />

            {/* Stats and Actions row */}
            <div className="flex items-center justify-between border-y border-gray-100 py-4 mb-6">
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
                    isFavorite ? 'text-cta bg-primary-light' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                  Lưu tin
                </button>
                <button
                  type="button"
                  onClick={() => shareCurrentPage(propertyData?.title ?? 'Bất động sản')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  Chia sẻ
                </button>
              </div>
            </div>

            {/* CTA nổi bật — cuộn tới form liên hệ ở sidebar (form do ContactSidebar xử lý) */}
            <div className="mb-8 rounded-2xl border border-primary/20 bg-primary-light p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div>
                <div className="text-[15px] font-bold text-gray-900">
                  Quan tâm bất động sản này?
                </div>
                <p className="text-[13px] text-gray-600 mt-0.5">
                  Gửi thông tin để người đăng liên hệ lại với bạn.
                </p>
              </div>
              <button
                type="button"
                onClick={scrollToContact}
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-cta hover:bg-cta-dark text-white font-bold text-[15px] transition-colors shrink-0"
              >
                <MessageSquare className="h-4 w-4" />
                Nhận báo giá
              </button>
            </div>

            {/* Description — có Xem thêm / Thu gọn */}
            {propertyData.description?.trim() && (
              <div className="mb-8">
                <h2 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">
                  Thông tin mô tả
                </h2>
                <DescriptionCollapse description={propertyData.description} />
              </div>
            )}

            {/* Tiện ích & Đặc điểm */}
            <FeatureList features={propertyData.features} />

            {/* Legal — chỉ tin bán */}
            {isSell && propertyData.legal && (
              <div className="mb-8 pt-8 border-t border-gray-100">
                <h2 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">
                  Thông tin pháp lý
                </h2>
                <div className="bg-primary-light border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-primary text-[14px]">
                      {propertyData.legal === 'so_do'
                        ? 'Sổ đỏ'
                        : propertyData.legal === 'so_hong'
                          ? 'Sổ hồng'
                          : propertyData.legal === 'contract'
                            ? 'Hợp đồng mua bán'
                            : 'Pháp lý khác'}
                    </p>
                    {propertyData.legalNote && (
                      <p className="text-[13px] text-gray-600 mt-1">{propertyData.legalNote}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tính khoản vay */}
            {showMortgage && <MortgageCalculator totalPrice={totalPrice} />}
          </div>

          {/* Right Sidebar */}
          <aside id={CONTACT_ANCHOR_ID} className="w-full scroll-mt-24">
            <ContactSidebar
              user={propertyData.user}
              propertySlug={propertyData.slug}
              propertyTitle={propertyData.title}
            />
          </aside>
        </div>

        {/* Similar Listings */}
        <SimilarListings properties={similarData} />
      </div>

      {/* Mobile: CTA cố định đáy màn hình + padding chống che nội dung */}
      <MobileStickyCta phone={propertyData.user.phone} contactTargetId={CONTACT_ANCHOR_ID} />
      <div className="lg:hidden h-[76px]" />
    </div>
  );
}
