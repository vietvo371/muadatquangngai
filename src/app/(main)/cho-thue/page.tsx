'use client';

import { Suspense, useState, useMemo, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PropertyCard } from '@/components/property/PropertyCard';
import { FilterSidebar, FilterState, DEFAULT_FILTERS } from '@/components/search/FilterSidebar';
import { FilterHorizontal } from '@/components/search/FilterHorizontal';
import { SortBar } from '@/components/search/SortBar';
import { FilterTags } from '@/components/shared/FilterTags';
import { PropertyCardSkeleton } from '@/components/property/PropertyCardSkeleton';
import { filterProperties, buildFilterTags, removeTag } from '@/lib/filter-properties';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SearchX, ChevronRight, ChevronLeft, Home, MapPin, Bell } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import { ContactDialog } from '@/components/shared/ContactDialog';
import { Switch } from '@/components/ui/switch';
import { CONFIG } from '@/lib/config';

const QUICK_PRICE_PRESETS_RENT = [
  { label: 'Thỏa thuận', min: '', max: '' },
  { label: 'Dưới 2 triệu', min: '', max: 2000000 },
  { label: '2 - 5 triệu', min: 2000000, max: 5000000 },
  { label: '5 - 10 triệu', min: 5000000, max: 10000000 },
  { label: 'Trên 10 triệu', min: 10000000, max: '' },
];

const QUICK_AREA_PRESETS = [
  { label: 'Dưới 30 m²', min: '', max: 30 },
  { label: '30 - 50 m²', min: 30, max: 50 },
  { label: '50 - 80 m²', min: 50, max: 80 },
  { label: '80 - 100 m²', min: 80, max: 100 },
  { label: 'Trên 100 m²', min: 100, max: '' },
];


interface MockProperty {
  id: string;
  title: string;
  slug: string;
  price: number;
  priceUnit: 'total' | 'per_m2' | 'per_month';
  area: number;
  type: 'sale' | 'rent';
  category: string;
  thumbnail: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  isVip: 'normal' | 'vip' | 'vip_plus' | 'diamond';
  user: { name: string; avatar: string | null };
}

const mockProperties: MockProperty[] = [
  {
    id: '4',
    title: 'Căn hộ chung cư mini cho thuê 35m2 đầy đủ nội thất',
    slug: 'can-ho-chung-cu-mini-cho-thue-35m2-day-du-noi-that',
    price: 5000000,
    priceUnit: 'per_month',
    area: 35,
    type: 'rent',
    category: 'Căn hộ',
    thumbnail: '/images/image_data/Haus-Coastal.jpg',
    location: 'TP Quảng Ngãi, Trần Phú',
    bedrooms: 1,
    bathrooms: 1,
    isVip: 'vip',
    user: { name: 'Phạm Thị D', avatar: null },
  },
  {
    id: '7',
    title: 'Nhà trọ 1PN cho thuê 20m2 gần trường đại học',
    slug: 'nha-tro-1pn-cho-thue-20m2-gan-truong-dai-hoc',
    price: 2000000,
    priceUnit: 'per_month',
    area: 20,
    type: 'rent',
    category: 'Nhà phố',
    thumbnail: '/images/image_data/nha-pho-de-palace-river.jpg',
    location: 'TP Quảng Ngãi, Trần Phú',
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
    type: 'rent',
    category: 'Mặt bằng kinh doanh',
    thumbnail: '/images/image_data/du-lich-binh-son-quang-ngai-phan-van-travel-1.webp',
    location: 'TP Quảng Ngãi, Lê Lợi',
    bedrooms: 0,
    bathrooms: 1,
    isVip: 'vip_plus',
    user: { name: 'Trần Văn F', avatar: null },
  },
  {
    id: '9',
    title: 'Mặt bằng kinh doanh 80m2 mặt tiền đường lớn',
    slug: 'mat-bang-kinh-doanh-80m2-mat-tien-duong-lon',
    price: 30000000,
    priceUnit: 'per_month',
    area: 80,
    type: 'rent',
    category: 'Mặt bằng kinh doanh',
    thumbnail: '/images/image_data/shutterstock2065827521lyson-1701400873758.jpg',
    location: 'TP Quảng Ngãi, Nghĩa Lộ',
    bedrooms: 0,
    bathrooms: 1,
    isVip: 'diamond',
    user: { name: 'Lê Thị G', avatar: null },
  },
];

