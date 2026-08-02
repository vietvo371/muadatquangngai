'use client';

import { Suspense, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { PropertyCard } from '@/components/property/PropertyCard';
import { FilterSidebar, FilterState, DEFAULT_FILTERS } from '@/components/search/FilterSidebar';
import { FilterHorizontal } from '@/components/search/FilterHorizontal';
import { SortBar } from '@/components/search/SortBar';
import { FilterTags } from '@/components/shared/FilterTags';
import { PropertyCardSkeleton } from '@/components/property/PropertyCardSkeleton';
import { buildFilterTags, removeTag } from '@/lib/filter-properties';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SearchX, Search as SearchIcon, ChevronRight, ChevronLeft, Home, MapPin, Bell, X } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import { Switch } from '@/components/ui/switch';

// Bản đồ Goong nạp phía client (feedback "Tìm trên bản đồ" — split-view list + bản đồ).
const PropertyMapView = dynamic(
  () => import('@/components/map/PropertyMapView').then((m) => m.PropertyMapView),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-sm text-gray-400">Đang tải bản đồ...</div>,
  }
);
import { CONFIG } from '@/lib/config';
import { useProperties } from '@/hooks/useProperties';
import { parseFiltersFromSearchParams, buildSearchParamsFromState } from '@/lib/filter-url-sync';

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
    latitude: apiProp.location?.latitude != null ? Number(apiProp.location.latitude) : null,
    longitude: apiProp.location?.longitude != null ? Number(apiProp.location.longitude) : null,
    bedrooms: Number(apiProp.bedrooms || 0),
    bathrooms: Number(apiProp.bathrooms || 0),
    facade: apiProp.facade != null ? Number(apiProp.facade) : null,
    isVip: apiProp.is_vip || 'normal',
    user: {
      name: apiProp.owner?.name || 'Môi giới',
      avatar: apiProp.owner?.avatar || null,
    },
    created_at: apiProp.created_at,
    views: apiProp.view_count || 0,
  };
};




