'use client';

import { Suspense, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { PropertyCard } from '@/components/property/PropertyCard';
import { FilterSidebar, FilterState, DEFAULT_FILTERS } from '@/components/search/FilterSidebar';
import { SortBar } from '@/components/search/SortBar';
import { FilterTags } from '@/components/shared/FilterTags';
import { PropertyCardSkeleton } from '@/components/property/PropertyCardSkeleton';
import { filterProperties, buildFilterTags, removeTag } from '@/lib/filter-properties';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SearchX, ChevronRight, Home, SlidersHorizontal } from 'lucide-react';

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
    id: '1',
    title: 'Căn hộ cao cấp 2PN view biển Mỹ Khê',
    slug: 'can-ho-cao-cap-2pn-view-bien-my-khe',
    price: 2800000000,
    priceUnit: 'total',
    area: 75,
    type: 'sale',
    category: 'Căn hộ',
    thumbnail: '/images/image_data/Haus-Coastal.jpg',
    location: 'TP Quảng Ngãi, Quảng Ngãi',
    bedrooms: 2,
    bathrooms: 2,
    isVip: 'vip',
    user: { name: 'Nguyễn Văn A', avatar: null },
  },
  {
    id: '2',
    title: 'Nhà mặt phố 4 tầng mặt tiền 5m Quang Trung',
    slug: 'nha-mat-pho-4-tang-mat-tien-5m-quang-trung',
    price: 6500000000,
    priceUnit: 'total',
    area: 120,
    type: 'sale',
    category: 'Nhà phố',
    thumbnail: '/images/image_data/nha-pho-de-palace-river.jpg',
    location: 'TP Quảng Ngãi, Quảng Phú',
    bedrooms: 5,
    bathrooms: 4,
    isVip: 'vip_plus',
    user: { name: 'Trần Thị B', avatar: null },
  },
  {
    id: '3',
    title: 'Đất nền dự án ven biển 500m2 có sổ đỏ',
    slug: 'dat-nen-du-an-ven-bien-500m2-co-so-do',
    price: 1800000000,
    priceUnit: 'total',
    area: 500,
    type: 'sale',
    category: 'Đất nền',
    thumbnail: '/images/image_data/shutterstock2065827521lyson-1701400873758.jpg',
    location: 'TP Quảng Ngãi, Tịnh An',
    bedrooms: 0,
    bathrooms: 0,
    isVip: 'diamond',
    user: { name: 'Lê Văn C', avatar: null },
  },
  {
    id: '4',
    title: 'Villa 3 tầng view biển 300m2 có hồ bơi',
    slug: 'villa-3-tang-view-bien-300m2-co-ho-boi',
    price: 15000000000,
    priceUnit: 'total',
    area: 300,
    type: 'sale',
    category: 'Biệt thự',
    thumbnail: '/images/image_data/nha-pho-de-palace-river.jpg',
    location: 'TP Quảng Ngãi, Tịnh Hà',
    bedrooms: 4,
    bathrooms: 5,
    isVip: 'diamond',
    user: { name: 'Hoàng Văn E', avatar: null },
  },
  {
    id: '5',
    title: 'Căn hộ 2PN chung cư Vincom diện tích 85m2',
    slug: 'can-ho-2pn-chung-cu-vincom-dien-tich-85m2',
    price: 3500000000,
    priceUnit: 'total',
    area: 85,
    type: 'sale',
    category: 'Căn hộ',
    thumbnail: '/images/image_data/Starlight---suc-hut-den-tu-vi-tri-dac-dia-nhat-trung-tam-Quang-Ngai-suc-hut-3-1733900371-424-width1000height563.jpg',
    location: 'TP Quảng Ngãi, Trần Phú',
    bedrooms: 2,
    bathrooms: 2,
    isVip: 'vip',
    user: { name: 'Vũ Thị F', avatar: null },
  },
];

