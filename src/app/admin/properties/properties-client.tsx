'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MoreVertical,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Clock,
  User,
  ShieldCheck,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/formatters';
import { propertyAdminApi, AdminProperty } from '@/lib/admin-api';

// Dynamic client URL from env
const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';

// Mock data fallback with authentic local Quang Ngai listings
const MOCK_PROPERTIES = [
  {
    id: 1,
    title: 'Căn hộ cao cấp 2PN view biển Mỹ Khê Quảng Ngãi',
    slug: 'can-ho-cao-cap-2pn-view-bien-my-khe',
    price: 3500000000,
    area: 75,
    thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100&h=100&fit=crop',
    status: 'active',
    verification_status: 'verified',
    type: 'sell',
    category: 'Căn hộ',
    province: 'Quảng Ngãi',
    user: { id: 1, name: 'Nguyễn Văn Anh (Môi giới)' },
    created_at: '2026-05-15T10:00:00Z',
  },
  {
    id: 2,
    title: 'Nhà phố 3 tầng mặt tiền Hùng Vương trung tâm TP',
    slug: 'nha-pho-3-tang-mat-tien-hung-vuong',
    price: 4500000000,
    area: 120,
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100&h=100&fit=crop',
    status: 'pending',
    verification_status: 'pending',
    type: 'sell',
    category: 'Nhà phố',
    province: 'Quảng Ngãi',
    user: { id: 2, name: 'Trần Thị Bình' },
    created_at: '2026-05-18T14:30:00Z',
  },
  {
    id: 3,
    title: 'Đất nền VSIP Quảng Ngãi kiệt ô tô thông thoáng',
    slug: 'dat-nen-vsip-quang-ngai-kiet-o-to',
    price: 1200000000,
    area: 100,
    thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=100&h=100&fit=crop',
    status: 'pending',
    verification_status: 'pending',
    type: 'sell',
    category: 'Đất nền',
    province: 'Quảng Ngãi',
    user: { id: 3, name: 'Lê Văn Cường' },
    created_at: '2026-05-19T09:15:00Z',
  },
  {
    id: 4,
    title: 'Cho thuê shophouse Uhome Quảng Ngãi mặt tiền kinh doanh',
    slug: 'cho-thue-shophouse-uhome-quang-ngai',
    price: 15000000,
    area: 90,
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop',
    status: 'active',
    verification_status: 'verified',
    type: 'rent',
    category: 'Shophouse',
    province: 'Quảng Ngãi',
    user: { id: 4, name: 'Phạm Minh Hoàng' },
    created_at: '2026-05-12T16:00:00Z',
  },
  {
    id: 5,
    title: 'Bán đất nền ven sông Trà Khúc vị trí đắc địa',
    slug: 'ban-dat-nen-ven-song-tra-khuc',
    price: 2600000000,
    area: 125,
    thumbnail: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=100&h=100&fit=crop',
    status: 'inactive',
    verification_status: 'verified',
    type: 'sell',
    category: 'Đất nền',
    province: 'Quảng Ngãi',
    user: { id: 5, name: 'Đỗ Mỹ Linh (Đại lý)' },
    created_at: '2026-05-08T08:00:00Z',
  }
];

