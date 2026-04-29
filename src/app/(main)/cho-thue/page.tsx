'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/search/SearchBar';
import { PropertyCard } from '@/components/property/PropertyCard';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PropertyCardSkeleton } from '@/components/property/PropertyCardSkeleton';
import {
  Filter,
  Grid3X3,
  List,
  MapPin,
  Home,
  Building,
  Map,
  ArrowRight,
} from 'lucide-react';

const mockProperties = [
  {
    id: '4',
    title: 'Căn hộ chung cư mini cho thuê 35m2 đầy đủ nội thất',
    slug: 'can-ho-chung-cu-mini-cho-thue-35m2-day-du-noi-that',
    price: 5000000,
    priceUnit: 'per_month' as const,
    area: 35,
    type: 'rent' as const,
    thumbnail: '/images/image_data/Haus-Coastal.jpg',
    location: 'Quảng Ngãi, Trần Phú',
    bedrooms: 1,
    bathrooms: 1,
    isVip: 'vip' as const,
    user: { name: 'Phạm Thị D', avatar: null },
  },
  {
    id: '7',
    title: 'Nhà trọ 1PN cho thuê 20m2 gần trường đại học',
    slug: 'nha-tro-1pn-cho-thue-20m2-gan-truong-dai-hoc',
    price: 2000000,
    priceUnit: 'per_month' as const,
    area: 20,
    type: 'rent' as const,
    thumbnail: '/images/image_data/nha-pho-de-palace-river.jpg',
    location: 'Quảng Ngãi, Trần Phú',
    bedrooms: 1,
    bathrooms: 1,
    isVip: 'normal' as const,
    user: { name: 'Nguyễn Văn E', avatar: null },
  },
  {
    id: '8',
    title: 'Văn phòng cho thuê 50m2 tại trung tâm thành phố',
    slug: 'van-phong-cho-thue-50m2-tai-trung-tam-thanh-pho',
    price: 15000000,
    priceUnit: 'per_month' as const,
    area: 50,
    type: 'rent' as const,
    thumbnail: '/images/image_data/du-lich-binh-son-quang-ngai-phan-van-travel-1.webp',
    location: 'Quảng Ngãi, Lê Lợi',
    bedrooms: 0,
    bathrooms: 1,
    isVip: 'vip_plus' as const,
    user: { name: 'Trần Văn F', avatar: null },
  },
  {
    id: '9',
    title: 'Mặt bằng kinh doanh 80m2 mặt tiền đường lớn',
    slug: 'mat-bang-kinh-doanh-80m2-mat-tien-duong-lon',
    price: 30000000,
    priceUnit: 'per_month' as const,
    area: 80,
    type: 'rent' as const,
    thumbnail: '/images/image_data/shutterstock2065827521lyson-1701400873758.jpg',
    location: 'Quảng Ngãi, Nghĩa Lộ',
    bedrooms: 0,
    bathrooms: 1,
    isVip: 'diamond' as const,
    user: { name: 'Lê Thị G', avatar: null },
  },
];

const categories = [
  { id: 'all', name: 'Tất cả', icon: null, count: mockProperties.length },
  { id: 'nha-cho-thue', name: 'Nhà cho thuê', icon: Home, count: 450 },
  { id: 'can-ho-cho-thue', name: 'Căn hộ', icon: Building, count: 320 },
  { id: 'van-phong', name: 'Văn phòng', icon: Map, count: 89 },
  { id: 'mat-bang', name: 'Mặt bằng', icon: Map, count: 156 },
];

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'area_asc', label: 'Diện tích tăng dần' },
];

