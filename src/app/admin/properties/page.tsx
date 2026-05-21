'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { FilterBar } from '@/components/admin';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MoreVertical,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/formatters';
import { propertyAdminApi, AdminProperty } from '@/lib/admin-api';

// Mock data fallback
const MOCK_PROPERTIES = [
  {
    id: 1,
    title: 'Căn hộ cao cấp 2PN view biển Mỹ Khê',
    slug: 'can-ho-cao-cap-2pn-view-bien',
    price: 3500000000,
    area: 75,
    thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100&h=100&fit=crop',
    status: 'active',
    verification_status: 'verified',
    type: 'sale',
    category: 'Căn hộ',
    province: 'Đà Nẵng',
    user: { id: 1, name: 'Nguyễn Văn A' },
    created_at: '2024-01-15',
  },
  {
    id: 2,
    title: 'Nhà phố 3 tầng mặt tiền đường lớn',
    slug: 'nha-pho-3-tang-mat-tien',
    price: 4500000000,
    area: 120,
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100&h=100&fit=crop',
    status: 'pending',
    verification_status: 'pending',
    type: 'sale',
    category: 'Nhà phố',
    province: 'Đà Nẵng',
    user: { id: 2, name: 'Trần Thị B' },
    created_at: '2024-01-18',
  },
];

