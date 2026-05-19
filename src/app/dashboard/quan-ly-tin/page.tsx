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
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState, BoostModal } from '@/components/shared';
import { PillTabs } from '@/components/dashboard/pill-tabs';
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý tin đăng</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý và theo dõi hiệu quả các tin đăng của bạn</p>
        </div>
        <Link href="/dashboard/dang-tin">
          <Button className="bg-cta hover:bg-cta-dark text-white font-bold px-6 h-11 rounded-xl shadow-md shadow-red-500/20 transition-all">
            <Plus className="h-4 w-4 mr-2" />
            Đăng tin mới
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4">
        {/* Top filter row */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo tiêu đề tin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white border-gray-200 rounded-xl"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto ml-auto bg-white p-1 rounded-xl border border-gray-200 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <ListIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Status Pills */}
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <PillTabs 
            tabs={[
              { id: 'all', label: 'Tất cả' },
              { id: 'active', label: 'Đang hiển thị' },
              { id: 'pending', label: 'Chờ duyệt' },
              { id: 'inactive', label: 'Tạm ẩn' },
              { id: 'expired', label: 'Hết hạn' },
              { id: 'rejected', label: 'Bị từ chối' }
            ]}
            activeTab={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* Properties Grid/List */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="py-20 text-center">
            <EmptyState
              title="Không tìm thấy tin đăng nào"
              description={searchQuery ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' : 'Bạn chưa có tin đăng nào. Hãy là người đầu tiên đăng tin!'}
              action={!searchQuery ? { label: 'Đăng tin mới', onClick: () => {} } : undefined}
            />
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((property: any) => (
            <div key={property.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group">
              <Link href={`/${property.type === 'sale' ? 'mua-ban' : 'cho-thue'}/${property.slug}`} className="block relative aspect-[4/3] bg-gray-100 overflow-hidden">
                {property.thumbnail ? (
                  <img src={property.thumbnail} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Chưa có ảnh</div>
                )}
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <Badge className={`border-0 uppercase text-[10px] tracking-wider font-bold shadow-sm ${property.type === 'sale' ? 'bg-primary text-white' : 'bg-green-600 text-white'}`}>
                    {property.type === 'sale' ? 'Bán' : 'Cho thuê'}
                  </Badge>
                  {property.is_vip && property.is_vip !== 'normal' && (
                    <Badge className="bg-cta text-white border-0 uppercase text-[10px] tracking-wider font-bold shadow-sm">
                      {property.is_vip === 'diamond' ? '★ VIP' : property.is_vip === 'vip_plus' ? 'VIP+' : 'VIP'}
                    </Badge>
                  )}
                </div>
                <div className="absolute top-3 right-3">
                  <StatusBadge status={property.status} />
                </div>
              </Link>
              
              <div className="p-4 flex flex-col flex-1">
                <Link href={`/${property.type === 'sale' ? 'mua-ban' : 'cho-thue'}/${property.slug}`}>
                  <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors text-[15px] leading-tight">
                    {property.title}
                  </h3>
                </Link>
                <div className="flex items-end justify-between mt-auto pt-2">
                  <p className="text-lg font-extrabold text-[#e03131]">{formatPrice(property.price)}</p>
                  <p className="text-sm text-gray-500 font-medium">{property.area}m²</p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-9 bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-50 font-bold text-xs"
                  onClick={() => setBoostProperty({ id: property.id, title: property.title })}
                >
                  <Zap className="h-3.5 w-3.5 mr-1" /> VIP
                </Button>
                <Link href={`/dashboard/quan-ly-tin/${property.id}/edit`} className="flex-1">
                  <Button variant="outline" className="w-full h-9 bg-white text-gray-700 hover:text-gray-900 font-bold text-xs">
                    <Edit className="h-3.5 w-3.5 mr-1" /> Sửa
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl shadow-sm border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtered.map((property: any) => (
              <div key={property.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                {/* Thumbnail */}
                <Link href={`/${property.type === 'sale' ? 'mua-ban' : 'cho-thue'}/${property.slug}`} className="h-24 w-36 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative block">
                  {property.thumbnail ? (
                    <img src={property.thumbnail} alt={property.title} className="h-full w-full object-cover hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">Chưa có ảnh</div>
                  )}
                  {property.is_vip && property.is_vip !== 'normal' && (
                    <Badge className="absolute top-2 left-2 bg-cta text-white border-0 uppercase text-[10px] tracking-wider font-bold shadow-sm scale-75 origin-top-left">
                      {property.is_vip === 'diamond' ? '★ VIP' : property.is_vip === 'vip_plus' ? 'VIP+' : 'VIP'}
                    </Badge>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <StatusBadge status={property.status} />
                    <Badge className={`border-0 uppercase text-[10px] tracking-wider font-bold ${property.type === 'sale' ? 'bg-primary-light text-primary' : 'bg-green-100 text-green-700'}`}>
                      {property.type === 'sale' ? 'Bán' : 'Cho thuê'}
                    </Badge>
                  </div>
                  <Link href={`/dashboard/quan-ly-tin/${property.id}/edit`} className="font-bold text-gray-900 hover:text-primary truncate block text-base mb-2">
                    {property.title}
                  </Link>
                  <div className="flex items-center gap-4 text-[13px] text-gray-500 font-medium">
                    <span className="font-extrabold text-[#e03131] text-[15px]">{formatPrice(property.price)}</span>
                    <span className="flex items-center gap-1.5 before:content-['•'] before:mr-2 before:text-gray-300">
                      {property.area}m²
                    </span>
                    <span className="flex items-center gap-1.5 before:content-['•'] before:mr-2 before:text-gray-300">
                      <Eye className="h-3.5 w-3.5" />
                      {property.view_count || 0} lượt xem
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col items-center gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none h-9 w-full bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 font-bold"
                    onClick={() => setBoostProperty({ id: property.id, title: property.title })}
                  >
                    <Zap className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Đẩy tin</span>
                  </Button>
                  <Link href={`/dashboard/quan-ly-tin/${property.id}/edit`} className="flex-1 sm:flex-none w-full block">
                    <Button variant="outline" className="h-9 w-full font-bold text-gray-700 hover:text-gray-900">
                      <Edit className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Chỉnh sửa</span>
                    </Button>
                  </Link>
                  <div className="flex gap-2 w-full">
                    <Link href={`/${property.type === 'sale' ? 'mua-ban' : 'cho-thue'}/${property.slug}`} target="_blank" className="flex-1">
                      <Button variant="ghost" className="h-9 w-full text-gray-500 hover:text-gray-900 bg-gray-50">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" className="h-9 flex-1 text-red-500 hover:text-red-600 hover:bg-red-50 bg-gray-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
