'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PropertyCard } from '@/components/property/PropertyCard';
import {
  Search,
  MapPin,
  List,
  Map as MapIcon,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  Filter,
} from 'lucide-react';
import { formatPrice } from '@/lib/formatters';

// Mock property data for map markers
const propertiesOnMap = [
  {
    id: 1,
    title: 'Căn hộ cao cấp 2PN view biển',
    price: 3500000000,
    area: 75,
    lat: 16.0544,
    lng: 108.2022,
    thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100',
    slug: 'can-ho-cao-cap-2pn-view-bien',
    type: 'apartment',
    address: 'Đà Nẵng',
  },
  {
    id: 2,
    title: 'Nhà phố 3 tầng mặt tiền',
    price: 4500000000,
    area: 120,
    lat: 16.0604,
    lng: 108.2092,
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100',
    slug: 'nha-pho-3-tang-mat-tien',
    type: 'townhouse',
    address: 'Hải Châu, Đà Nẵng',
  },
  {
    id: 3,
    title: 'Đất nền KDC An Phú Quý',
    price: 1800000000,
    area: 200,
    lat: 16.0484,
    lng: 108.1922,
    thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=100',
    slug: 'dat-nen-kdc-an-phu-quy',
    type: 'land',
    address: 'Quảng Ngãi',
  },
];

export default function MapSearchPage() {
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'split'>('split');
  const [selectedProperty, setSelectedProperty] = useState<typeof propertiesOnMap[0] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [filters, setFilters] = useState({
    type: 'all',
    province: 'all',
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
    bedrooms: 'all',
  });

  const toggleViewMode = () => {
    const modes: Array<'map' | 'list' | 'split'> = ['map', 'list', 'split'];
    const currentIndex = modes.indexOf(viewMode);
    setViewMode(modes[(currentIndex + 1) % modes.length]);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Search Bar */}
      <div className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm bất động sản..."
                className="pl-9"
              />
            </div>

            {/* Quick Filters */}
            <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v || 'all' })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Loại BĐS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="apartment">Căn hộ</SelectItem>
                <SelectItem value="house">Nhà</SelectItem>
                <SelectItem value="land">Đất nền</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.province} onValueChange={(v) => setFilters({ ...filters, province: v || 'all' })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tỉnh/TP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="dn">Đà Nẵng</SelectItem>
                <SelectItem value="hcm">TP. HCM</SelectItem>
                <SelectItem value="hn">Hà Nội</SelectItem>
                <SelectItem value="qn">Quảng Nam</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-blue-50' : ''}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={toggleViewMode}
            >
              {viewMode === 'map' && <List className="h-4 w-4" />}
              {viewMode === 'list' && <MapIcon className="h-4 w-4" />}
              {viewMode === 'split' && (
                <div className="flex">
                  <MapIcon className="h-3 w-3" />
                  <List className="h-3 w-3" />
                </div>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Giá tối thiểu</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Giá tối đa</Label>
                  <Input
                    type="number"
                    placeholder="10 tỷ"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Diện tích tối thiểu</Label>
                  <Input
                    type="number"
                    placeholder="0 m²"
                    value={filters.minArea}
                    onChange={(e) => setFilters({ ...filters, minArea: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Số phòng ngủ</Label>
                  <Select value={filters.bedrooms} onValueChange={(v) => setFilters({ ...filters, bedrooms: v || 'all' })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="1">1+</SelectItem>
                      <SelectItem value="2">2+</SelectItem>
                      <SelectItem value="3">3+</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Property List - Left Panel */}
        {viewMode !== 'map' && (
          <div className={`${viewMode === 'split' ? 'w-[400px]' : 'w-full'} bg-white border-r overflow-y-auto`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{propertiesOnMap.length} bất động sản</p>
                <Select defaultValue="newest">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="price_asc">Giá tăng dần</SelectItem>
                    <SelectItem value="price_desc">Giá giảm dần</SelectItem>
                    <SelectItem value="area">Diện tích</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={`grid gap-4 ${viewMode === 'list' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {propertiesOnMap.map((property) => (
                  <div
                    key={property.id}
                    onClick={() => setSelectedProperty(property)}
                    className={`cursor-pointer transition-all ${
                      selectedProperty?.id === property.id ? 'ring-2 ring-blue-500 rounded-lg' : ''
                    }`}
                  >
                    <PropertyCard
                      property={{
                        id: property.id,
                        title: property.title,
                        slug: property.slug,
                        price: property.price,
                        area: property.area,
                        thumbnail: property.thumbnail,
                        address: property.address,
                        type: property.type,
                        bedrooms: property.type !== 'land' ? 2 : undefined,
                      }}
                      variant="compact"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Map - Right Panel */}
        {viewMode !== 'list' && (
          <div className={`${viewMode === 'split' ? 'flex-1' : 'flex-1'} relative bg-gray-100`} ref={mapRef}>
            {/* Map Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
              <div className="text-center">
                <MapIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-2">Bản đồ tương tác</p>
                <p className="text-sm text-gray-400">
                  Tích hợp Google Maps / Mapbox / Leaflet
                </p>
                <div className="mt-4 flex gap-2 justify-center">
                  {propertiesOnMap.map((p) => (
                    <Badge
                      key={p.id}
                      variant={selectedProperty?.id === p.id ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedProperty(p)}
                    >
                      {formatPrice(p.price)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button size="icon" variant="secondary">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="secondary">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected Property Popup */}
            {selectedProperty && (
              <div className="absolute bottom-4 left-4 right-4 md:left-auto md:w-80">
                <Card className="shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <img
                        src={selectedProperty.thumbnail}
                        alt=""
                        className="w-20 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold line-clamp-1">{selectedProperty.title}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {selectedProperty.address}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-red-600 font-semibold">
                            {formatPrice(selectedProperty.price)}
                          </span>
                          <span className="text-sm text-gray-500">{selectedProperty.area}m²</span>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setSelectedProperty(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Link href={`/mua-ban/${selectedProperty.slug}`}>
                      <Button className="w-full mt-3" size="sm">
                        Xem chi tiết
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
