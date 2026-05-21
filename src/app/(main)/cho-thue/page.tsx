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

  const applyFilters = useCallback(() => {}, []);

  const activeTags = useMemo(() => buildFilterTags(filters), [filters]);

  const handleRemoveTag = useCallback((tagId: string) => {
    setFilters(prev => ({ ...prev, ...removeTag(prev, tagId) }));
  }, []);

  const clearAllTags = useCallback(() => resetFilters(), [resetFilters]);

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
          <span className="text-gray-900">Cho thuê nhà đất</span>
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
            Cho thuê nhà đất tại Quảng Ngãi
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">
            {filteredProperties.length} bất động sản đang cho thuê
          </p>
        </div>

        {/* Mobile filter trigger */}
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
              <SortBar viewMode={viewMode} onViewModeChange={setViewMode} totalResults={filteredProperties.length} sort={sort} onSortChange={setSort} />
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
                    'Thỏa thuận',
                    'Dưới 3 triệu',
                    '3 - 5 triệu',
                    '5 - 10 triệu',
                    '10 - 20 triệu',
                    '20 - 50 triệu',
                    'Trên 50 triệu',
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

export default function ChoThuePage() {
  return (
    <Suspense fallback={<PropertyListingLoading />}>
      <PropertyListingContent />
    </Suspense>
  );
}
