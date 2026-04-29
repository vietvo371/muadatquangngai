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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    id: '1',
    title: 'Căn hộ cao cấp 2PN view biển Mỹ Khê',
    slug: 'can-ho-cao-cap-2pn-view-bien-my-khe',
    price: 2800000000,
    priceUnit: 'total' as const,
    area: 75,
    type: 'sale' as const,
    thumbnail: '/images/image_data/Haus-Coastal.jpg',
    location: 'Quảng Ngãi, TP Quảng Ngãi',
    bedrooms: 2,
    bathrooms: 2,
    isVip: 'vip' as const,
    user: { name: 'Nguyễn Văn A', avatar: null },
  },
  {
    id: '2',
    title: 'Nhà mặt phố 4 tầng mặt tiền 5m Quang Trung',
    slug: 'nha-mat-pho-4-tang-mat-tien-5m-quang-trung',
    price: 6500000000,
    priceUnit: 'total' as const,
    area: 120,
    type: 'sale' as const,
    thumbnail: '/images/image_data/nha-pho-de-palace-river.jpg',
    location: 'Quảng Ngãi, Quảng Phú',
    bedrooms: 5,
    bathrooms: 4,
    isVip: 'vip_plus' as const,
    user: { name: 'Trần Thị B', avatar: null },
  },
  {
    id: '3',
    title: 'Đất nền dự án ven biển 500m2 có sổ đỏ',
    slug: 'dat-nen-du-an-ven-bien-500m2-co-so-do',
    price: 1800000000,
    priceUnit: 'total' as const,
    area: 500,
    type: 'sale' as const,
    thumbnail: '/images/image_data/shutterstock2065827521lyson-1701400873758.jpg',
    location: 'Quảng Ngãi, Tịnh An',
    bedrooms: 0,
    bathrooms: 0,
    isVip: 'diamond' as const,
    user: { name: 'Lê Văn C', avatar: null },
  },
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
    isVip: 'normal' as const,
    user: { name: 'Phạm Thị D', avatar: null },
  },
  {
    id: '5',
    title: 'Villa 3 tầng view biển 300m2 có hồ bơi',
    slug: 'villa-3-tang-view-bien-300m2-co-ho-boi',
    price: 15000000000,
    priceUnit: 'total' as const,
    area: 300,
    type: 'sale' as const,
    thumbnail: '/images/image_data/nha-pho-de-palace-river.jpg',
    location: 'Quảng Ngãi, Tịnh Hà',
    bedrooms: 4,
    bathrooms: 5,
    isVip: 'diamond' as const,
    user: { name: 'Hoàng Văn E', avatar: null },
  },
  {
    id: '6',
    title: 'Căn hộ 2PN chung cư Vincom diện tích 85m2',
    slug: 'can-ho-2pn-chung-cu-vincom-dien-tich-85m2',
    price: 3500000000,
    priceUnit: 'total' as const,
    area: 85,
    type: 'sale' as const,
    thumbnail: '/images/image_data/Starlight---suc-hut-den-tu-vi-tri-dac-dia-nhat-trung-tam-Quang-Ngai-suc-hut-3-1733900371-424-width1000height563.jpg',
    location: 'Quảng Ngãi, Trần Phú',
    bedrooms: 2,
    bathrooms: 2,
    isVip: 'vip' as const,
    user: { name: 'Vũ Thị F', avatar: null },
  },
];

const categories = [
  { id: 'nha-dat', name: 'Nhà đất', icon: Home, count: 1250 },
  { id: 'can-ho', name: 'Căn hộ', icon: Building, count: 890 },
  { id: 'dat-nen', name: 'Đất nền', icon: Map, count: 560 },
];

