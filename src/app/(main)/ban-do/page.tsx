'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Layers,
  Locate,
} from 'lucide-react';
import { formatPrice } from '@/lib/formatters';

const propertiesOnMap = [
  {
    id: '1',
    title: 'Căn hộ cao cấp 2PN view biển Mỹ Khê',
    price: 2800000000,
    area: 75,
    lat: 15.12,
    lng: 108.80,
    thumbnail: '/images/image_data/Haus-Coastal.jpg',
    slug: 'can-ho-cao-cap-2pn-view-bien-my-khe',
    type: 'apartment',
    address: 'TP Quảng Ngãi',
    location: 'Quảng Ngãi, TP Quảng Ngãi',
  },
  {
    id: '2',
    title: 'Nhà mặt phố 3 tầng mặt tiền Quang Trung',
    price: 6500000000,
    area: 120,
    lat: 15.13,
    lng: 108.81,
    thumbnail: '/images/image_data/nha-pho-de-palace-river.jpg',
    slug: 'nha-mat-pho-3-tang-mat-tien-quang-trung',
    type: 'townhouse',
    address: 'Quang Trung, TP Quảng Ngãi',
    location: 'Quảng Ngãi, Trần Phú',
  },
  {
    id: '3',
    title: 'Đất nền dự án ven biển Lý Sơn 500m2',
    price: 1800000000,
    area: 500,
    lat: 15.48,
    lng: 109.12,
    thumbnail: '/images/image_data/shutterstock2065827521lyson-1701400873758.jpg',
    slug: 'dat-nen-du-an-ven-bien-ly-son-500m2',
    type: 'land',
    address: 'Lý Sơn, Quảng Ngãi',
    location: 'Quảng Ngãi, Lý Sơn',
  },
];

type ViewMode = 'map' | 'list' | 'split';

