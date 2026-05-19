'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  Zap,
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
  SelectValue,
} from '@/components/ui/select';
import { EmptyState, BoostModal } from '@/components/shared';
import api from '@/lib/axios';
import { formatPrice } from '@/lib/formatters';

export default function PropertyManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [boostProperty, setBoostProperty] = useState<{ id: number; title: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-properties', statusFilter, searchQuery],
    queryFn: () =>
      api.get('/my/properties', {
        params: {
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: searchQuery || undefined,
        },
      }),
    select: (res) => res.data,
  });

  const properties = data?.data || [];

  const filtered = properties.filter((p: any) => {
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quan ly tin dang</h1>
          <p className="text-gray-500 mt-1">Quan ly va chinh sua cac tin dang cua ban</p>
        </div>
        <Link href="/dashboard/dang-tin">
          <Button className="bg-cta hover:bg-cta-dark">
            <Plus className="h-4 w-4 mr-2" />
            Dang tin moi
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tim kiem tin dang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Trang thai" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca trang thai</SelectItem>
                <SelectItem value="active">Dang hien thi</SelectItem>
                <SelectItem value="pending">Cho duyet</SelectItem>
                <SelectItem value="inactive">Tam an</SelectItem>
                <SelectItem value="rejected">Tu choi</SelectItem>
                <SelectItem value="expired">Het han</SelectItem>
              </SelectContent>
            </Select>
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
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <EmptyState
              title="Khong co tin dang nao"
              description={searchQuery ? 'Thu thay doi tu khoa tim kiem' : 'Ban chua co tin dang nao. Hay la nguoi dau tien dang tin!'}
              action={{ label: 'Dang tin moi', onClick: () => {} }}
            />
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((property: any) => (
            <div key={property.id} className="group space-y-2">
              <PropertyCardWrapper property={property} />
              <div className="flex items-center gap-2 px-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setBoostProperty({ id: property.id, title: property.title })}
                >
                  <Zap className="h-3 w-3 mr-1 text-primary" />
                  VIP
                </Button>
                <Link href={`/dashboard/quan-ly-tin/${property.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="h-3 w-3 mr-1" />
                    Sua
                  </Button>
                </Link>
                <Link href={`/${property.type === 'sale' ? 'mua-ban' : 'cho-thue'}/${property.slug}`} target="_blank">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <div className="divide-y">
            {filtered.map((property: any) => (
              <div key={property.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                {/* Thumbnail */}
                <div className="h-20 w-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {property.thumbnail ? (
                    <img src={property.thumbnail} alt={property.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">Khong co anh</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/dashboard/quan-ly-tin/${property.id}/edit`} className="font-medium text-gray-900 hover:text-primary truncate">
                      {property.title}
                    </Link>
                    <StatusBadge status={property.status} />
                    {property.is_vip && property.is_vip !== 'normal' && (
                      <Badge className="bg-yellow-100 text-yellow-700">
                        {property.is_vip === 'diamond' ? '★ VIP' : property.is_vip === 'vip_plus' ? 'VIP+' : 'VIP'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="font-semibold text-red-600">{formatPrice(property.price)}</span>
                    <span>{property.area}m2</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {property.view_count || 0}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBoostProperty({ id: property.id, title: property.title })}
                    className="text-primary"
                    title="Nang cap VIP"
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                  <Link href={`/${property.type === 'sale' ? 'mua-ban' : 'cho-thue'}/${property.slug}`} target="_blank">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/dashboard/quan-ly-tin/${property.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Boost Modal */}
      {boostProperty && (
        <BoostModal
          open={!!boostProperty}
          onOpenChange={(open) => !open && setBoostProperty(null)}
          propertyId={boostProperty.id}
          propertyTitle={boostProperty.title}
        />
      )}
    </div>
  );
}

function PropertyCardWrapper({ property }: { property: any }) {
  return (
    <Link
      href={`/${property.type === 'sale' ? 'mua-ban' : 'cho-thue'}/${property.slug}`}
      className="group block bg-white rounded-xl overflow-hidden border hover:shadow-lg hover:border-gray-300 transition-all"
    >
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {property.thumbnail ? (
          <img src={property.thumbnail} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-sm">Khong co anh</div>
        )}
        {property.is_vip && property.is_vip !== 'normal' && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-cta text-white">
              {property.is_vip === 'diamond' ? '★ VIP' : property.is_vip === 'vip_plus' ? 'VIP+' : 'VIP'}
            </Badge>
          </div>
        )}
        <Badge className={`absolute top-3 right-3 ${property.type === 'sale' ? 'bg-primary' : 'bg-green-600'} text-white border-0`}>
          {property.type === 'sale' ? 'Ban' : 'Cho thue'}
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors">{property.title}</h3>
        <p className="text-lg font-bold text-red-600">{formatPrice(property.price)}</p>
        <p className="text-sm text-gray-500 mt-1">{property.area}m2</p>
      </div>
    </Link>
  );
}
