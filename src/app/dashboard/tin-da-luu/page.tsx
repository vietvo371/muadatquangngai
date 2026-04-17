'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Heart, Filter, MoreVertical, Trash2, Share2, ExternalLink } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';

// Mock data
const savedProperties = [
  {
    id: 1,
    title: 'Căn hộ cao cấp 2PN view biển Mỹ Khê',
    slug: 'can-ho-cao-cap-2pn-view-bien',
    price: 3500000000,
    price_unit: 'total',
    area: 75,
    thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
    address: 'Đường Võ Nguyên Giáp, Sơn Trà, Đà Nẵng',
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 1,
    saved_at: '2024-01-15',
  },
  {
    id: 2,
    title: 'Nhà phố 3 tầng mặt tiền đường lớn',
    slug: 'nha-pho-3-tang-mat-tien',
    price: 4500000000,
    price_unit: 'total',
    area: 120,
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
    address: 'Quang Trung, Hải Châu, Đà Nẵng',
    type: 'townhouse',
    bedrooms: 4,
    bathrooms: 3,
    saved_at: '2024-01-14',
  },
  {
    id: 3,
    title: 'Đất nền KDC An Phú Quý 200m2',
    slug: 'dat-nen-kdc-an-phu-quy',
    price: 1800000000,
    price_unit: 'total',
    area: 200,
    thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop',
    address: 'Tịnh Long, Quảng Ngãi',
    type: 'land',
    saved_at: '2024-01-13',
  },
];

export default function SavedPage() {
  const [properties, setProperties] = useState(savedProperties);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === properties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(properties.map(p => p.id));
    }
  };

  const removeSelected = () => {
    setProperties(prev => prev.filter(p => !selectedIds.includes(p.id)));
    setSelectedIds([]);
  };

  const removeProperty = (id: number) => {
    setProperties(prev => prev.filter(p => p.id !== id));
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tin đã lưu</h1>
          <p className="text-gray-500">{properties.length} tin đăng</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectItem value="price_asc">Giá tăng dần</SelectItem>
                <SelectItem value="price_desc">Giá giảm dần</SelectItem>
              </SelectContent>
            </Select>

            <Input placeholder="Tìm kiếm..." className="w-64" />

            {selectedIds.length > 0 && (
              <Button variant="destructive" onClick={removeSelected} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Xóa ({selectedIds.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {properties.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {properties.map((property) => (
            <div key={property.id} className="relative">
              {/* Select checkbox */}
              <div className="absolute top-3 left-3 z-10">
                <Checkbox
                  checked={selectedIds.includes(property.id)}
                  onCheckedChange={() => toggleSelect(property.id)}
                />
              </div>

              {/* Menu */}
              <div className="absolute top-3 right-3 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      <Link href={`/mua-ban/${property.slug}`}>Xem tin</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="h-4 w-4 mr-2" />
                      Chia sẻ
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => removeProperty(property.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Bỏ lưu
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Property Card */}
              <Link href={`/mua-ban/${property.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-[4/3]">
                    <img
                      src={property.thumbnail}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute bottom-3 left-3" variant="secondary">
                      {property.type === 'apartment' ? 'Căn hộ' : 
                       property.type === 'townhouse' ? 'Nhà phố' : 'Đất nền'}
                    </Badge>
                    <div className="absolute bottom-3 right-3">
                      <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white text-red-500 hover:text-red-600">
                        <Heart className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className={viewMode === 'list' ? 'p-4 flex gap-4' : 'p-4'}>
                    {viewMode === 'list' ? (
                      <>
                        <div className="w-48 h-32 flex-shrink-0">
                          <img src={property.thumbnail} alt="" className="w-full h-full object-cover rounded-lg" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">{property.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{property.address}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-lg font-bold text-red-600">{formatPrice(property.price)}</span>
                            <span className="text-sm text-gray-500">{property.area}m²</span>
                            {'bedrooms' in property && (
                              <span className="text-sm text-gray-500">{property.bedrooms} PN</span>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                          {property.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                          📍 {property.address}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-red-600">
                            {formatPrice(property.price)}
                          </span>
                          <span className="text-sm text-gray-500">{property.area}m²</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có tin đã lưu</h3>
            <p className="text-gray-500 mb-4">Lưu lại những tin đăng bạn quan tâm để xem lại sau</p>
            <Link href="/mua-ban">
              <Button>Khám phá tin đăng</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