export default function MapSearchPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [selectedProperty, setSelectedProperty] = useState<typeof propertiesOnMap[0] | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    type: 'all',
    province: 'all',
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
    bedrooms: 'all',
  });

  const cycleViewMode = () => {
    const modes: ViewMode[] = ['split', 'map', 'list'];
    const idx = modes.indexOf(viewMode);
    setViewMode(modes[(idx + 1) % modes.length]);
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ══════════════════════════════════
          SEARCH BAR
      ══════════════════════════════════ */}
      <div className="bg-white border-b px-4 py-3 shrink-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm bất động sản trên bản đồ..."
                className="pl-10 h-10 rounded-xl bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            {/* Quick Selects */}
            <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v || 'all' })}>
              <SelectTrigger className="w-36 h-10">
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
              <SelectTrigger className="w-40 h-10">
                <SelectValue placeholder="Khu vực" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khu vực</SelectItem>
                <SelectItem value="qn">TP Quảng Ngãi</SelectItem>
                <SelectItem value="ls">Lý Sơn</SelectItem>
                <SelectItem value="md">Mộ Đức</SelectItem>
                <SelectItem value="bs">Bình Sơn</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-10 w-10 shrink-0 border-primary text-primary hover:bg-primary-light ${showFilters ? 'bg-primary text-white hover:bg-primary' : ''}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={cycleViewMode}
              className="h-10 w-10 shrink-0 border-gray-300"
            >
              {viewMode === 'split' && <Layers className="h-4 w-4" />}
              {viewMode === 'map' && <List className="h-4 w-4" />}
              {viewMode === 'list' && <MapIcon className="h-4 w-4" />}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-3 p-4 bg-gray-50 rounded-xl">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-500 mb-1 block">Giá tối thiểu</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="h-9 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 mb-1 block">Giá tối đa</Label>
                  <Input
                    type="number"
                    placeholder="10 tỷ"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="h-9 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 mb-1 block">Diện tích tối thiểu</Label>
                  <Input
                    type="number"
                    placeholder="0 m²"
                    value={filters.minArea}
                    onChange={(e) => setFilters({ ...filters, minArea: e.target.value })}
                    className="h-9 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 mb-1 block">Diện tích tối đa</Label>
                  <Input
                    type="number"
                    placeholder="1000 m²"
                    value={filters.maxArea}
                    onChange={(e) => setFilters({ ...filters, maxArea: e.target.value })}
                    className="h-9 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 mb-1 block">Phòng ngủ</Label>
                  <Select value={filters.bedrooms} onValueChange={(v) => setFilters({ ...filters, bedrooms: v || 'all' })}>
                    <SelectTrigger className="h-9 rounded-lg">
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

      {/* ══════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Property List Panel ── */}
        {viewMode !== 'map' && (
          <div className={`${viewMode === 'split' ? 'w-[400px]' : 'w-full'} bg-gray-50 overflow-y-auto border-r shrink-0`}>
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{propertiesOnMap.length} bất động sản</p>
                  <p className="text-xs text-gray-400">trên bản đồ</p>
                </div>
                <Select defaultValue="newest">
                  <SelectTrigger className="w-32 h-8 text-xs">
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

              {/* Cards */}
              <div className={`space-y-3 ${viewMode === 'list' ? 'grid md:grid-cols-2 lg:grid-cols-3' : ''}`}>
                {propertiesOnMap.map((property) => (
                  <div
                    key={property.id}
                    onClick={() => setSelectedProperty(property)}
                    className={`cursor-pointer transition-all rounded-xl ${
                      selectedProperty?.id === property.id
                        ? 'ring-2 ring-primary rounded-xl'
                        : ''
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
                        location: property.location,
                        type: property.type as 'sale',
                        bedrooms: property.type !== 'land' ? 2 : undefined,
                      }}
                      variant={viewMode === 'split' ? 'compact' : 'default'}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Map Panel ── */}
        {viewMode !== 'list' && (
          <div className="flex-1 relative bg-gray-100">

            {/* Map placeholder */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MapIcon className="h-10 w-10 text-primary/40" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">Bản đồ tương tác</h3>
                <p className="text-sm text-gray-400 mb-5 leading-relaxed">
                  Tích hợp Google Maps / Mapbox để hiển thị vị trí bất động sản trên bản đồ
                </p>

                {/* Property markers */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {propertiesOnMap.map((p) => (
                    <Badge
                      key={p.id}
                      variant={selectedProperty?.id === p.id ? 'default' : 'outline'}
                      className={`cursor-pointer px-3 py-1.5 text-xs ${
                        selectedProperty?.id === p.id
                          ? 'bg-primary'
                          : 'text-primary border-primary hover:bg-primary-light'
                      }`}
                      onClick={() => setSelectedProperty(p)}
                    >
                      {formatPrice(p.price)}
                    </Badge>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-5 border-primary text-primary hover:bg-primary-light gap-1.5"
                >
                  <Locate className="h-3.5 w-3.5" />
                  Tìm vị trí hiện tại
                </Button>
              </div>
            </div>

            {/* Map controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-1.5">
              <Button size="icon" variant="secondary" className="h-9 w-9 shadow-md bg-white hover:bg-gray-50">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="secondary" className="h-9 w-9 shadow-md bg-white hover:bg-gray-50">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-md px-3 py-2 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-cta" />
                <span className="text-gray-600">Mua bán</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-gray-600">Cho thuê</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-gray-600">Dự án</span>
              </div>
            </div>

            {/* Selected Property Popup */}
            {selectedProperty && (
              <div className="absolute bottom-4 right-4 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden">
                <Card className="border-0 shadow-none">
                  <CardContent className="p-0">
                    {/* Image */}
                    <div className="relative h-36">
                      <Image
                        src={selectedProperty.thumbnail}
                        alt={selectedProperty.title}
                        fill
                        className="object-cover"
                        sizes="320px"
                      />
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-2 right-2 h-7 w-7 shadow-md bg-white/90 hover:bg-white"
                        onClick={() => setSelectedProperty(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <Badge className="absolute top-2 left-2 bg-primary text-white text-xs">
                        {selectedProperty.type === 'apartment' ? 'Căn hộ' : selectedProperty.type === 'land' ? 'Đất nền' : 'Nhà phố'}
                      </Badge>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1.5 leading-snug">
                        {selectedProperty.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                        <span>{selectedProperty.address}</span>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-base font-bold text-cta">{formatPrice(selectedProperty.price)}</p>
                        <p className="text-sm text-gray-500">{selectedProperty.area}m²</p>
                      </div>
                      <Link href={`/mua-ban/${selectedProperty.slug}`}>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-sm h-9">
                          Xem chi tiết
                        </Button>
                      </Link>
                    </div>
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