function PropertyListingContent() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isFiltering, setIsFiltering] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sort, setSort] = useState('newest');

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
    setIsFiltering(true);
    setTimeout(() => setIsFiltering(false), 300);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const applyFilters = useCallback(() => {
    // Filters are applied reactively
  }, []);

  // Compute active filter tags from filter state
  const activeTags = useMemo(() => buildFilterTags(filters), [filters]);

  const handleRemoveTag = useCallback((tagId: string) => {
    setFilters(prev => ({ ...prev, ...removeTag(prev, tagId) }));
  }, []);

  const clearAllTags = useCallback(() => resetFilters(), [resetFilters]);

  // Filtered properties
  const filteredProperties = useMemo(() => filterProperties(mockProperties, filters), [filters]);

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="max-w-[1200px] mx-auto px-4">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-4 font-medium">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900">Mua bán nhà đất</span>
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
            Mua bán nhà đất tại Quảng Ngãi
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">
            {filteredProperties.length} bất động sản đang rao bán
          </p>
        </div>

        {/* Mobile filter trigger — sticky top */}
        <div className="lg:hidden sticky top-[64px] z-20 bg-white border-b border-gray-100 px-4 py-2.5 flex items-center gap-2 shadow-sm -mx-4">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Lọc
            {activeTags.length > 0 && (
              <span className="bg-primary text-white text-[11px] rounded-full px-1.5">{activeTags.length}</span>
            )}
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 border border-gray-200 rounded-lg px-3 text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-[3px] focus:ring-primary/15 focus:border-primary bg-white"
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="area_desc">Diện tích lớn nhất</option>
          </select>
        </div>

        <div className="flex gap-8 items-start">

          {/* Left Sidebar Filters — desktop only */}
          <div className="hidden lg:block">
            <FilterSidebar
              filters={filters}
              onFilterChange={updateFilters}
              onApply={applyFilters}
              onReset={resetFilters}
            />
          </div>

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

            {/* Sort & Filters Toolbar */}
            <div className="sticky top-[64px] lg:top-0 z-10 bg-gray-50 pb-3 pt-1 mb-3">
              <SortBar viewMode={viewMode} onViewModeChange={setViewMode} totalResults={filteredProperties.length} />
              {activeTags.length > 0 && (
                <div className="mt-2">
                  <FilterTags
                    tags={activeTags}
                    onRemove={handleRemoveTag}
                    onClearAll={clearAllTags}
                  />
                </div>
              )}
            </div>

            {/* Properties Grid */}
            {isLoading || isFiltering ? (
              <div className={viewMode === 'grid'
                ? 'grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5'
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
                    <pattern id="empty-dots-sale" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="#1075b1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#empty-dots-sale)" />
                </svg>
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-5 shadow-inner">
                    <SearchX className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-[20px] font-bold text-gray-900 mb-2 text-balance" style={{ fontFamily: 'var(--font-heading)' }}>
                    Không tìm thấy tin đăng
                  </h3>
                  <p className="text-[14px] text-gray-500 mb-6 max-w-md mx-auto leading-relaxed">
                    Không có bất động sản nào phù hợp với bộ lọc của bạn. Thử thay đổi bộ lọc để xem thêm kết quả.
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
                ? 'grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5'
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

          {/* Right sidebar — quick filter links (desktop only) */}
          <aside className="hidden xl:block w-[200px] shrink-0 pt-1">
            <div className="sticky top-6 space-y-6">
              <div>
                <h4 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2">Lọc theo khoảng giá</h4>
                <ul className="space-y-1">
                  {[
                    'Dưới 500 triệu',
                    '500 triệu - 1 tỷ',
                    '1 - 2 tỷ',
                    '2 - 5 tỷ',
                    '5 - 10 tỷ',
                    '10 - 30 tỷ',
                    'Trên 30 tỷ',
                  ].map((label) => (
                    <li key={label}>
                      <button className="text-[13px] text-gray-600 hover:text-primary hover:underline transition-colors text-left w-full py-0.5">
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2">Lọc theo diện tích</h4>
                <ul className="space-y-1">
                  {[
                    'Dưới 30 m²',
                    '30 - 50 m²',
                    '50 - 80 m²',
                    '80 - 100 m²',
                    '100 - 150 m²',
                    '150 - 200 m²',
                    'Trên 200 m²',
                  ].map((label) => (
                    <li key={label}>
                      <button className="text-[13px] text-gray-600 hover:text-primary hover:underline transition-colors text-left w-full py-0.5">
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

        </div>
      </div>
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

export default function MuaBanPage() {
  return (
    <Suspense fallback={<PropertyListingLoading />}>
      <PropertyListingContent />
    </Suspense>
  );
}