function PropertyListingContent() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sort, setSort] = useState('newest');
  const [slide, setSlide] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [receiveEmail, setReceiveEmail] = useState(false);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
    setIsFiltering(true);
    setTimeout(() => setIsFiltering(false), 300);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);


  const activeTags = useMemo(() => buildFilterTags(filters), [filters]);

  const handleRemoveTag = useCallback((tagId: string) => {
    setFilters(prev => ({ ...prev, ...removeTag(prev, tagId) }));
  }, []);

  const clearAllTags = useCallback(() => resetFilters(), [resetFilters]);

  const filteredProperties = useMemo(() => {
    let res = filterProperties(mockProperties, filters);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      res = res.filter(p => p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q));
    }
    return res;
  }, [filters, searchQuery]);

  // VIP Properties for Hero Slider & Featured Sidebar
  const sliderProperties = useMemo(() => {
    if (!CONFIG.enableVip) return [];
    return mockProperties.filter(p => p.isVip !== 'normal');
  }, []);

  const featuredProperties = useMemo(() => {
    if (CONFIG.enableVip) {
      return mockProperties.filter(p => p.isVip !== 'normal').slice(0, 5);
    }
    // Return top properties sorted by views
    return [...mockProperties]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
  }, []);

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
      {/* ══ HERO SLIDER ══ */}
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
                  <Link href={`/${p.type === 'sale' ? 'mua-ban' : 'cho-thue'}/${p.slug}`}>
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

      <div className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Horizontal Search & Filters */}
        <FilterHorizontal
          filters={filters}
          onFilterChange={updateFilters}
          onReset={resetFilters}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />

        <div className="flex gap-8 items-start">
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
                  onApply={() => setMobileFilterOpen(false)}
                  onReset={() => { resetFilters(); setMobileFilterOpen(false); }}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
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
                Hiện có {filteredProperties.length} bất động sản.
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
                  viewMode={viewMode} 
                  onViewModeChange={setViewMode} 
                  totalResults={filteredProperties.length}
                  sort={sort}
                  onSortChange={setSort}
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

            {/* Properties Grid */}
            {isLoading || isFiltering ? (
              <div className={viewMode === 'grid'
                ? 'grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-5'
                : 'space-y-4'
              }>
                {[...Array(6)].map((_, i) => (
                  <PropertyCardSkeleton key={i} variant={viewMode} />
                ))}
              </div>
            ) : filteredProperties.length === 0 ? (
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
              <div className={viewMode === 'grid'
                ? 'grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-5'
                : 'space-y-4'
              }>
                {filteredProperties.map((property, index) => (
                  <div
                    key={property.id}
                    className={`animate-fade-in-up stagger-${Math.min(index + 1, 8)} opacity-0`}
                  >
                    <PropertyCard property={property} variant={viewMode === 'grid' ? 'default' : 'compact'} />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredProperties.length > 0 && (
              <div className="flex justify-center mt-10">
                <div className="flex items-center gap-1.5">
                  <button className="w-9 h-9 rounded-lg border border-gray-200 text-gray-400 flex items-center justify-center cursor-not-allowed">
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </button>
                  <button className="w-9 h-9 rounded-lg bg-primary text-white font-medium shadow-sm">1</button>
                  <button className="w-9 h-9 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">2</button>
                  <button className="w-9 h-9 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">3</button>
                  <button className="w-9 h-9 rounded-lg text-gray-400 font-medium" disabled>…</button>
                  <button className="w-9 h-9 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">10</button>
                  <button className="w-9 h-9 rounded-lg border border-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar — Featured properties, CTA, and Quick filters (desktop only) */}
          <aside className="hidden xl:block w-64 shrink-0 space-y-6 sticky top-[80px]">
            {/* Lọc theo khoảng giá */}
            <div className="bg-white rounded-2xl border border-gray-105 p-4 shadow-sm">
              <h3 className="text-[14px] font-bold text-gray-800 tracking-tight mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                Lọc theo khoảng giá
              </h3>
              <div className="flex flex-col gap-2">
                {QUICK_PRICE_PRESETS_RENT.map((preset) => {
                  const isSel = filters.priceMin === preset.min && filters.priceMax === preset.max;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => updateFilters({ priceMin: preset.min, priceMax: preset.max })}
                      className={`text-left text-[13px] py-0.5 transition-colors hover:text-primary ${
                        isSel ? 'text-primary font-bold' : 'text-gray-600 font-medium'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lọc theo diện tích */}
            <div className="bg-white rounded-2xl border border-gray-105 p-4 shadow-sm">
              <h3 className="text-[14px] font-bold text-gray-800 tracking-tight mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                Lọc theo diện tích
              </h3>
              <div className="flex flex-col gap-2">
                {QUICK_AREA_PRESETS.map((preset) => {
                  const isSel = filters.areaMin === preset.min && filters.areaMax === preset.max;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => updateFilters({ areaMin: preset.min, areaMax: preset.max })}
                      className={`text-left text-[13px] py-0.5 transition-colors hover:text-primary ${
                        isSel ? 'text-primary font-bold' : 'text-gray-600 font-medium'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tin đăng nổi bật */}
            {featuredProperties.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-1 h-4 bg-primary rounded-full" />
                  <h3 className="text-[14px] font-bold text-gray-800 tracking-tight">Tin đăng nổi bật</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {featuredProperties.map((property) => (
                    <Link
                      key={property.id}
                      href={`/${property.type === 'sale' ? 'mua-ban' : 'cho-thue'}/${property.slug}`}
                      className="flex gap-3 p-3.5 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="relative w-20 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-50">
                        <Image
                          src={property.thumbnail}
                          alt={property.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="80px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition-colors leading-snug mb-1">
                          {property.title}
                        </p>
                        <div className="flex items-center gap-2 justify-between mt-1">
                          <p className="text-[13px] font-black text-cta">{formatPrice(property.price)}</p>
                          <p className="text-[11px] font-medium text-gray-400">{property.area} m²</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA tư vấn */}
            <div className="bg-primary rounded-2xl p-5 text-white shadow-md relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/15 transition-all" />
              <div className="absolute -left-6 -top-6 w-20 h-20 bg-white/5 rounded-full blur-lg" />
              
              <div className="relative z-10">
                <h3 className="text-[15px] font-black mb-1.5 tracking-tight">Ký gửi & Tư vấn</h3>
                <p className="text-[12px] text-white/80 mb-4 leading-relaxed">
                  Bạn muốn bán, cho thuê hoặc tìm mua bất động sản tại Quảng Ngãi? Liên hệ ngay!
                </p>
                <button
                  onClick={() => setContactOpen(true)}
                  className="block w-full text-center bg-white text-primary text-[13px] font-bold py-2 rounded-xl hover:bg-primary-light transition-all shadow-sm active:scale-95"
                >
                  Gửi yêu cầu ngay
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} />
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