const verificationConfig = {
  verified: { label: 'Đã xác minh', color: 'bg-green-50 text-green-700 hover:bg-green-100', icon: ShieldCheck },
  pending: { label: 'Chờ xác minh', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100', icon: AlertTriangle },
  rejected: { label: 'Từ chối', color: 'bg-red-50 text-red-700 hover:bg-red-100', icon: XCircle },
};

const statusTabs = [
  { value: 'all', label: 'Tất cả tin đăng' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'active', label: 'Đang hiển thị' },
  { value: 'inactive', label: 'Tạm ẩn' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'rejected', label: 'Bị từ chối' },
];

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

export default function PropertiesClient() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  // Mock data states in case of fallback
  const [mockProperties, setMockProperties] = useState<LocalProperty[]>(MOCK_PROPERTIES as LocalProperty[]);

  // Filter states
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [selectedProperty, setSelectedProperty] = useState<LocalProperty | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // TanStack Query v5 to fetch properties
  const { data, isLoading } = useQuery({
    queryKey: ['admin-properties', page, perPage, searchQuery, statusFilter, typeFilter],
    queryFn: async () => {
      try {
        const params: Record<string, string | number> = {
          page,
          limit: perPage,
        };
        if (statusFilter !== 'all') params.status = statusFilter;
        if (typeFilter !== 'all') params.type = typeFilter;
        if (searchQuery.trim()) params.q = searchQuery.trim();

        const res = await propertyAdminApi.list(params);
        if (res && res.data) {
          const mapped: LocalProperty[] = res.data.map((p: AdminProperty) => ({
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
          return {
            properties: mapped,
            pagination: {
              current_page: res.meta.current_page || 1,
              last_page: res.meta.last_page || 1,
              per_page: res.meta.per_page || perPage,
              total: res.meta.total || 0,
            },
            useRealApi: true,
          };
        }
      } catch (error) {
        console.error('Error fetching admin properties, using mock data:', error);
      }
      return {
        properties: [],
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: perPage,
          total: 0,
        },
        useRealApi: false,
      };
    }
  });

  // Prefetch the next page of properties if available
  useEffect(() => {
    if (data?.useRealApi && page < data.pagination.last_page) {
      const nextPage = page + 1;
      const params: Record<string, string | number> = {
        page: nextPage,
        limit: perPage,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (searchQuery.trim()) params.q = searchQuery.trim();

      queryClient.prefetchQuery({
        queryKey: ['admin-properties', nextPage, perPage, searchQuery, statusFilter, typeFilter],
        queryFn: async () => {
          try {
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
              return {
                properties: mapped,
                pagination: {
                  current_page: res.meta.current_page || 1,
                  last_page: res.meta.last_page || 1,
                  per_page: res.meta.per_page || perPage,
                  total: res.meta.total || 0,
                },
                useRealApi: true,
              };
            }
          } catch (error) {
            console.error('Error prefetching admin properties:', error);
          }
          return {
            properties: [],
            pagination: {
              current_page: 1,
              last_page: 1,
              per_page: perPage,
              total: 0,
            },
            useRealApi: false,
          };
        }
      });
    }
  }, [data, page, perPage, searchQuery, statusFilter, typeFilter, queryClient]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleTypeChange = (val: string | null) => {
    setTypeFilter(val || 'all');
    setPage(1);
  };

  // Client side fallback filtering if API is down
  const filteredMockProperties = useMemo(() => {
    return mockProperties.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.user.name.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [mockProperties, statusFilter, typeFilter, searchQuery]);

  const displayProperties = useMemo(() => {
    if (data?.useRealApi) {
      return data.properties;
    }
    const startIndex = (page - 1) * perPage;
    return filteredMockProperties.slice(startIndex, startIndex + perPage);
  }, [data, filteredMockProperties, page, perPage]);

  const displayTotal = useMemo(() => {
    return data?.useRealApi ? data.pagination.total : filteredMockProperties.length;
  }, [data, filteredMockProperties]);

  const displayLastPage = useMemo(() => {
    return data?.useRealApi ? data.pagination.last_page : Math.max(1, Math.ceil(filteredMockProperties.length / perPage));
  }, [data, filteredMockProperties, perPage]);

  const pendingCount = useMemo(() => {
    const list = data?.useRealApi ? data.properties : mockProperties;
    return list.filter(p => p.status === 'pending').length;
  }, [data, mockProperties]);

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async (property: LocalProperty) => {
      return await propertyAdminApi.approve(property.id);
    },
    onMutate: async (property: LocalProperty) => {
      await queryClient.cancelQueries({ queryKey: ['admin-properties'] });
      const queryKey = ['admin-properties', page, perPage, searchQuery, statusFilter, typeFilter];
      const previousData = queryClient.getQueryData(queryKey);
      const previousMockProperties = mockProperties;

      // Optimistically update states
      setMockProperties(prev => prev.map(p => p.id === property.id ? { ...p, status: 'active', verification_status: 'verified' } : p));
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          properties: old.properties.map((p: any) => p.id === property.id ? { ...p, status: 'active', verification_status: 'verified' } : p)
        };
      });

      return { previousData, previousMockProperties };
    },
    onSuccess: (res, property) => {
      if (res && res.success) {
        toast.success(res.message || `Đã phê duyệt tin đăng "${property.title}"!`);
      } else {
        toast.error('Không thể phê duyệt tin đăng.');
      }
    },
    onError: (error, property, context: any) => {
      if (data?.useRealApi) {
        if (context) {
          const queryKey = ['admin-properties', page, perPage, searchQuery, statusFilter, typeFilter];
          queryClient.setQueryData(queryKey, context.previousData);
          setMockProperties(context.previousMockProperties);
        }
        toast.error('Có lỗi xảy ra khi phê duyệt tin đăng.');
      } else {
        toast.success(`[Mock] Đã phê duyệt tin đăng "${property.title}"!`);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return await propertyAdminApi.reject(id, reason);
    },
    onMutate: async ({ id, reason }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-properties'] });
      const queryKey = ['admin-properties', page, perPage, searchQuery, statusFilter, typeFilter];
      const previousData = queryClient.getQueryData(queryKey);
      const previousMockProperties = mockProperties;

      setMockProperties(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected', verification_status: 'rejected' } : p));
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          properties: old.properties.map((p: any) => p.id === id ? { ...p, status: 'rejected', verification_status: 'rejected' } : p)
        };
      });

      return { previousData, previousMockProperties };
    },
    onSuccess: (res, variables) => {
      if (res && res.success) {
        toast.success(res.message || `Đã từ chối duyệt tin đăng!`);
      } else {
        toast.error('Không thể từ chối tin đăng.');
      }
      setShowRejectDialog(false);
      setSelectedProperty(null);
      setRejectReason('');
    },
    onError: (error, variables, context: any) => {
      if (data?.useRealApi) {
        if (context) {
          const queryKey = ['admin-properties', page, perPage, searchQuery, statusFilter, typeFilter];
          queryClient.setQueryData(queryKey, context.previousData);
          setMockProperties(context.previousMockProperties);
        }
        toast.error('Có lỗi xảy ra khi từ chối duyệt tin đăng.');
      } else {
        toast.success(`[Mock] Đã từ chối duyệt tin đăng!`);
      }
      setShowRejectDialog(false);
      setSelectedProperty(null);
      setRejectReason('');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (property: LocalProperty) => {
      return await propertyAdminApi.delete(property.id);
    },
    onMutate: async (property: LocalProperty) => {
      await queryClient.cancelQueries({ queryKey: ['admin-properties'] });
      const queryKey = ['admin-properties', page, perPage, searchQuery, statusFilter, typeFilter];
      const previousData = queryClient.getQueryData(queryKey);
      const previousMockProperties = mockProperties;

      setMockProperties(prev => prev.filter(p => p.id !== property.id));
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          properties: old.properties.filter((p: any) => p.id !== property.id)
        };
      });

      return { previousData, previousMockProperties };
    },
    onSuccess: (res, property) => {
      if (res && res.success) {
        toast.success(res.message || 'Xóa tin đăng thành công!');
      } else {
        toast.error('Không thể xóa tin đăng.');
      }
    },
    onError: (error, property, context: any) => {
      if (data?.useRealApi) {
        if (context) {
          const queryKey = ['admin-properties', page, perPage, searchQuery, statusFilter, typeFilter];
          queryClient.setQueryData(queryKey, context.previousData);
          setMockProperties(context.previousMockProperties);
        }
        toast.error('Có lỗi xảy ra khi xóa tin đăng.');
      } else {
        toast.success(`[Mock] Xóa tin đăng "${property.title}" thành công!`);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    }
  });

  const handleApprove = (property: LocalProperty) => {
    approveMutation.mutate(property);
  };

  const handleReject = () => {
    if (selectedProperty) {
      rejectMutation.mutate({ id: selectedProperty.id, reason: rejectReason });
    }
  };

  const handleDelete = async (property: LocalProperty) => {
    const isConfirmed = await confirm({
      title: 'Xóa vĩnh viễn tin đăng',
      description: `Bạn có chắc chắn muốn xóa vĩnh viễn tin đăng "${property.title}" không? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa vĩnh viễn',
      cancelText: 'Hủy',
      variant: 'destructive'
    });
    if (isConfirmed) {
      deleteMutation.mutate(property);
    }
  };

  const startIndex = (page - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, displayTotal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tin đăng</h1>
          <p className="text-gray-500">Xem xét hồ sơ, phê duyệt hoặc từ chối các tin đăng bất động sản trên sàn</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="text-sm px-4 py-2 bg-cta hover:bg-cta-dark text-white border-0 shadow-sm rounded-full font-bold">
            {pendingCount} tin chờ duyệt
          </Badge>
        )}
      </div>

      {/* Pill Status Tab filters & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        {/* Left: Pill Status Filters */}
        <div className="flex flex-wrap gap-1.5 bg-gray-50 p-1 rounded-full w-fit border border-gray-150">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            const count = tab.value === 'all'
              ? displayTotal
              : (data?.useRealApi 
                  ? displayTotal // simplify: showing displayTotal or count if we have local list
                  : mockProperties.filter(p => p.status === tab.value).length);

            return (
              <button
                key={tab.value}
                onClick={() => handleStatusChange(tab.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
                }`}
              >
                {tab.label}
                {(!data?.useRealApi || tab.value === 'all') && (
                  <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-200/80 text-gray-600'
                  }`}>
                    {tab.value === 'all' ? displayTotal : mockProperties.filter(p => p.status === tab.value).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Search input & Type Select */}
        <div className="flex items-center gap-3 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm theo tiêu đề, danh mục, môi giới..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 rounded-xl border-gray-200 focus:ring-primary/20 focus:border-primary font-medium text-xs h-9.5"
            />
          </div>

          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-36 rounded-xl border-gray-200 text-xs font-semibold text-gray-700 h-9.5">
              <SelectValue placeholder="Loại tin" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="sell">Mua bán</SelectItem>
              <SelectItem value="rent">Cho thuê</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Card Table View */}
      <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="border-b border-gray-100">
                  <TableHead className="w-16 font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5 pl-6">ID</TableHead>
                  <TableHead className="w-[320px] font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Tin đăng</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Người đăng</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Trạng thái</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Xác minh</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Ngày đăng</TableHead>
                  <TableHead className="text-right font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5 pr-6">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(perPage)].map((_, idx) => (
                    <TableRow key={idx} className="border-b border-gray-100/60">
                      <TableCell className="pl-6"><div className="h-4 w-6 bg-gray-100 rounded animate-pulse" /></TableCell>
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
                      <TableCell><div className="h-5.5 w-16 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell><div className="h-5.5 w-20 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-20 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell className="text-right pr-6"><div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : displayProperties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-gray-400 font-medium">
                      Không tìm thấy tin đăng bất động sản nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayProperties.map((property) => {
                    const verification = verificationConfig[property.verification_status as keyof typeof verificationConfig] || verificationConfig.pending;
                    const VerificationIcon = verification.icon;

                    return (
                      <TableRow key={property.id} className="hover:bg-gray-50/40 border-b border-gray-100 transition-colors">
                        {/* ID */}
                        <TableCell className="font-bold text-gray-400 text-xs pl-6">
                          #{property.id}
                        </TableCell>

                        {/* Title & Info */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={property.thumbnail}
                              alt=""
                              className="w-11 h-11 rounded-xl object-cover bg-gray-50 border border-gray-100 shadow-sm shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100&h=100&fit=crop';
                              }}
                            />
                            <div className="min-w-0 max-w-[240px]">
                              <a
                                href={`${CLIENT_URL}/${property.type === 'sell' ? 'mua-ban' : 'cho-thue'}/${property.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-gray-900 text-[13px] leading-snug line-clamp-1 hover:text-primary transition-colors cursor-pointer"
                              >
                                {property.title}
                              </a>
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-semibold mt-1">
                                <span className="text-cta font-extrabold">{formatPrice(property.price)}</span>
                                <span>•</span>
                                <span>{property.area}m²</span>
                                <span>•</span>
                                <span className="text-gray-450">{property.category}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Broker/User */}
                        <TableCell>
                          <p className="font-bold text-gray-800 text-[12.5px] flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-gray-400" />
                            {property.user.name}
                          </p>
                          <p className="text-[10.5px] text-gray-400 mt-0.5 font-medium">{property.province}</p>
                        </TableCell>

                        {/* Status badge */}
                        <TableCell>
                          <StatusBadge status={property.status as 'active' | 'pending' | 'inactive' | 'expired' | 'rejected'} className="font-bold px-2.5 py-0.5" />
                        </TableCell>

                        {/* Verification Status */}
                        <TableCell>
                          <Badge className={`${verification.color} border-0 shadow-none font-bold py-0.5 px-2 text-[10px] uppercase rounded-full tracking-wider flex items-center gap-1 w-fit`}>
                            <VerificationIcon className="h-3.5 w-3.5 shrink-0" />
                            {verification.label}
                          </Badge>
                        </TableCell>

                        {/* Created Date */}
                        <TableCell className="text-gray-500 font-semibold text-[11.5px] whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {formatDate(property.created_at)}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-gray-100 rounded-lg text-gray-500">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
                              <DropdownMenuItem
                                onClick={() => window.open(`${CLIENT_URL}/${property.type === 'sell' ? 'mua-ban' : 'cho-thue'}/${property.slug}`, '_blank', 'noopener,noreferrer')}
                                className="flex items-center w-full cursor-pointer font-medium text-gray-700 hover:text-gray-900"
                              >
                                <Eye className="h-4 w-4 mr-2 text-gray-400" />
                                Xem tin gốc
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {property.status === 'pending' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleApprove(property)} className="cursor-pointer text-green-600 font-semibold hover:bg-green-50 rounded-lg">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Phê duyệt tin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedProperty(property);
                                      setShowRejectDialog(true);
                                    }}
                                    className="text-red-600 cursor-pointer font-semibold hover:bg-red-50 rounded-lg"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Từ chối duyệt
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem onClick={() => handleDelete(property)} className="text-red-655 cursor-pointer font-semibold hover:bg-red-50/50 rounded-lg">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa vĩnh viễn
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
          </div>

          {/* Premium Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 gap-4">
            {/* Left: Per page size selector & counts */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-bold">Số lượng hàng:</span>
              <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v || '5')); setPage(1); }}>
                <SelectTrigger className="h-8 w-24 rounded-xl border-gray-200 text-xs font-bold text-gray-700 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="5">5 hàng</SelectItem>
                  <SelectItem value="10">10 hàng</SelectItem>
                  <SelectItem value="15">15 hàng</SelectItem>
                  <SelectItem value="20">20 hàng</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-500 font-bold ml-1.5">
                {displayTotal > 0 ? `${startIndex + 1}-${endIndex}` : '0'} / {displayTotal} tin đăng
              </span>
            </div>

            {/* Right: Numeric pagination triggers */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-150/80 shadow-sm w-fit">
              <Button
                variant="ghost"
                size="icon"
                className="h-7.5 w-7.5 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30"
                disabled={page === 1}
                onClick={() => setPage(1)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7.5 w-7.5 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Individual numeric pages */}
              {Array.from({ length: displayLastPage }, (_, i) => i + 1).map((p) => {
                const isCurrent = p === page;
                return (
                  <Button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-7.5 w-7.5 rounded-lg font-extrabold text-[11px] transition-all p-0 ${
                      isCurrent
                        ? 'bg-gray-900 text-white shadow-sm border-0 hover:bg-gray-800'
                        : 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {p}
                  </Button>
                );
              })}

              <Button
                variant="ghost"
                size="icon"
                className="h-7.5 w-7.5 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30"
                disabled={page === displayLastPage}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7.5 w-7.5 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30"
                disabled={page === displayLastPage}
                onClick={() => setPage(displayLastPage)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl border border-gray-100 overflow-hidden p-0 shadow-lg">
          <div className="bg-gray-50 border-b border-gray-100 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900">Từ chối duyệt tin đăng</DialogTitle>
              <DialogDescription className="text-gray-500 text-xs mt-1">
                Vui lòng nhập lý do cụ thể. Lý do từ chối sẽ được lưu lại hệ thống và gửi thông báo trực tiếp đến môi giới.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Giá bán không hợp lệ, hình ảnh bị trùng lặp hoặc mờ, thiếu thông tin pháp lý..."
              rows={4}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold placeholder-gray-400 transition-all resize-none"
            />
          </div>

          <div className="border-t border-gray-100 p-6 pt-4 bg-gray-50 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedProperty(null);
                setRejectReason('');
              }}
              className="rounded-xl font-bold h-10 text-xs px-4"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleReject}
              className="bg-cta hover:bg-cta-dark text-white rounded-xl font-bold h-10 text-xs px-5 border-0 shadow-sm"
            >
              Từ chối duyệt tin
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
