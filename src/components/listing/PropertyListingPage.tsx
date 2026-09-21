'use client';

import { Suspense, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { PropertyCardHorizontal } from '@/components/property/PropertyCardHorizontal';
import { FilterSidebar, FilterState, DEFAULT_FILTERS } from '@/components/search/FilterSidebar';
import { FilterHorizontal } from '@/components/search/FilterHorizontal';
import { SortBar } from '@/components/search/SortBar';
import { FilterTags } from '@/components/shared/FilterTags';
import { PropertyCardSkeleton } from '@/components/property/PropertyCardSkeleton';
import { buildFilterTags, removeTag } from '@/lib/filter-properties';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  SearchX,
  Search as SearchIcon,
  ChevronRight,
  ChevronLeft,
  Home,
  MapPin,
  Bell,
  X,
  Map as MapIcon,
} from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import { Switch } from '@/components/ui/switch';
import { CONFIG } from '@/lib/config';
import { useProperties } from '@/hooks/useProperties';
import { parseFiltersFromSearchParams, buildSearchParamsFromState } from '@/lib/filter-url-sync';
import type { MapBounds } from '@/components/map/PropertyMapView';
import { ListingPagination } from '@/components/listing/ListingPagination';

// Bản đồ Goong nạp phía client — split-view danh sách + bản đồ.
const PropertyMapView = dynamic(
  () => import('@/components/map/PropertyMapView').then((m) => m.PropertyMapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-sm text-gray-400">
        Đang tải bản đồ...
      </div>
    ),
  }
);

export type ListingType = 'sell' | 'rent';

/**
 * Phần khác nhau giữa /mua-ban và /cho-thue gom về một chỗ. Trước đây hai file listing-client
 * giống nhau 89% và mọi feedback phải sửa hai lần — đợt redesign 21/09 tách chung để làm một lần.
 */
const LISTING_COPY: Record<
  ListingType,
  { pathname: string; breadcrumb: string; heading: string; emptyText: string; dotsId: string; dotsColor: string }
> = {
  sell: {
    pathname: '/mua-ban',
    breadcrumb: 'Mua bán nhà đất',
    heading: 'Mua bán nhà đất tại Quảng Ngãi',
    emptyText: 'Không có bất động sản nào phù hợp với bộ lọc của bạn. Thử thay đổi bộ lọc để xem thêm kết quả.',
    dotsId: 'empty-dots-sale',
    dotsColor: '#1075b1',
  },
  rent: {
    pathname: '/cho-thue',
    breadcrumb: 'Cho thuê nhà đất',
    heading: 'Cho thuê nhà đất tại Quảng Ngãi',
    emptyText: 'Không có bất động sản cho thuê nào phù hợp với bộ lọc của bạn. Thử thay đổi bộ lọc để xem thêm kết quả.',
    dotsId: 'empty-dots-rent',
    dotsColor: '#e03131',
  },
};

// 30 tin/trang theo yêu cầu khách (mục 13). Khung xương khi tải chỉ vẽ vài thẻ cho nhẹ.
const PER_PAGE = 30;
const SKELETON_COUNT = 6;

// Giá trị sort của SortBar → tham số API. "Phù hợp nhất" = thứ tự mặc định (VIP trước, mới
// trước); "Xem nhiều nhất" API gọi là `popular` — bản cũ không map nên chọn xong không đổi gì.
const API_SORT: Record<string, string> = { relevant: 'newest', views_desc: 'popular' };
// Tìm theo vùng bản đồ thì lấy nhiều tin hơn để đủ marker.
const PER_PAGE_BBOX = 60;