function PropertyListingContent() {
  const searchParams = useSearchParams();
  const type = searchParams?.get('type') || 'sale';

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [priceRange, setPriceRange] = useState([0, 20000000000]);
  const [areaRange, setAreaRange] = useState([0, 1000]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDirection, setSelectedDirection] = useState('all');
  const [minBedrooms, setMinBedrooms] = useState(0);
  const [selectedLegal, setSelectedLegal] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');

  return (
    <div className="flex flex-col bg-white">

      {/* ══════════════════════════════════
          HERO + TABS
      ══════════════════════════════════ */}
      <section className="relative z-10">
        <div className="absolute inset-0 overflow-hidden h-[280px] md:h-[340px]">
          <Image
            src="/images/image_data/banner_hero.jpg"
            alt="Mua bán bất động sản Quảng Ngãi"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-8 pb-6">
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-5">
            <Link
              href="/mua-ban"
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                type === 'sale'
                  ? 'bg-cta text-white shadow-lg'
                  : 'bg-white/15 backdrop-blur-sm border border-white/25 text-white hover:bg-white/25'
              }`}
            >
              Mua bán
            </Link>
            <Link
              href="/cho-thue"
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                type === 'rent'
                  ? 'bg-cta text-white shadow-lg'
                  : 'bg-white/15 backdrop-blur-sm border border-white/25 text-white hover:bg-white/25'
              }`}
            >
              Cho thuê
            </Link>
          </div>

          {/* Search */}
          <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          LISTING BODY
      ══════════════════════════════════ */}
      <section className="py-10 px-4 bg-gray-50 relative z-0 flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-8">
            {/* Left sidebar - Categories */}
            <aside className="hidden lg:block w-60 shrink-0">
              <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Danh mục</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-primary-light text-primary'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>Tất cả</span>
                    <Badge variant="secondary" className="text-xs">{mockProperties.length}</Badge>
                  </button>
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors ${
                          selectedCategory === cat.id
                            ? 'bg-primary-light text-primary'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left">{cat.name}</span>
                        <Badge variant="secondary" className="text-xs">{cat.count}</Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Sheet open={showFilters} onOpenChange={setShowFilters}>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="lg:hidden gap-2 border-primary text-primary hover:bg-primary-light">
                          <Filter className="h-4 w-4" />
                          Bộ lọc
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-80">
                        <SheetHeader>
                          <SheetTitle>Bộ lọc</SheetTitle>
                        </SheetHeader>
                        <FilterPanel
                          type="sale"
                          priceRange={priceRange}
                          onPriceRangeChange={setPriceRange}
                          areaRange={areaRange}
                          onAreaRangeChange={setAreaRange}
                          selectedDirection={selectedDirection}
                          onDirectionChange={setSelectedDirection}
                          minBedrooms={minBedrooms}
                          onBedroomsChange={setMinBedrooms}
                          selectedLegal={selectedLegal}
                          onLegalChange={setSelectedLegal}
                        />
                      </SheetContent>
                    </Sheet>

                    <p className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-900">{mockProperties.length}</span> tin đăng
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Sắp xếp" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Mới nhất</SelectItem>
                        <SelectItem value="price_asc">Giá thấp → cao</SelectItem>
                        <SelectItem value="price_desc">Giá cao → thấp</SelectItem>
                        <SelectItem value="area_asc">Diện tích tăng dần</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex gap-1 border border-gray-200 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Properties */}
              {isLoading ? (
                <div className={viewMode === 'grid'
                  ? 'grid md:grid-cols-2 xl:grid-cols-2 gap-6'
                  : 'space-y-4'
                }>
                  {[...Array(6)].map((_, i) => (
                    <PropertyCardSkeleton key={i} variant={viewMode} />
                  ))}
                </div>
              ) : mockProperties.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <MapPin className="h-8 w-8 text-gray-300" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Không tìm thấy tin đăng</h3>
                  <p className="text-gray-500 mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary-light">
                    Xóa bộ lọc
                  </Button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid md:grid-cols-2 gap-6">
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
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="icon" className="w-9 h-9" disabled>
                      <ArrowRight className="h-4 w-4 rotate-180" />
                    </Button>
                    <Button className="w-9 h-9 bg-primary hover:bg-primary/90 text-white">1</Button>
                    <Button variant="outline" className="w-9 h-9">2</Button>
                    <Button variant="outline" className="w-9 h-9">3</Button>
                    <Button variant="outline" className="w-9 h-9">...</Button>
                    <Button variant="outline" className="w-9 h-9">10</Button>
                    <Button variant="outline" size="icon" className="w-9 h-9">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </main>

            {/* Right sidebar - Filters */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-24">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Bộ lọc</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary text-xs h-7 px-2"
                  >
                    Xóa tất cả
                  </Button>
                </div>

                <FilterPanel
                  type="sale"
                  priceRange={priceRange}
                  onPriceRangeChange={setPriceRange}
                  areaRange={areaRange}
                  onAreaRangeChange={setAreaRange}
                  selectedDirection={selectedDirection}
                  onDirectionChange={setSelectedDirection}
                  minBedrooms={minBedrooms}
                  onBedroomsChange={setMinBedrooms}
                  selectedLegal={selectedLegal}
                  onLegalChange={setSelectedLegal}
                />

                <Button className="w-full mt-5 bg-primary hover:bg-primary/90">
                  Áp dụng bộ lọc
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
      <div className="h-[280px] bg-gray-200 animate-pulse" />
      <div className="py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PropertyListingPage() {
  return (
    <Suspense fallback={<PropertyListingLoading />}>
      <PropertyListingContent />
    </Suspense>
  );
}