function PropertyListingContent() {
  const searchParams = useSearchParams();
  const type = searchParams?.get('type') || 'rent';

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [priceRange, setPriceRange] = useState([0, 100000000]);
  const [areaRange, setAreaRange] = useState([0, 500]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDirection, setSelectedDirection] = useState('all');
  const [minBedrooms, setMinBedrooms] = useState(0);
  const [sortBy, setSortBy] = useState('newest');

  return (
    <div className="flex flex-col bg-white">

      {/* ══════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════ */}
      <section className="relative z-10 h-[380px] md:h-[440px]">
        {/* Hero image — no overflow-hidden so SearchBar dropdown renders on top */}
        <Image
          src="/images/image_data/banner_hero.jpg"
          alt="Cho thuê bất động sản Quảng Ngãi"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/10 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-10 pb-8 md:pt-12 md:pb-10 flex flex-col items-center gap-5">

          {/* Badge */}
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white text-xs font-medium">800+ tin cho thuê · Quảng Ngãi</span>
          </div>

          {/* Headline */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-xl leading-tight tracking-tight">
              Cho thuê bất động sản<br className="hidden sm:block" />
              <span className="text-red-400"> Quảng Ngãi</span>
            </h1>
            <p className="text-white/70 text-xs sm:text-sm font-medium mt-2 tracking-wide">
              Nhanh chóng · Uy tín · Minh bạch
            </p>
          </div>

          {/* Search bar */}
          <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl">
            <SearchBar />
          </div>

          {/* Quick category pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.filter(c => c.id !== 'all').map((cat) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.id} href={`/cho-thue?cat=${cat.id}`}>
                  <span className="bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white text-xs font-medium px-4 py-1.5 rounded-full transition-all hover:border-white/40 cursor-pointer flex items-center gap-1.5">
                    {Icon && <Icon className="h-3 w-3" />}
                    {cat.name}
                  </span>
                </Link>
              );
            })}
            <Link href="/mua-ban">
              <span className="bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white text-xs font-medium px-4 py-1.5 rounded-full transition-all hover:border-white/40 cursor-pointer">
                Mua bán
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 2 — CATEGORY PILL BAR
      ══════════════════════════════════ */}
      <section className="py-4 px-4 bg-white border-b">
        <div className="max-w-6xl mx-auto">
          {/* Desktop categories */}
          <div className="hidden lg:flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {cat.name}
                  <Badge
                    variant={isActive ? 'secondary' : 'outline'}
                    className={`text-xs ${isActive ? 'bg-white/20 text-white border-0' : ''}`}
                  >
                    {cat.count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 3 — LISTING BODY
      ══════════════════════════════════ */}
      <section className="py-8 px-4 bg-gray-50 relative z-0 flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-8">

            {/* Left sidebar — Categories (mobile: shown as pill bar above) */}
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Danh mục</h3>
                <div className="space-y-1">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-primary-light text-primary shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          {Icon && <Icon className="h-4 w-4 shrink-0" />}
                          {cat.name}
                        </span>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {cat.count}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0">

              {/* Toolbar */}
              <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* Mobile filter button */}
                  <Sheet open={showFilters} onOpenChange={setShowFilters}>
                    <SheetTrigger className="lg:hidden inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 h-10 px-4 text-sm font-medium transition-colors">
                      <Filter className="h-4 w-4" />
                      Bộ lọc
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 max-h-[85vh] flex flex-col">
                      <SheetHeader className="shrink-0">
                        <SheetTitle>Bộ lọc</SheetTitle>
                      </SheetHeader>
                      <div className="flex-1 overflow-y-auto mt-4">
                        <FilterPanel
                          type="rent"
                          priceRange={priceRange}
                          onPriceRangeChange={setPriceRange}
                          areaRange={areaRange}
                          onAreaRangeChange={setAreaRange}
                          selectedDirection={selectedDirection}
                          onDirectionChange={setSelectedDirection}
                          minBedrooms={minBedrooms}
                          onBedroomsChange={setMinBedrooms}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Results count */}
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{mockProperties.length}</span> tin cho thuê
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Sort — pill style */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs text-gray-400 mr-1">Sắp xếp:</span>
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSortBy(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          sortBy === opt.value
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* View toggle */}
                  <div className="flex gap-1 border border-gray-200 rounded-xl p-1 ml-auto sm:ml-0">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === 'grid' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Properties */}
              {isLoading ? (
                <div className={viewMode === 'grid'
                  ? 'grid sm:grid-cols-2 xl:grid-cols-3 gap-5'
                  : 'space-y-4'
                }>
                  {[...Array(6)].map((_, i) => (
                    <PropertyCardSkeleton key={i} variant={viewMode} />
                  ))}
                </div>
              ) : mockProperties.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary-light flex items-center justify-center mb-4">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Không tìm thấy tin đăng</h3>
                  <p className="text-gray-500 mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary-light">
                    Xóa bộ lọc
                  </Button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {mockProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {mockProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {mockProperties.length > 0 && (
                <div className="flex justify-center mt-10">
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="w-9 h-9" disabled>
                      <ArrowRight className="h-4 w-4 rotate-180" />
                    </Button>
                    <Button className="w-9 h-9 bg-primary hover:bg-primary/90 text-white">1</Button>
                    <Button variant="outline" className="w-9 h-9">2</Button>
                    <Button variant="outline" className="w-9 h-9">3</Button>
                    <Button variant="outline" className="w-9 h-9 px-0">…</Button>
                    <Button variant="outline" className="w-9 h-9">10</Button>
                    <Button variant="outline" size="icon" className="w-9 h-9">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </main>

            {/* Right sidebar — Filter panel */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-24">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Bộ lọc</h3>
                  <button className="text-xs text-primary hover:underline font-medium">
                    Xóa tất cả
                  </button>
                </div>

                <FilterPanel
                  type="rent"
                  priceRange={priceRange}
                  onPriceRangeChange={setPriceRange}
                  areaRange={areaRange}
                  onAreaRangeChange={setAreaRange}
                  selectedDirection={selectedDirection}
                  onDirectionChange={setSelectedDirection}
                  minBedrooms={minBedrooms}
                  onBedroomsChange={setMinBedrooms}
                />

                <Button className="w-full mt-5 bg-primary hover:bg-primary/90">
                  Áp dụng
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

function PropertyListingLoading() {
  return (
    <div className="flex flex-col bg-white min-h-screen">
      <div className="h-[380px] bg-gray-200 animate-pulse" />
      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