const mapApiProperty = (apiProp: any) => {
  const unit = apiProp.price_unit;
  return {
    id: apiProp.id,
    title: apiProp.title,
    slug: apiProp.slug,
    price: Number(apiProp.price),
    priceUnit:
      unit === 'month' || unit === 'per_month' ? 'per_month' : unit === 'per_m2' || unit === 'm2' ? 'per_m2' : 'total',
    priceDisplayFormat: apiProp.price_display_format,
    area: Number(apiProp.area),
    type: apiProp.type,
    category: apiProp.category?.name || 'Bất động sản',
    thumbnail: apiProp.thumbnail || '/images/image_data/Haus-Coastal.jpg',
    location: apiProp.location?.district
      ? `${apiProp.location.district.name}, Quảng Ngãi`
      : apiProp.address || 'Quảng Ngãi',
    latitude: apiProp.location?.latitude != null ? Number(apiProp.location.latitude) : null,
    longitude: apiProp.location?.longitude != null ? Number(apiProp.location.longitude) : null,
    bedrooms: Number(apiProp.bedrooms || 0),
    bathrooms: Number(apiProp.bathrooms || 0),
    facade: apiProp.facade != null ? Number(apiProp.facade) : null,
    floors: apiProp.floors != null ? Number(apiProp.floors) : null,
    legal: apiProp.legal ?? null,
    furniture: apiProp.furniture ?? null,
    direction: apiProp.direction ?? null,
    parking: !!apiProp.parking,
    description: apiProp.description ?? null,
    // Ảnh cho khu 1 lớn + 2 nhỏ / slider: chỉ ảnh (bỏ video, tour 360), theo sort_order API đã sắp.
    images: Array.isArray(apiProp.media)
      ? apiProp.media.filter((m: any) => m.type === 'image' && m.url).map((m: any) => m.url as string)
      : [],
    isVip: apiProp.is_vip || 'normal',
    user: {
      name: apiProp.owner?.name || 'Môi giới',
      avatar: apiProp.owner?.avatar || null,
    },
    created_at: apiProp.created_at,
    views: apiProp.view_count || 0,
  };
};

