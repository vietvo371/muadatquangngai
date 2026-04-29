'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  EyeOff,
  Copy,
  ExternalLink,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { PropertyCard } from '@/components/property/PropertyCard';
import { formatPrice } from '@/lib/formatters';

const mockProperties = [
  {
    id: '1',
    title: 'Căn hộ cao cấp 2PN view biển Mỹ Khê',
    slug: 'can-ho-cao-cap-2pn-view-bien-my-khe',
    price: 2800000000,
    priceUnit: 'total',
    area: 75,
    type: 'sale' as const,
    status: 'active' as const,
    isVip: 'vip' as string,
    thumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',
    location: 'Đà Nẵng, Mỹ An',
    views: 1234,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    title: 'Nhà mặt phố 4 tầng mặt tiền 5m Quang Trung',
    slug: 'nha-mat-pho-4-tang-mat-tien-5m-quang-trung',
    price: 6500000000,
    priceUnit: 'total',
    area: 120,
    type: 'sale' as const,
    status: 'pending' as const,
    isVip: 'normal' as string,
    thumbnail: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop',
    location: 'Quảng Ngãi, Quảng Phú',
    views: 456,
    createdAt: '2024-01-14',
  },
  {
    id: '3',
    title: 'Đất nền dự án ven biển 500m2 có sổ đỏ',
    slug: 'dat-nen-du-an-ven-bien-500m2-co-so-do',
    price: 1800000000,
    priceUnit: 'total',
    area: 500,
    type: 'sale' as const,
    status: 'active' as const,
    isVip: 'diamond' as string,
    thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop',
    location: 'Quảng Ngãi, Tịnh An',
    views: 789,
    createdAt: '2024-01-13',
  },
  {
    id: '4',
    title: 'Căn hộ chung cư mini cho thuê 35m2',
    slug: 'can-ho-chung-cu-mini-cho-thue-35m2',
    price: 5000000,
    priceUnit: 'per_month',
    area: 35,
    type: 'rent' as const,
    status: 'inactive' as const,
    isVip: 'normal' as string,
    thumbnail: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
    location: 'Đà Nẵng, Sơn Trà',
    views: 234,
    createdAt: '2024-01-12',
  },
];

export default function PropertyManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredProperties = mockProperties.filter((property) => {
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tin đăng</h1>
          <p className="text-gray-500 mt-1">
            Quản lý và chỉnh sửa các tin đăng của bạn
          </p>
        </div>
        <Link href="/dashboard/dang-tin">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Đăng tin mới
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm tin đăng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hiển thị</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="inactive">Tạm ẩn</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
                <SelectItem value="expired">Hết hạn</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid/List */}
      {filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Không tìm thấy tin đăng</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Thử thay đổi từ khóa tìm kiếm' : 'Bạn chưa có tin đăng nào'}
            </p>
            <Link href="/dashboard/dang-tin">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Đăng tin mới
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <div key={property.id} className="group">
              <PropertyCard property={property} />
              <div className="flex items-center gap-2 mt-2 px-1">
                <Link href={`/dashboard/quan-ly-tin/${property.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="h-3 w-3 mr-1" />
                    Sửa
                  </Button>
                </Link>
                <Link href={`/mua-ban/${property.slug}`} target="_blank">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <div className="divide-y">
            {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="h-20 w-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {property.thumbnail ? (
                      <img
                        src={property.thumbnail}
                        alt={property.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/quan-ly-tin/${property.id}/edit`}
                        className="font-medium text-gray-900 hover:text-primary truncate"
                      >
                        {property.title}
                      </Link>
                      <StatusBadge status={property.status as 'active' | 'pending' | 'inactive' | 'rejected' | 'expired'} />
                      {property.isVip !== 'normal' && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                          {property.isVip === 'vip' && 'VIP'}
                          {property.isVip === 'vip_plus' && 'VIP+'}
                          {property.isVip === 'diamond' && '★ VIP'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="font-semibold text-red-600">
                        {formatPrice(property.price, property.priceUnit)}
                      </span>
                      <span>{property.area}m²</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {property.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {property.createdAt}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link href={`/mua-ban/${property.slug}`} target="_blank">
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/quan-ly-tin/${property.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