function PropertyListingContent() {
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() || '/cho-thue';
  // Chế độ bản đồ bật/tắt bằng nút "Xem bản đồ" (như batdongsan ?tpl=map) — mặc định tắt.
  const [mapMode, setMapMode] = useState(searchParams?.get('tpl') === 'map');
  const [bbox, setBbox] = useState<import('@/components/map/PropertyMapView').MapBounds | null>(null);
  const [pendingBounds, setPendingBounds] = useState<import('@/components/map/PropertyMapView').MapBounds | null>(null);

  // Real API integration state
  const { fetchProperties, isLoading: isApiLoading } = useProperties();
  const [apiProperties, setApiProperties] = useState<any[]>([]);
  const [apiPagination, setApiPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 6,
    total: 0,
  });

  // Toàn bộ filter/search/sort/page khởi tạo từ URL (F5, chia sẻ link, back/forward đều giữ
  // đúng kết quả đã lọc) — xem src/lib/filter-url-sync.ts.
  const initialUrlState = useMemo(() => parseFiltersFromSearchParams(searchParams), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [page, setPage] = useState(initialUrlState.page);
  const [useRealApi, setUseRealApi] = useState(true);

  const [filters, setFilters] = useState<FilterState>(initialUrlState.filters);
  const [searchQuery, setSearchQuery] = useState(initialUrlState.searchQuery);
  const [isFiltering, setIsFiltering] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sort, setSort] = useState(initialUrlState.sort);
  const [slide, setSlide] = useState(0);
  const [receiveEmail, setReceiveEmail] = useState(false);

  // Đọc lại filter từ URL mỗi khi query đổi do điều hướng bên ngoài (click menu danh mục con ở
  // header, nút back/forward) — component không remount nên cần effect riêng, không chỉ dựa vào
  // giá trị khởi tạo ở trên.
  useEffect(() => {
    const next = parseFiltersFromSearchParams(searchParams);
    setFilters(next.filters);
    setSearchQuery(next.searchQuery);
    setSort(next.sort);
    setPage(next.page);
  }, [searchParams]);

  // Ghi filter/search/sort/page hiện tại vào URL. So sánh nội dung với URL thật hiện tại trước
  // khi replace — tự chặn vòng lặp với effect đọc URL ở trên (round đó chỉ set lại state y hệt
  // nên qs dựng ra sẽ khớp searchParams hiện tại, effect này bỏ qua thay vì replace lần nữa).
  useEffect(() => {
    const qs = buildSearchParamsFromState({ filters, searchQuery, sort, page }).toString();
    if (qs === (searchParams?.toString() ?? '')) return;
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchQuery, sort, page]);

  // Fetch real properties from the API
  useEffect(() => {
    const loadProperties = async () => {
      let sortParam = 'newest';
      if (sort === 'newest') sortParam = 'newest';
      else if (sort === 'oldest') sortParam = 'oldest';
      else if (sort === 'price_asc') sortParam = 'price_asc';
      else if (sort === 'price_desc') sortParam = 'price_desc';
      else if (sort === 'area_asc') sortParam = 'area_asc';
      else if (sort === 'area_desc') sortParam = 'area_desc';

      const apiFilters: any = {
        type: 'rent',
        page,
        per_page: bbox ? 60 : 6,
        sort: sortParam,
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
      if (res.success && res.data) {
        setApiProperties(res.data.map(mapApiProperty));
        if (res.meta) {
          setApiPagination({
            current_page: res.meta.current_page || 1,
            last_page: res.meta.last_page || 1,
            per_page: res.meta.per_page || 6,
            total: res.meta.total || 0,
          });
        }
        setUseRealApi(true);
      } else {
        setUseRealApi(false);
      }
    };

    loadProperties();
  }, [page, filters, sort, bbox, fetchProperties]);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
    setPage(1); // Reset page on filter change
    setIsFiltering(true);
    setTimeout(() => setIsFiltering(false), 300);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const activeTags = useMemo(() => buildFilterTags(filters), [filters]);

  const handleRemoveTag = useCallback((tagId: string) => {
    setFilters(prev => ({ ...prev, ...removeTag(prev, tagId) }));
    setPage(1);
  }, []);

  const clearAllTags = useCallback(() => resetFilters(), [resetFilters]);

  // CHỈ hiển thị tin THẬT từ API (xem ghi chú cùng chỗ ở /mua-ban).
  const displayProperties = apiProperties;

  const isLoading = isApiLoading;

  // Tin VIP cho hero slider — cũng chỉ lấy từ dữ liệu thật.
  const sliderProperties = useMemo(() => {
    if (!CONFIG.enableVip) return [];
    return apiProperties.filter(p => p.isVip !== 'normal');
  }, [apiProperties]);


  // Automatic slide rotation
  useEffect(() => {
    if (sliderProperties.length <= 1) return;
    const timer = setInterval(() => {
      setSlide((s) => (s + 1) % sliderProperties.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [sliderProperties.length]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ══ HERO SLIDER ══ (ẩn ở chế độ bản đồ để dành toàn màn hình) */}
      {!mapMode && sliderProperties.length > 0 && (
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
                style={{
                  transform: i === slide ? 'scale(1.05)' : 'scale(1)',
                }}
                priority={i === 0}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Slide content */}
              <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-8 md:pb-10 z-10">
                <div className="max-w-[1200px] mx-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2.5 bg-cta text-white shadow-md">
                    ★ {p.isVip === 'diamond' ? 'DIAMOND' : p.isVip === 'vip_plus' ? 'VIP+' : 'VIP'}
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
                      Giá: <span className="text-yellow-400 font-extrabold text-base">{formatPrice(p.price)}</span>
                    </p>
                    <span className="text-white/30 hidden sm:inline">|</span>
                    <p className="font-semibold text-white">
                      Diện tích: <span className="text-yellow-400 font-extrabold text-base">{p.area} m²</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Arrows */}
          {sliderProperties.length > 1 && (
            <>
              <button
                onClick={() => setSlide((s) => (s - 1 + sliderProperties.length) % sliderProperties.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all hover:scale-105"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setSlide((s) => (s + 1) % sliderProperties.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all hover:scale-105"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Dots */}
          {sliderProperties.length > 1 && (
            <div className="absolute bottom-4 right-6 md:right-10 z-20 flex items-center gap-1.5">
              {sliderProperties.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === slide ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chế độ bản đồ: full-bleed (bỏ max-w) để list + bản đồ chiếm gần trọn màn hình. */}
      <div className={mapMode ? 'w-full px-3 py-3' : 'max-w-[1200px] mx-auto px-4 py-6'}>
        {/* Horizontal Search & Filters */}
        <FilterHorizontal
          filters={filters}
          onFilterChange={updateFilters}
          onReset={resetFilters}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          context="rent"
        />

        <div className={`flex gap-6 items-start ${mapMode ? 'h-[calc(100vh-150px)]' : ''}`}>
          {/* Mobile Filter Sheet */}
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetContent side="left" className="w-[300px] p-0 overflow-y-auto">
              <SheetHeader className="px-4 py-3 border-b border-gray-100">
                <SheetTitle className="text-[15px] font-bold text-gray-900">Bộ lọc tìm kiếm</SheetTitle>
              </SheetHeader>
              <div className="p-4">
                <FilterSidebar
                  filters={filters}
                  onFilterChange={(updates) => { updateFilters(updates); }}
                  context="rent"
                  onApply={() => setMobileFilterOpen(false)}
                  onReset={() => { resetFilters(); setMobileFilterOpen(false); }}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Main Content — khi bật bản đồ, cột danh sách co lại + cuộn riêng. */}
          <div className={`min-w-0 ${mapMode ? 'lg:w-[40%] lg:flex-none w-full h-full overflow-y-auto pr-1' : 'flex-1'}`}>
            {/* Breadcrumb (Nested Inside Left Column) */}
            <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-3.5 font-medium">
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                Trang chủ
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-900">Cho thuê nhà đất</span>
            </div>

            {/* Page Header (Nested Inside Left Column) */}
            <div className="mb-5">
              <h1 className="text-[22px] font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                Cho thuê nhà đất tại Quảng Ngãi
              </h1>
              <p className="text-[14px] text-gray-500 mt-1">
                Hiện có {useRealApi ? apiPagination.total : displayProperties.length} bất động sản.
              </p>
            </div>

            {/* Email Notification & Sort Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 pb-3 border-b border-gray-150">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0 relative">
                  <Bell className="w-4 h-4 fill-white" />
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-550 rounded-full border border-white" />
                </div>
                <span className="text-[13px] font-semibold text-gray-750">Nhận email tin mới</span>
                <Switch
                  checked={receiveEmail}
                  onCheckedChange={setReceiveEmail}
                  className="data-[state=checked]:bg-primary scale-90"
                />
              </div>

              <div className="flex-1 sm:flex-none">
                <SortBar
                  totalResults={useRealApi ? apiPagination.total : displayProperties.length}
                  sort={sort}
                  onSortChange={setSort}
                  mapMode={mapMode}
                  onToggleMap={() => setMapMode((v) => !v)}
                />
              </div>
            </div>

            {/* Active Tags Toolbar */}
            {activeTags.length > 0 && (
              <div className="mb-4">
                <FilterTags
                  tags={activeTags}
                  onRemove={handleRemoveTag}
                  onClearAll={clearAllTags}
                />
              </div>
            )}

            {/* Danh sách BĐS — một giao diện lưới thống nhất. Khi bật bản đồ, co về 1 cột. */}
            {isLoading || isFiltering ? (
              <div className={`grid gap-5 ${mapMode ? 'grid-cols-1 xl:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                {[...Array(6)].map((_, i) => (
                  <PropertyCardSkeleton key={i} variant="grid" />
                ))}
              </div>
            ) : displayProperties.length === 0 ? (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 via-white to-gray-50 shadow-sm p-16 text-center border border-gray-100">
                {/* Decorative dots */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none">
                  <defs>
                    <pattern id="empty-dots-rent" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="#e03131" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#empty-dots-rent)" />
                </svg>
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-5 shadow-inner">
                    <SearchX className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-[20px] font-bold text-gray-900 mb-2 text-balance" style={{ fontFamily: 'var(--font-heading)' }}>
                    Không tìm thấy tin đăng
                  </h3>
                  <p className="text-[14px] text-gray-500 mb-6 max-w-md mx-auto leading-relaxed">
                    Không có bất động sản cho thuê nào phù hợp với bộ lọc của bạn. Thử thay đổi bộ lọc để xem thêm kết quả.
                  </p>
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark font-medium text-[14px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg shadow-sm"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            ) : (
              <div ref={listRef} className={`grid gap-5 ${mapMode ? 'grid-cols-1 xl:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
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
                    <PropertyCard property={property} variant="default" />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {displayProperties.length > 0 && (useRealApi ? apiPagination.last_page > 1 : false) && (
              <div className="flex justify-center mt-10">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={apiPagination.current_page === 1}
                    className={`w-9 h-9 rounded-lg border border-gray-200 text-gray-700 flex items-center justify-center transition-colors ${
                      apiPagination.current_page === 1 ? 'cursor-not-allowed text-gray-300 border-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  {(() => {
                    const pages = [];
                    const currentPage = apiPagination.current_page;
                    const lastPage = apiPagination.last_page;
                    
                    if (lastPage <= 5) {
                      for (let i = 1; i <= lastPage; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      const start = Math.max(2, currentPage - 1);
                      const end = Math.min(lastPage - 1, currentPage + 1);
                      if (start > 2) pages.push('...');
                      for (let i = start; i <= end; i++) pages.push(i);
                      if (end < lastPage - 1) pages.push('...');
                      pages.push(lastPage);
                    }
                    
                    return pages.map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-gray-400 font-medium">
                            …
                          </span>
                        );
                      }
                      
                      const isCurrent = p === currentPage;
                      return (
                        <button
                          key={`page-${p}`}
                          onClick={() => setPage(Number(p))}
                          className={`w-9 h-9 rounded-lg font-medium transition-colors ${
                            isCurrent
                              ? 'bg-primary text-white font-semibold shadow-sm'
                              : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    });
                  })()}

                  <button
                    onClick={() => setPage(p => Math.min(p + 1, apiPagination.last_page))}
                    disabled={apiPagination.current_page === apiPagination.last_page}
                    className={`w-9 h-9 rounded-lg border border-gray-200 text-gray-700 flex items-center justify-center transition-colors ${
                      apiPagination.current_page === apiPagination.last_page ? 'cursor-not-allowed text-gray-300 border-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bản đồ — CHỈ hiện khi bật chế độ bản đồ bằng nút "Xem bản đồ" (như batdongsan
              ?tpl=map). Đồng bộ 2 chiều với danh sách. Dùng Goong, KHÔNG dùng Leaflet cũ. */}
          {mapMode && (
            <aside className="hidden lg:block flex-1 shrink-0 h-full">
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-full">
                <button
                  type="button"
                  onClick={() => setMapMode(false)}
                  className="absolute top-3 right-3 z-10 h-9 px-3.5 rounded-lg bg-[#12a5a5] hover:bg-[#0e8f8f] text-white font-semibold text-[13px] flex items-center gap-1.5 shadow-md"
                >
                  <X className="w-4 h-4" />
                  Đóng bản đồ
                </button>

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
          )}
        </div>
      </div>

      {/* Mobile: chế độ bản đồ mở dạng overlay toàn màn hình. */}
      {mapMode && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <span className="font-bold text-gray-900">Bản đồ bất động sản</span>
            <button type="button" onClick={() => setMapMode(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" aria-label="Đóng bản đồ">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1">
            <PropertyMapView
              properties={displayProperties}
              highlightedId={hoveredId}
              onMarkerClick={(id) => setHoveredId(id)}
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
      <div className="max-w-[1200px] mx-auto px-4 flex gap-8">
        <div className="w-[260px] hidden lg:block bg-gray-200 rounded-2xl h-[500px] animate-pulse" />
        <div className="flex-1">
          <div className="h-10 w-1/3 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChoThuePage() {
  return (
    <Suspense fallback={<PropertyListingLoading />}>
      <PropertyListingContent />
    </Suspense>
  );
}