function PropertyListingContent({ type }: { type: ListingType }) {
  const copy = LISTING_COPY[type];
  // Tin đang hover/chọn ở danh sách hoặc trên bản đồ — dùng để đồng bộ highlight 2 chiều.
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listTopRef = useRef<HTMLDivElement>(null);
  const mapColumnRef = useRef<HTMLElement>(null);
  const searchParams = useSearchParams();
  // Tìm theo khung nhìn bản đồ: `bbox` = vùng đang lọc; `pendingBounds` = vùng người dùng vừa
  // kéo tới, chờ bấm "Tìm khu vực này".
  const [bbox, setBbox] = useState<MapBounds | null>(null);
  const [pendingBounds, setPendingBounds] = useState<MapBounds | null>(null);
  // Bản đồ luôn hiện ở cột phải trên desktop (feedback 21/09). Trên mobile cột đó ẩn, nút nổi
  // mở bản đồ dạng overlay toàn màn hình.
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  // Nút nổi "Xem bản đồ" chỉ hiện khi bản đồ đã cuộn ra khỏi khung nhìn (desktop) — bản đồ
  // không sticky theo yêu cầu khách, nên cần lối quay lại.
  const [mapInView, setMapInView] = useState(true);
  const router = useRouter();
  const pathname = usePathname() || copy.pathname;

  const { fetchProperties, isLoading: isApiLoading } = useProperties();
  const [apiProperties, setApiProperties] = useState<any[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [apiPagination, setApiPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: PER_PAGE,
    total: 0,
  });

  // Toàn bộ filter/search/sort/page khởi tạo từ URL (F5, chia sẻ link, back/forward đều giữ
  // đúng kết quả đã lọc) — xem src/lib/filter-url-sync.ts.
  const initialUrlState = useMemo(() => parseFiltersFromSearchParams(searchParams), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [page, setPage] = useState(initialUrlState.page);
  const [filters, setFilters] = useState<FilterState>(initialUrlState.filters);
  const [searchQuery, setSearchQuery] = useState(initialUrlState.searchQuery);
  const [isFiltering, setIsFiltering] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sort, setSort] = useState(initialUrlState.sort);
  const [slide, setSlide] = useState(0);
  const [receiveEmail, setReceiveEmail] = useState(false);

  // Đọc lại filter từ URL mỗi khi query đổi do điều hướng bên ngoài (menu danh mục ở header,
  // back/forward) — component không remount nên cần effect riêng.
  useEffect(() => {
    const next = parseFiltersFromSearchParams(searchParams);
    setFilters(next.filters);
    setSearchQuery(next.searchQuery);
    setSort(next.sort);
    setPage(next.page);
  }, [searchParams]);

  // Ghi state hiện tại vào URL. So sánh với URL thật trước khi replace để tự chặn vòng lặp với
  // effect đọc URL ở trên.
  useEffect(() => {
    const qs = buildSearchParamsFromState({ filters, searchQuery, sort, page }).toString();
    if (qs === (searchParams?.toString() ?? '')) return;
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchQuery, sort, page]);

  useEffect(() => {
    const loadProperties = async () => {
      const apiFilters: any = {
        type,
        page,
        per_page: bbox ? PER_PAGE_BBOX : PER_PAGE,
        sort: API_SORT[sort] ?? sort,
      };

      if (filters.priceMin !== '') apiFilters.price_min = filters.priceMin;
      if (filters.priceMax !== '') apiFilters.price_max = filters.priceMax;
      if (filters.types.length > 0) apiFilters.category = filters.types[0];
      if (filters.district !== '') apiFilters.district = filters.district;
      if (bbox) {
        apiFilters.min_lat = bbox.minLat;
        apiFilters.max_lat = bbox.maxLat;
        apiFilters.min_lng = bbox.minLng;
        apiFilters.max_lng = bbox.maxLng;
      }

      if (filters.bedrooms !== 'any') {
        const bedVal = parseInt(filters.bedrooms);
        if (!isNaN(bedVal)) apiFilters.bedrooms = bedVal;
      }

      const res = await fetchProperties(apiFilters);
      // Bộ lọc trả 0 tin cũng phải cập nhật danh sách về rỗng — bản cũ ở /mua-ban giữ nguyên
      // danh sách trước đó nên người dùng lọc xong vẫn thấy tin không khớp.
      if (res.success && res.data) {
        setLoadFailed(false);
        setApiProperties(res.data.map(mapApiProperty));
        if (res.meta) {
          setApiPagination({
            current_page: res.meta.current_page || 1,
            last_page: res.meta.last_page || 1,
            per_page: res.meta.per_page || PER_PAGE,
            total: res.meta.total || 0,
          });
        }
      } else {
        setLoadFailed(true);
        setApiProperties([]);
      }
    };

    loadProperties();
  }, [type, page, filters, sort, bbox, fetchProperties]);

  // Đổi trang thì đưa người dùng về đầu danh sách — 30 tin/trang, đứng nguyên cuối trang là lạc.
  const changePage = useCallback((next: number) => {
    setPage(next);
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setPage(1);
    setIsFiltering(true);
    setTimeout(() => setIsFiltering(false), 300);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const activeTags = useMemo(() => buildFilterTags(filters), [filters]);

  const handleRemoveTag = useCallback((tagId: string) => {
    setFilters((prev) => ({ ...prev, ...removeTag(prev, tagId) }));
    setPage(1);
  }, []);

  const clearAllTags = useCallback(() => resetFilters(), [resetFilters]);

  // CHỈ hiển thị tin THẬT từ API — không rơi về dữ liệu mẫu khi API lỗi/rỗng.
  const displayProperties = apiProperties;
  const isLoading = isApiLoading;

  // Tin VIP cho hero slider — cũng chỉ lấy từ dữ liệu thật.
  const sliderProperties = useMemo(() => {
    if (!CONFIG.enableVip) return [];
    return apiProperties.filter((p) => p.isVip !== 'normal');
  }, [apiProperties]);

  useEffect(() => {
    if (sliderProperties.length <= 1) return;
    const timer = setInterval(() => {
      setSlide((s) => (s + 1) % sliderProperties.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [sliderProperties.length]);

  // Theo dõi bản đồ còn trong khung nhìn không để bật/tắt nút nổi. Trên mobile cột bản đồ
  // display:none nên observer không bao giờ báo "đang thấy" → nút luôn hiện, đúng ý.
  useEffect(() => {
    const el = mapColumnRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setMapInView(entry.isIntersecting && entry.intersectionRatio > 0.15),
      { threshold: [0, 0.15, 0.5] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const jumpToMap = useCallback(() => {
    const el = mapColumnRef.current;
    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop && el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setMobileMapOpen(true);
    }
  }, []);

  const showMapFab = !mapInView && !mobileMapOpen && displayProperties.length > 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ══ HERO SLIDER ══ tin VIP */}
      {sliderProperties.length > 0 && (
        <div className="relative w-full h-[320px] md:h-[420px] overflow-hidden bg-gray-900 select-none">
          {sliderProperties.map((p, i) => (
            <div
              key={p.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                i === slide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <Image
                src={p.thumbnail}
                alt={p.title}
                fill
                className="object-cover object-center transition-transform duration-[5000ms] ease-out"
                style={{ transform: i === slide ? 'scale(1.05)' : 'scale(1)' }}
                priority={i === 0}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-8 md:pb-10 z-10">
                <div className="max-w-[1440px] mx-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2.5 bg-cta text-white shadow-md">
                    {p.isVip === 'diamond' ? 'DIAMOND' : p.isVip === 'vip_plus' ? 'VIP+' : 'VIP'}
                  </span>
                  <Link href={`/${p.type === 'sell' ? 'mua-ban' : 'cho-thue'}/${p.slug}`}>
                    <h2 className="text-xl md:text-2xl font-black text-white hover:text-primary transition-colors drop-shadow-md leading-tight mb-2 max-w-3xl cursor-pointer line-clamp-2">
                      {p.title}
                    </h2>
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/90 text-sm">
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-white/70" />
                      {p.location}
                    </p>
                    <span className="text-white/30 hidden sm:inline">|</span>
                    <p className="font-semibold text-white">
                      Giá: <span className="font-extrabold text-base">{formatPrice(p.price)}</span>
                    </p>
                    <span className="text-white/30 hidden sm:inline">|</span>
                    <p className="font-semibold text-white">
                      Diện tích: <span className="font-extrabold text-base">{p.area} m²</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {sliderProperties.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Tin trước"
                onClick={() => setSlide((s) => (s - 1 + sliderProperties.length) % sliderProperties.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all hover:scale-105"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Tin sau"
                onClick={() => setSlide((s) => (s + 1) % sliderProperties.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all hover:scale-105"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 right-6 md:right-10 z-20 flex items-center gap-1.5">
                {sliderProperties.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Tin ${i + 1}`}
                    onClick={() => setSlide(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === slide ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Khung rộng hơn trang thường (1440) vì phải chứa cả danh sách 65% lẫn bản đồ 35%. */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
        <FilterHorizontal
          filters={filters}
          onFilterChange={updateFilters}
          onReset={resetFilters}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          context={type}
        />

        <div className="flex gap-6 items-start">
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetContent side="left" className="w-[300px] p-0 overflow-y-auto">
              <SheetHeader className="px-4 py-3 border-b border-gray-100">
                <SheetTitle className="text-[15px] font-bold text-gray-900">Bộ lọc tìm kiếm</SheetTitle>
              </SheetHeader>
              <div className="p-4">
                <FilterSidebar
                  filters={filters}
                  onFilterChange={(updates) => { updateFilters(updates); }}
                  context={type}
                  onApply={() => setMobileFilterOpen(false)}
                  onReset={() => { resetFilters(); setMobileFilterOpen(false); }}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Cột trái ~65%: danh sách. */}
          <div className="min-w-0 w-full lg:w-[65%] lg:flex-none">
            <div ref={listTopRef} className="flex items-center gap-2 text-[13px] text-gray-500 mb-3.5 font-medium scroll-mt-[76px]">
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                Trang chủ
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-900">{copy.breadcrumb}</span>
            </div>

            <div className="mb-5">
              <h1 className="text-[22px] font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                {copy.heading}
              </h1>
              <p className="text-[14px] text-gray-500 mt-1">Hiện có {apiPagination.total} bất động sản.</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 pb-3 border-b border-gray-150">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                  <Bell className="w-4 h-4 fill-white" />
                </div>
                <span className="text-[13px] font-semibold text-gray-750">Nhận email tin mới</span>
                <Switch
                  checked={receiveEmail}
                  onCheckedChange={setReceiveEmail}
                  className="data-[state=checked]:bg-primary scale-90"
                />
              </div>

              <div className="flex-1 sm:flex-none">
                <SortBar totalResults={apiPagination.total} sort={sort} onSortChange={setSort} />
              </div>
            </div>

            {activeTags.length > 0 && (
              <div className="mb-4">
                <FilterTags tags={activeTags} onRemove={handleRemoveTag} onClearAll={clearAllTags} />
              </div>
            )}

            {loadFailed && !isLoading && (
              <div className="mb-4 rounded-xl border border-cta/30 bg-white px-4 py-3 text-[13px] text-gray-700">
                Không tải được danh sách tin. Kiểm tra kết nối rồi thử lại.
              </div>
            )}

            {isLoading || isFiltering ? (
              <div className="grid gap-4 grid-cols-1">
                {[...Array(SKELETON_COUNT)].map((_, i) => (
                  <PropertyCardSkeleton key={i} variant="horizontal" />
                ))}
              </div>
            ) : displayProperties.length === 0 ? (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 via-white to-gray-50 shadow-sm p-16 text-center border border-gray-100">
                <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none">
                  <defs>
                    <pattern id={copy.dotsId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill={copy.dotsColor} />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#${copy.dotsId})`} />
                </svg>
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-primary-light flex items-center justify-center mb-5 shadow-inner">
                    <SearchX className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-[20px] font-bold text-gray-900 mb-2 text-balance" style={{ fontFamily: 'var(--font-heading)' }}>
                    Không tìm thấy tin đăng
                  </h3>
                  <p className="text-[14px] text-gray-500 mb-6 max-w-md mx-auto leading-relaxed">{copy.emptyText}</p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark font-medium text-[14px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg shadow-sm"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            ) : (
              <div ref={listRef} className="grid gap-4 grid-cols-1">
                {displayProperties.map((property, index) => (
                  <div
                    key={property.id}
                    id={`prop-${property.id}`}
                    onMouseEnter={() => setHoveredId(property.id)}
                    onMouseLeave={() => setHoveredId((cur) => (cur === property.id ? null : cur))}
                    className={`animate-fade-in-up stagger-${Math.min(index + 1, 8)} opacity-0 rounded-2xl transition-shadow ${
                      String(hoveredId) === String(property.id) ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                  >
                    <PropertyCardHorizontal property={property} />
                  </div>
                ))}
              </div>
            )}

            {displayProperties.length > 0 && (
              <ListingPagination
                currentPage={apiPagination.current_page}
                lastPage={apiPagination.last_page}
                total={apiPagination.total}
                perPage={apiPagination.per_page}
                onChange={changePage}
              />
            )}
          </div>

          {/* Cột phải ~35%: bản đồ luôn hiện, KHÔNG sticky — cuộn theo trang theo yêu cầu khách;
              khi cuộn qua thì nút nổi "Xem bản đồ" đưa về đây. Đồng bộ 2 chiều với danh sách. */}
          <aside
            ref={mapColumnRef}
            // scroll-mt = header sticky 60px + khoảng thở, để nút nổi cuộn về không bị header che đầu bản đồ.
            className="hidden lg:block lg:w-[35%] lg:flex-none h-[calc(100vh-140px)] min-h-[480px] scroll-mt-[76px]"
          >
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-full">
              {pendingBounds && (
                <button
                  type="button"
                  onClick={() => { setBbox(pendingBounds); setPendingBounds(null); setPage(1); }}
                  className="absolute top-3 left-1/2 -translate-x-1/2 z-10 h-9 px-4 rounded-full bg-white text-gray-800 font-semibold text-[13px] flex items-center gap-1.5 shadow-lg border border-gray-200 hover:bg-gray-50"
                >
                  <SearchIcon className="w-4 h-4 text-primary" />
                  Tìm trong khu vực này
                </button>
              )}
              {bbox && (
                <button
                  type="button"
                  onClick={() => { setBbox(null); setPendingBounds(null); setPage(1); }}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 h-8 px-3.5 rounded-full bg-gray-900/85 text-white font-medium text-[12px] flex items-center gap-1.5 shadow-lg hover:bg-gray-900"
                >
                  <X className="w-3.5 h-3.5" />
                  Bỏ lọc theo khu vực
                </button>
              )}

              <PropertyMapView
                properties={displayProperties}
                highlightedId={hoveredId}
                autoFit={!bbox}
                onUserMove={(b) => setPendingBounds(b)}
                onMarkerClick={(id) => {
                  setHoveredId(id);
                  document.getElementById(`prop-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="w-full h-full"
              />
            </div>
          </aside>
        </div>
      </div>

      {/* Nút nổi "Xem bản đồ" — pill cố định giữa cạnh dưới, hiện khi bản đồ đã ra khỏi khung nhìn. */}
      <button
        type="button"
        onClick={jumpToMap}
        aria-hidden={!showMapFab}
        tabIndex={showMapFab ? 0 : -1}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 h-11 px-5 rounded-full bg-primary hover:bg-primary-dark text-white font-semibold text-[14px] flex items-center gap-2 shadow-[0_8px_24px_rgba(16,117,177,0.35)] transition-all duration-300 ${
          showMapFab ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <MapIcon className="w-4 h-4" />
        Xem bản đồ
      </button>

      {/* Mobile: bản đồ mở dạng overlay toàn màn hình. */}
      {mobileMapOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <span className="font-bold text-gray-900">Bản đồ bất động sản</span>
            <button
              type="button"
              onClick={() => setMobileMapOpen(false)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              aria-label="Đóng bản đồ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1">
            <PropertyMapView
              properties={displayProperties}
              highlightedId={hoveredId}
              onMarkerClick={(id) => {
                setHoveredId(id);
                setMobileMapOpen(false);
                // Chờ overlay đóng rồi mới cuộn, không thì cuộn lúc overlay còn che.
                setTimeout(() => {
                  document.getElementById(`prop-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
              }}
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PropertyListingLoading() {
  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 flex gap-6">
        <div className="w-full lg:w-[65%]">
          <div className="h-10 w-1/3 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 gap-4">
            {[...Array(SKELETON_COUNT)].map((_, i) => (
              <PropertyCardSkeleton key={i} variant="horizontal" />
            ))}
          </div>
        </div>
        <div className="hidden lg:block lg:w-[35%] bg-gray-200 rounded-2xl h-[calc(100vh-140px)] animate-pulse" />
      </div>
    </div>
  );
}

export function PropertyListingPage({ type }: { type: ListingType }) {
  return (
    <Suspense fallback={<PropertyListingLoading />}>
      <PropertyListingContent type={type} />
    </Suspense>
  );
}
