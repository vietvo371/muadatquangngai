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
import { Heart, MoreVertical, Trash2, Share2, ExternalLink, LayoutGrid, List as ListIcon } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import { EmptyState } from '@/components/shared';

// Mock data
const savedProperties = [
  {
    id: 1,
    title: 'Căn hộ cao cấp 2PN view biển Mỹ Khê Đà Nẵng',
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
    title: 'Nhà phố 3 tầng mặt tiền đường lớn kinh doanh',
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
    title: 'Đất nền KDC An Phú Quý 200m2 đã có sổ',
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

  const removeSelected = () => {
    setProperties(prev => prev.filter(p => !selectedIds.includes(p.id)));
    setSelectedIds([]);
  };

  const removeProperty = (id: number) => {
    setProperties(prev => prev.filter(p => p.id !== id));
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Heart className="h-6 w-6 text-[#e03131] fill-[#e03131]" />
            Tin đã lưu
          </h1>
          <p className="text-gray-500 text-sm mt-1">Bạn đang lưu trữ {properties.length} tin bất động sản quan tâm</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <ListIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {properties.length > 0 && (
        <Card className="rounded-2xl shadow-sm border-gray-100">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
                  <SelectTrigger className="w-[180px] h-11 bg-gray-50 border-gray-200 rounded-xl">
                    <SelectValue placeholder="Sắp xếp theo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mới lưu gần đây</SelectItem>
                    <SelectItem value="oldest">Lưu cũ nhất</SelectItem>
                    <SelectItem value="price_asc">Giá tăng dần</SelectItem>
                    <SelectItem value="price_desc">Giá giảm dần</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden sm:block w-px h-6 bg-gray-200"></div>

                {selectedIds.length > 0 && (
                  <Button variant="destructive" onClick={removeSelected} className="gap-2 h-11 px-4 rounded-xl font-bold bg-red-50 text-red-600 hover:bg-red-100 border-0">
                    <Trash2 className="h-4 w-4" />
                    Bỏ lưu đã chọn ({selectedIds.length})
                  </Button>
                )}
              </div>

              <div className="w-full sm:w-auto relative max-w-xs">
                <Input placeholder="Tìm nhanh trong tin đã lưu..." className="h-11 bg-gray-50 border-gray-200 rounded-xl w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {properties.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
          {properties.map((property) => (
            <div key={property.id} className="relative group">
              {/* Card content based on view mode */}
              {viewMode === 'grid' ? (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={property.thumbnail} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="absolute top-3 left-3 z-10">
                      <Checkbox
                        checked={selectedIds.includes(property.id)}
                        onCheckedChange={() => toggleSelect(property.id)}
                        className="bg-white/90 border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>

                    <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <Button size="icon" onClick={() => removeProperty(property.id)} className="h-8 w-8 rounded-full bg-white/90 hover:bg-red-50 text-gray-500 hover:text-red-500 shadow-sm border-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <Badge className="absolute bottom-3 left-3 bg-black/60 text-white backdrop-blur-md border-0 font-medium tracking-wide shadow-sm">
                      {property.type === 'apartment' ? 'Căn hộ' : property.type === 'townhouse' ? 'Nhà phố' : 'Đất nền'}
                    </Badge>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <Link href={`/mua-ban/${property.slug}`}>
                      <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors text-[15px] leading-tight">
                        {property.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500 mb-3 truncate flex items-center gap-1.5">
                      <span className="text-[10px]">📍</span> {property.address}
                    </p>
                    <div className="flex items-end justify-between mt-auto border-t border-gray-100 pt-3">
                      <span className="text-lg font-extrabold text-[#e03131] tracking-tight">{formatPrice(property.price)}</span>
                      <span className="text-[13px] text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md">{property.area}m²</span>
                    </div>
                  </div>
                </div>
              ) : (
                <Card className="rounded-2xl border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row p-4 gap-4">
                  {/* Select checkbox */}
                  <div className="pt-1 hidden sm:block">
                    <Checkbox
                      checked={selectedIds.includes(property.id)}
                      onCheckedChange={() => toggleSelect(property.id)}
                    />
                  </div>
                  
                  <Link href={`/mua-ban/${property.slug}`} className="w-full sm:w-48 h-32 rounded-xl overflow-hidden shrink-0 relative block">
                    <img src={property.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <Badge className="absolute bottom-2 left-2 bg-black/60 text-white backdrop-blur-md border-0 text-[10px] uppercase font-bold tracking-wider">
                      {property.type === 'apartment' ? 'Căn hộ' : property.type === 'townhouse' ? 'Nhà phố' : 'Đất nền'}
                    </Badge>
                  </Link>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-start justify-between gap-4">
                      <Link href={`/mua-ban/${property.slug}`} className="block flex-1">
                        <h3 className="font-bold text-lg text-gray-900 line-clamp-1 hover:text-primary transition-colors mb-1">{property.title}</h3>
                        <p className="text-sm text-gray-500 mb-3 truncate">{property.address}</p>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-900 shrink-0 hover:bg-gray-100 flex items-center justify-center transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <Link href={`/mua-ban/${property.slug}`} className="w-full cursor-pointer">
                            <DropdownMenuItem className="cursor-pointer">
                              <ExternalLink className="h-4 w-4 mr-2" /> Xem tin
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem className="cursor-pointer">
                            <Share2 className="h-4 w-4 mr-2" /> Chia sẻ
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => removeProperty(property.id)} className="text-red-600 focus:text-red-600 cursor-pointer">
                            <Trash2 className="h-4 w-4 mr-2" /> Bỏ lưu
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-4 mt-auto">
                      <span className="text-xl font-extrabold text-[#e03131] tracking-tight">{formatPrice(property.price)}</span>
                      <div className="flex items-center gap-3 text-[14px] text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5 before:content-['•'] before:mr-2 before:text-gray-300">{property.area}m²</span>
                        {'bedrooms' in property && (
                          <span className="flex items-center gap-1.5 before:content-['•'] before:mr-2 before:text-gray-300">{property.bedrooms} PN</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="py-20 text-center">
            <Heart className="h-20 w-20 mx-auto text-gray-200 mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có tin nào được lưu</h3>
            <p className="text-gray-500 mb-6">Bạn có thể lưu các tin đăng quan tâm để dễ dàng xem lại sau.</p>
            <Link href="/mua-ban">
              <Button className="bg-primary hover:bg-primary-dark text-white font-bold h-11 px-8 rounded-xl shadow-md">
                Khám phá tin đăng mới
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