const verificationConfig = {
  verified: { label: 'Đã xác minh', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending: { label: 'Chờ xác minh', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-700', icon: XCircle },
};

interface LocalProperty {
  id: number;
  title: string;
  slug: string;
  price: number;
  area: number;
  thumbnail: string;
  status: string;
  verification_status: 'verified' | 'pending' | 'rejected';
  type: string;
  category: string;
  province: string;
  user: { id: number; name: string };
  created_at: string;
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<LocalProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [useRealApi, setUseRealApi] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState<LocalProperty | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Load properties list from API
  const loadProperties = useCallback(async (targetPage = 1) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        page: targetPage,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (searchQuery.trim()) params.q = searchQuery.trim();

      const res = await propertyAdminApi.list(params);
      if (res && res.data) {
        const mapped = res.data.map((p: AdminProperty) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          price: Number(p.price),
          area: Number(p.area),
          thumbnail: p.thumbnail || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100&h=100&fit=crop',
          status: p.status,
          verification_status: p.status === 'active' ? 'verified' : p.status === 'rejected' ? 'rejected' : 'pending',
          type: p.type,
          category: p.category?.name || 'Bất động sản',
          province: p.province?.name || 'Quảng Ngãi',
          user: { id: p.user?.id || 0, name: p.user?.name || 'Môi giới' },
          created_at: p.created_at,
        }));
        setProperties(mapped);
        setPagination({
          current_page: res.meta.current_page || 1,
          last_page: res.meta.last_page || 1,
          per_page: res.meta.per_page || 20,
          total: res.meta.total || 0,
        });
        setUseRealApi(true);
      } else {
        setUseRealApi(false);
      }
    } catch (error) {
      console.error('Error fetching admin properties:', error);
      setUseRealApi(false);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchQuery]);

  useEffect(() => {
    loadProperties(page);
  }, [page, loadProperties]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleTypeChange = (val: string) => {
    setTypeFilter(val);
    setPage(1);
  };

  // Client side fallback filtering if API is down
  const displayProperties = useMemo(() => {
    if (useRealApi) {
      return properties;
    }
    return MOCK_PROPERTIES.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [useRealApi, properties, statusFilter, typeFilter, searchQuery]);

  const pendingCount = useMemo(() => {
    if (useRealApi) {
      return pagination.total > 0 ? properties.filter(p => p.status === 'pending').length : 0;
    }
    return MOCK_PROPERTIES.filter(p => p.status === 'pending').length;
  }, [useRealApi, properties, pagination.total]);

  // Actions
  const handleApprove = async (property: LocalProperty) => {
    try {
      const res = await propertyAdminApi.approve(property.id);
      if (res && res.success) {
        toast.success(res.message || `Đã phê duyệt tin đăng "${property.title}"!`);
        loadProperties(page);
      } else {
        toast.error('Không thể phê duyệt tin đăng.');
      }
    } catch {
      toast.error('Lỗi khi kết nối đến máy chủ.');
    }
  };

  const handleReject = async () => {
    if (selectedProperty) {
      try {
        const res = await propertyAdminApi.reject(selectedProperty.id, rejectReason);
        if (res && res.success) {
          toast.success(res.message || `Đã từ chối duyệt tin đăng "${selectedProperty.title}"!`);
          setShowRejectDialog(false);
          setSelectedProperty(null);
          setRejectReason('');
          loadProperties(page);
        } else {
          toast.error('Không thể từ chối tin đăng.');
        }
      } catch {
        toast.error('Lỗi khi kết nối đến máy chủ.');
      }
    }
  };

  const handleDelete = async (property: LocalProperty) => {
    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tin đăng "${property.title}"?`)) {
      try {
        const res = await propertyAdminApi.delete(property.id);
        if (res && res.success) {
          toast.success(res.message || 'Xóa tin đăng thành công!');
          loadProperties(page);
        } else {
          toast.error('Không thể xóa tin đăng.');
        }
      } catch {
        toast.error('Lỗi khi kết nối đến máy chủ.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tin đăng</h1>
          <p className="text-gray-500">Quản lý và duyệt tin đăng của người dùng</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-base px-4 py-2 bg-cta text-white hover:bg-cta-dark border-0 shadow-sm">
            {pendingCount} tin chờ duyệt
          </Badge>
        )}
      </div>

      {/* Filters */}
      <FilterBar
        filters={[
          {
            name: 'search',
            type: 'search',
            value: searchQuery,
            onChange: handleSearchChange,
          },
          {
            name: 'status',
            placeholder: 'Trạng thái',
            type: 'select',
            value: statusFilter,
            onChange: handleStatusChange,
            options: [
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'active', label: 'Đang đăng' },
              { value: 'pending', label: 'Chờ duyệt' },
              { value: 'inactive', label: 'Đã ẩn' },
              { value: 'expired', label: 'Hết hạn' },
              { value: 'rejected', label: 'Bị từ chối' },
            ],
          },
          {
            name: 'type',
            placeholder: 'Loại tin',
            type: 'select',
            value: typeFilter,
            onChange: handleTypeChange,
            options: [
              { value: 'all', label: 'Tất cả loại tin' },
              { value: 'sale', label: 'Mua bán' },
              { value: 'rent', label: 'Cho thuê' },
            ],
          },
        ]}
        onSearch={() => {}}
        searchPlaceholder="Tìm kiếm tin đăng..."
      />

      {/* Table */}
      <Card className="border border-gray-100 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-[300px] font-bold text-gray-700">Tin đăng</TableHead>
                <TableHead className="font-bold text-gray-700">Người đăng</TableHead>
                <TableHead className="font-bold text-gray-700">Trạng thái</TableHead>
                <TableHead className="font-bold text-gray-700">Xác minh</TableHead>
                <TableHead className="font-bold text-gray-700">Ngày đăng</TableHead>
                <TableHead className="text-right font-bold text-gray-700">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 animate-pulse shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-6 w-16 bg-gray-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-6 w-20 bg-gray-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-20 bg-gray-100 rounded animate-pulse" /></TableCell>
                    <TableCell className="text-right"><div className="h-8 w-8 bg-gray-100 rounded-full animate-pulse ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : displayProperties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500 font-medium">
                    Không có tin đăng nào phù hợp với bộ lọc của bạn.
                  </TableCell>
                </TableRow>
              ) : (
                displayProperties.map((property) => {
                  const verification = verificationConfig[property.verification_status as keyof typeof verificationConfig] || verificationConfig.pending;
                  const VerificationIcon = verification.icon;

                  return (
                    <TableRow key={property.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={property.thumbnail}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover bg-gray-50 shadow-sm shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100&h=100&fit=crop';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate hover:text-primary transition-colors">
                              <Link href={`/${property.type === 'sale' ? 'mua-ban' : 'cho-thue'}/${property.slug}`}>
                                {property.title}
                              </Link>
                            </p>
                            <div className="flex items-center gap-2 text-[12px] text-gray-500 font-medium mt-0.5">
                              <span className="text-cta font-black">{formatPrice(property.price)}</span>
                              <span>•</span>
                              <span>{property.area}m²</span>
                              <span>•</span>
                              <span>{property.province}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-gray-800">{property.user.name}</p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={property.status as 'active' | 'pending' | 'inactive' | 'expired' | 'rejected'} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <VerificationIcon className="h-4 w-4 shrink-0 text-gray-500" />
                          <Badge variant="outline" className={`${verification.color} border-0 shadow-none font-bold py-0 px-2 text-[11px]`}>
                            {verification.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 font-medium text-[13px]">{formatDate(property.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-gray-100 rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <Link href={`/${property.type === 'sale' ? 'mua-ban' : 'cho-thue'}/${property.slug}`} className="flex items-center w-full cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" />
                                Xem chi tiết
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {property.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleApprove(property)} className="cursor-pointer text-green-600 font-medium">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Duyệt tin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedProperty(property);
                                    setShowRejectDialog(true);
                                  }}
                                  className="text-red-650 cursor-pointer font-medium"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Từ chối
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleDelete(property)} className="text-red-600 cursor-pointer font-medium">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa tin đăng
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!loading && useRealApi && pagination.last_page > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <p className="text-[13px] text-gray-500 font-semibold">
                Hiển thị {properties.length} trên tổng số {pagination.total} tin đăng
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={pagination.current_page === 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {(() => {
                  const pages = [];
                  const curr = pagination.current_page;
                  const last = pagination.last_page;
                  
                  if (last <= 5) {
                    for (let i = 1; i <= last; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    const start = Math.max(2, curr - 1);
                    const end = Math.min(last - 1, curr + 1);
                    if (start > 2) pages.push('...');
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (end < last - 1) pages.push('...');
                    pages.push(last);
                  }
                  
                  return pages.map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 font-medium">
                          …
                        </span>
                      );
                    }
                    
                    const isCurrent = p === curr;
                    return (
                      <Button
                        key={`page-${p}`}
                        variant={isCurrent ? 'default' : 'outline'}
                        className={`h-8 w-8 font-bold text-xs ${isCurrent ? 'bg-primary text-white shadow-sm border-0' : ''}`}
                        onClick={() => setPage(Number(p))}
                      >
                        {p}
                      </Button>
                    );
                  });
                })()}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={pagination.current_page === pagination.last_page}
                  onClick={() => setPage(p => Math.min(p + 1, pagination.last_page))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Từ chối duyệt tin</DialogTitle>
            <DialogDescription className="text-gray-500 text-sm mt-1">
              Vui lòng nhập lý do từ chối tin đăng &ldquo;{selectedProperty?.title}&rdquo;. Lý do này sẽ được gửi tới hòm thư của người đăng.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối (ví dụ: Thông tin không hợp lệ, hình ảnh sai lệch...)"
              rows={4}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-[14px] font-medium placeholder-gray-400 transition-all"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="rounded-xl font-bold h-11">
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleReject} className="bg-cta text-white hover:bg-cta-dark border-0 rounded-xl font-bold h-11">
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

