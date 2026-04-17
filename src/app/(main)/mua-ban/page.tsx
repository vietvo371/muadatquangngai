'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/search/SearchBar';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
    thumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',
    location: 'Đà Nẵng, Mỹ An',
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
    thumbnail: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop',
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
    thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop',
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
    thumbnail: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
    location: 'Đà Nẵng, Sơn Trà',
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
    thumbnail: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop',
    location: 'Đà Nẵng, Sơn Trà',
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
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
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

const directions = [
  { value: 'dong', label: 'Đông' },
  { value: 'tay', label: 'Tây' },
  { value: 'nam', label: 'Nam' },
  { value: 'bac', label: 'Bắc' },
  { value: 'dong_bac', label: 'Đông Bắc' },
  { value: 'dong_nam', label: 'Đông Nam' },
  { value: 'tay_bac', label: 'Tây Bắc' },
  { value: 'tay_nam', label: 'Tây Nam' },
];

function FilterPanel({
  priceRange,
  setPriceRange,
  areaRange,
  setAreaRange,
  selectedDirection,
  setSelectedDirection,
  minBedrooms,
  setMinBedrooms,
}: any) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium mb-3 block">Khoảng giá</Label>
        <Slider
          value={priceRange}
          onValueChange={(v) => v && setPriceRange(v)}
          min={0}
          max={20000000000}
          step={100000000}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>{(priceRange[0] / 1000000).toFixed(0)} triệu</span>
          <span>{(priceRange[1] / 1000000000).toFixed(1)} tỷ</span>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Diện tích</Label>
        <Slider
          value={areaRange}
          onValueChange={(v) => v && setAreaRange(v)}
          min={0}
          max={1000}
          step={10}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>{areaRange[0]} m²</span>
          <span>{areaRange[1]} m²</span>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Số phòng ngủ</Label>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => setMinBedrooms(num)}
              className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                minBedrooms === num
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {num === 0 ? 'Tất cả' : `${num}+`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Hướng nhà</Label>
        <Select value={selectedDirection} onValueChange={(v) => v && setSelectedDirection(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn hướng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả hướng</SelectItem>
            {directions.map((dir) => (
              <SelectItem key={dir.value} value={dir.value}>
                {dir.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Pháp lý</Label>
        <div className="space-y-2">
          {['Sổ đỏ', 'Sổ hồng', 'Hợp đồng mua bán', 'Đang chờ sổ'].map((legal) => (
            <div key={legal} className="flex items-center gap-2">
              <Checkbox id={legal} />
              <Label htmlFor={legal} className="text-sm font-normal cursor-pointer">
                {legal}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const [sortBy, setSortBy] = useState('newest');

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/mua-ban"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                type === 'sale' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Mua bán
            </Link>
            <Link 
              href="/cho-thue"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                type === 'rent' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Cho thuê
            </Link>
          </div>

          <SearchBar variant="listing" />
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Danh mục</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    selectedCategory === 'all' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span>Tất cả</span>
                  <Badge variant="secondary">{mockProperties.length}</Badge>
                </button>
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        selectedCategory === cat.id 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="flex-1 text-left">{cat.name}</span>
                      <Badge variant="secondary">{cat.count}</Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Sheet open={showFilters} onOpenChange={setShowFilters}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden gap-2">
                        <Filter className="h-4 w-4" />
                        Bộ lọc
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                      <SheetHeader>
                        <SheetTitle>Bộ lọc</SheetTitle>
                      </SheetHeader>
                      <FilterPanel 
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                        areaRange={areaRange}
                        setAreaRange={setAreaRange}
                        selectedDirection={selectedDirection}
                        setSelectedDirection={setSelectedDirection}
                        minBedrooms={minBedrooms}
                        setMinBedrooms={setMinBedrooms}
                      />
                    </SheetContent>
                  </Sheet>

                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{mockProperties.length}</span> tin đăng
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sắp xếp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Mới nhất</SelectItem>
                      <SelectItem value="price_asc">Giá thấp → cao</SelectItem>
                      <SelectItem value="price_desc">Giá cao → thấp</SelectItem>
                      <SelectItem value="area_asc">Diện tích tăng dần</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex gap-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className={viewMode === 'grid' 
                ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
              }>
                {[...Array(6)].map((_, i) => (
                  <PropertyCardSkeleton key={i} variant={viewMode} />
                ))}
              </div>
            ) : mockProperties.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Không tìm thấy tin đăng</h3>
                <p className="text-gray-500 mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <Button variant="outline">Xóa bộ lọc</Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
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

            {mockProperties.length > 0 && (
              <div className="flex justify-center mt-8">
                <div className="flex gap-2">
                  <Button variant="outline" disabled>←</Button>
                  <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">1</Button>
                  <Button variant="outline">2</Button>
                  <Button variant="outline">3</Button>
                  <Button variant="outline">...</Button>
                  <Button variant="outline">10</Button>
                  <Button variant="outline">→</Button>
                </div>
              </div>
            )}
          </main>

          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  Xóa tất cả
                </Button>
              </div>
              
              <FilterPanel 
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                areaRange={areaRange}
                setAreaRange={setAreaRange}
                selectedDirection={selectedDirection}
                setSelectedDirection={setSelectedDirection}
                minBedrooms={minBedrooms}
                setMinBedrooms={setMinBedrooms}
              />

              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                Áp dụng bộ lọc
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function PropertyListingLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Đang tải...</p>
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
