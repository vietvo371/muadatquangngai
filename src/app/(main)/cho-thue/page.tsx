// This page is similar to mua-ban page but for rentals
// Copy from mua-ban and change the default type

'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  Map
} from 'lucide-react';

// Mock data for rent
const mockProperties = [
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
    thumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',
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
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
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
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
    location: 'Đà Nẵng, Hải Châu',
    bedrooms: 0,
    bathrooms: 1,
    isVip: 'diamond' as const,
    user: { name: 'Lê Thị G', avatar: null },
  },
];

const categories = [
  { id: 'nha-cho-thue', name: 'Nhà cho thuê', icon: Home, count: 450 },
  { id: 'can-ho-cho-thue', name: 'Căn hộ', icon: Building, count: 320 },
  { id: 'van-phong', name: 'Văn phòng', icon: Map, count: 89 },
  { id: 'mat-bang', name: 'Mặt bằng', icon: Map, count: 156 },
];

export default function ChoThuePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 100000000]);
  const [sortBy, setSortBy] = useState('newest');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Section */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/mua-ban"
              className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Mua bán
            </Link>
            <Link 
              href="/cho-thue"
              className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white"
            >
              Cho thuê
            </Link>
          </div>
          <SearchBar variant="listing" />
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Categories Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Danh mục</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-3 rounded-lg bg-blue-50 text-blue-700">
                  <span>Tất cả</span>
                  <Badge variant="secondary">{mockProperties.length}</Badge>
                </button>
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
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

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">{mockProperties.length}</span> tin cho thuê
                </p>
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

            {/* Properties Grid */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <PropertyCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {mockProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center mt-8">
              <div className="flex gap-2">
                <Button variant="outline" disabled>←</Button>
                <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">1</Button>
                <Button variant="outline">2</Button>
                <Button variant="outline">→</Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
