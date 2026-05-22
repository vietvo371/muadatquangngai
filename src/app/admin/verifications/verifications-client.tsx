'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Clock,
  ShieldCheck,
  Building,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { verificationApi, type Verification } from '@/lib/admin-api';

type VerificationStatus = 'pending' | 'approved' | 'rejected';
type VerificationType = 'agent' | 'agency';

// Mock data fallback with authentic local Quang Ngai agents/agencies
const MOCK_VERIFICATIONS = [
  {
    id: 1,
    type: 'agent',
    status: 'pending',
    license_number: 'MG-2026-QN-089',
    agency_name: null,
    documents: [
      'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&h=400&fit=crop',
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&h=400&fit=crop'
    ],
    user: {
      id: 101,
      name: 'Nguyễn Hoàng Sơn',
      email: 'hoangson.datquangngai@gmail.com',
      phone: '0914 123 456',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
    },
    created_at: '2026-05-20T10:30:00Z'
  },
  {
    id: 2,
    type: 'agency',
    status: 'pending',
    license_number: 'GPKD-570298831',
    agency_name: 'Bất Động Sản Đức Phổ Land',
    documents: [
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&h=400&fit=crop'
    ],
    user: {
      id: 102,
      name: 'Phạm Thị Minh Trang',
      email: 'minhtrang.ducpholand@gmail.com',
      phone: '0905 987 654',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop'
    },
    created_at: '2026-05-19T15:45:00Z'
  },
  {
    id: 3,
    type: 'agent',
    status: 'approved',
    license_number: 'MG-2025-QN-012',
    agency_name: null,
    documents: [
      'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&h=400&fit=crop'
    ],
    user: {
      id: 103,
      name: 'Lê Quốc Khánh',
      email: 'khanh.leland@gmail.com',
      phone: '0983 234 567',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
    },
    created_at: '2026-05-18T09:20:00Z'
  },
  {
    id: 4,
    type: 'agency',
    status: 'approved',
    license_number: 'GPKD-570992338',
    agency_name: 'Bình Sơn House',
    documents: [
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&h=400&fit=crop'
    ],
    user: {
      id: 104,
      name: 'Trần Minh Hải',
      email: 'minhhai@binhsonhouse.vn',
      phone: '0919 778 899',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
    },
    created_at: '2026-05-17T11:10:00Z'
  },
  {
    id: 5,
    type: 'agent',
    status: 'rejected',
    license_number: 'MG-2024-QN-998',
    agency_name: null,
    documents: [],
    user: {
      id: 105,
      name: 'Võ Thị Bé',
      email: 'vothibe1992@gmail.com',
      phone: '0966 333 444',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
    },
    reject_reason: 'Chứng chỉ hành nghề đã hết hạn sử dụng từ năm 2025. Tài liệu đính kèm mờ không thể đọc rõ thông tin.',
    created_at: '2026-05-15T14:10:00Z'
  },
  {
    id: 6,
    type: 'agent',
    status: 'pending',
    license_number: 'MG-2026-QN-102',
    agency_name: null,
    documents: [
      'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&h=400&fit=crop'
    ],
    user: {
      id: 106,
      name: 'Huỳnh Tấn Đạt',
      email: 'tandat.moducland@gmail.com',
      phone: '0977 456 789',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop'
    },
    created_at: '2026-05-14T08:15:00Z'
  },
  {
    id: 7,
    type: 'agency',
    status: 'approved',
    license_number: 'GPKD-570119934',
    agency_name: 'Địa Ốc Nghĩa Hành',
    documents: [
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&h=400&fit=crop'
    ],
    user: {
      id: 107,
      name: 'Nguyễn Văn An',
      email: 'vanan@diaocnghiahanh.com',
      phone: '0912 345 678',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
    },
    created_at: '2026-05-13T10:00:00Z'
  },
  {
    id: 8,
    type: 'agent',
    status: 'approved',
    license_number: 'MG-2026-QN-005',
    agency_name: null,
    documents: [
      'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&h=400&fit=crop'
    ],
    user: {
      id: 108,
      name: 'Trương Thị Kim Chi',
      email: 'kimchi.bdsquangngai@gmail.com',
      phone: '0903 555 666',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop'
    },
    created_at: '2026-05-12T16:20:00Z'
  },
  {
    id: 9,
    type: 'agent',
    status: 'pending',
    license_number: 'MG-2026-QN-114',
    agency_name: null,
    documents: [
      'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&h=400&fit=crop'
    ],
    user: {
      id: 109,
      name: 'Phan Thanh Bình',
      email: 'thanhbinh.trabong@gmail.com',
      phone: '0989 112 233',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop'
    },
    created_at: '2026-05-11T09:40:00Z'
  },
  {
    id: 10,
    type: 'agent',
    status: 'rejected',
    license_number: 'MG-2024-QN-412',
    agency_name: null,
    documents: [],
    user: {
      id: 110,
      name: 'Bùi Tấn Lực',
      email: 'tanluc.bato@gmail.com',
      phone: '0979 445 566',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop'
    },
    reject_reason: 'Ảnh chứng minh nhân dân/CCCD không khớp với thông tin đăng ký tài khoản.',
    created_at: '2026-05-10T14:15:00Z'
  }
];

const statusConfig: Record<VerificationStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Chờ duyệt', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100/60 border-yellow-200/50', icon: Eye },
  approved: { label: 'Đã duyệt', color: 'bg-green-50 text-green-700 hover:bg-green-100/60 border-green-200/50', icon: CheckCircle },
  rejected: { label: 'Từ chối', color: 'bg-red-50 text-red-700 hover:bg-red-100/60 border-red-200/50', icon: XCircle },
};

const typeConfig: Record<VerificationType, { label: string; color: string; icon: React.ElementType }> = {
  agent: { label: 'Môi giới cá nhân', color: 'bg-blue-50 text-blue-700 border-blue-200/50', icon: ShieldCheck },
  agency: { label: 'Công ty đại lý', color: 'bg-purple-50 text-purple-700 border-purple-200/50', icon: Building },
};

const statusTabs = [
  { value: 'all', label: 'Tất cả yêu cầu' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
];

export default function VerificationsClient() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  // Local mock state to support fallback mock interactions
  const [mockVerifications, setMockVerifications] = useState<Verification[]>(MOCK_VERIFICATIONS as Verification[]);

  // Filter & search states
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  // Detail & Action Dialogs
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // TanStack Query v5 to fetch verifications
  const { data, isLoading } = useQuery({
    queryKey: ['admin-verifications', statusFilter],
    queryFn: async () => {
      try {
        const params: Record<string, string> = {};
        if (statusFilter !== 'all') params.type = statusFilter;

        const res = await verificationApi.list(params);
        if (res && res.data) {
          return { verifications: res.data, useRealApi: true };
        }
      } catch (error) {
        console.error('Error fetching verifications, using mock data:', error);
      }
      return { verifications: [] as Verification[], useRealApi: false };
    }
  });

  const verifications = useMemo(() => {
    if (data?.useRealApi) {
      return data.verifications;
    }
    return mockVerifications;
  }, [data, mockVerifications]);

  // Filter logic (combined)
  const filteredVerifications = useMemo(() => {
    return verifications.filter((v) => {
      const matchStatus = statusFilter === 'all' || v.status === statusFilter;
      const matchType = typeFilter === 'all' || v.type === typeFilter;
      const matchSearch = !searchQuery.trim() || 
        v.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.user?.phone?.includes(searchQuery) ||
        v.license_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.agency_name && v.agency_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStatus && matchType && matchSearch;
    });
  }, [verifications, statusFilter, typeFilter, searchQuery]);

  // Pagination calculations
  const totalCount = filteredVerifications.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const pageIndex = Math.min(page, totalPages);
  const startIndex = (pageIndex - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalCount);
  
  const paginatedVerifications = useMemo(() => {
    return filteredVerifications.slice(startIndex, endIndex);
  }, [filteredVerifications, startIndex, endIndex]);

  // Stats calculation
  const pendingCount = verifications.filter((v) => v.status === 'pending').length;
  const approvedCount = verifications.filter((v) => v.status === 'approved').length;
  const rejectedCount = verifications.filter((v) => v.status === 'rejected').length;

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return await verificationApi.approve(id);
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['admin-verifications'] });
      const queryKey = ['admin-verifications', statusFilter];
      const previousData = queryClient.getQueryData(queryKey);
      const previousMockVerifications = mockVerifications;

      setMockVerifications((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: 'approved' } : v))
      );

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          verifications: old.verifications.map((v: any) =>
            v.id === id ? { ...v, status: 'approved' } : v
          )
        };
      });

      return { previousData, previousMockVerifications };
    },
    onSuccess: (res, id) => {
      toast.success('Đã duyệt yêu cầu xác thực thành công!');
      setSelectedVerification(null);
    },
    onError: (error, id, context: any) => {
      if (data?.useRealApi) {
        if (context) {
          queryClient.setQueryData(['admin-verifications', statusFilter], context.previousData);
          setMockVerifications(context.previousMockVerifications);
        }
        toast.error('Có lỗi xảy ra khi phê duyệt yêu cầu xác thực.');
      } else {
        toast.success('[Mock] Đã duyệt yêu cầu xác thực thành công!');
      }
      setSelectedVerification(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return await verificationApi.reject(id, reason);
    },
    onMutate: async ({ id, reason }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-verifications'] });
      const queryKey = ['admin-verifications', statusFilter];
      const previousData = queryClient.getQueryData(queryKey);
      const previousMockVerifications = mockVerifications;

      setMockVerifications((prev) =>
        prev.map((v) =>
          v.id === id
            ? { ...v, status: 'rejected', reject_reason: reason }
            : v
        )
      );

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          verifications: old.verifications.map((v: any) =>
            v.id === id
              ? { ...v, status: 'rejected', reject_reason: reason }
              : v
          )
        };
      });

      return { previousData, previousMockVerifications };
    },
    onSuccess: (res, variables) => {
      toast.success('Đã từ chối yêu cầu xác thực thành công.');
      setShowRejectDialog(false);
      setSelectedVerification(null);
      setRejectReason('');
    },
    onError: (error, variables, context: any) => {
      if (data?.useRealApi) {
        if (context) {
          queryClient.setQueryData(['admin-verifications', statusFilter], context.previousData);
          setMockVerifications(context.previousMockVerifications);
        }
        toast.error('Có lỗi xảy ra khi từ chối yêu cầu xác thực.');
      } else {
        toast.success('[Mock] Đã từ chối yêu cầu xác thực thành công.');
      }
      setShowRejectDialog(false);
      setSelectedVerification(null);
      setRejectReason('');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
    }
  });

  const handleApprove = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Phê duyệt yêu cầu xác thực',
      description: 'Bạn có chắc chắn muốn phê duyệt yêu cầu xác thực cho môi giới này không?',
      confirmText: 'Phê duyệt',
      cancelText: 'Hủy',
      variant: 'default'
    });
    if (isConfirmed) {
      approveMutation.mutate(id);
    }
  };

  const handleRejectSubmit = () => {
    if (!selectedVerification || !rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối.');
      return;
    }
    rejectMutation.mutate({ id: selectedVerification.id, reason: rejectReason });
  };

  const isActionPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Xác thực môi giới</h1>
          <p className="text-sm text-gray-500 mt-1">Duyệt hồ sơ đăng ký môi giới cá nhân và công ty đại lý bất động sản Quảng Ngãi</p>
        </div>
      </div>

      {/* Modern Analytics Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl border border-yellow-100/50">
              <Eye className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{pendingCount}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Yêu cầu chờ duyệt</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl border border-green-100/50">
              <CheckCircle className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{approvedCount}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Đã xác thực</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100/50">
              <XCircle className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{rejectedCount}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Yêu cầu từ chối</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pill status filter & search controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        {/* Left: Pill Status Filters */}
        <div className="flex flex-wrap gap-1.5 bg-gray-50 p-1 rounded-full w-fit border border-gray-150">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            const count = tab.value === 'all'
              ? verifications.length
              : verifications.filter(v => v.status === tab.value).length;

            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
                }`}
              >
                {tab.label}
                <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-200/80 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Search & Type Filter */}
        <div className="flex items-center gap-3 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm theo tên, email, GPLX..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-10 rounded-xl border-gray-200 focus:ring-primary/20 focus:border-primary font-medium text-xs h-9.5"
            />
          </div>

          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v || 'all'); setPage(1); }}>
            <SelectTrigger className="w-44 rounded-xl border-gray-200 text-xs font-semibold text-gray-700 h-9.5 bg-white">
              <SelectValue placeholder="Loại đối tượng" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tất cả đối tượng</SelectItem>
              <SelectItem value="agent">Môi giới cá nhân</SelectItem>
              <SelectItem value="agency">Công ty đại lý</SelectItem>
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
                  <TableHead className="w-[280px] font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Môi giới / Đại lý</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Phân loại</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Thông tin / Giấy phép</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Hồ sơ pháp lý</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Ngày gửi</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Trạng thái</TableHead>
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
                          <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
                            <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><div className="h-5.5 w-24 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-24 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell><div className="h-6 w-12 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-20 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-5.5 w-16 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell className="text-right pr-6"><div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedVerifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-gray-400 font-medium">
                      Không tìm thấy yêu cầu xác thực nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVerifications.map((v) => {
                    const typeCfg = typeConfig[v.type as VerificationType] || typeConfig.agent;
                    const statusCfg = statusConfig[v.status as VerificationStatus] || statusConfig.pending;
                    const TypeIcon = typeCfg.icon;
                    const StatusIcon = statusCfg.icon;

                    return (
                      <TableRow key={v.id} className="hover:bg-gray-50/40 border-b border-gray-100 transition-colors">
                        {/* ID */}
                        <TableCell className="font-bold text-gray-400 text-xs pl-6">
                          #{v.id}
                        </TableCell>

                        {/* Agent User Profile */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-gray-100 shadow-sm">
                              <AvatarImage src={v.user?.avatar || undefined} />
                              <AvatarFallback className="bg-gray-100 text-gray-700 font-extrabold text-xs">
                                {v.user?.name?.charAt(0) ?? '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-gray-900 text-[13px] leading-snug">{v.user?.name}</p>
                              <p className="text-xs text-gray-500 font-medium mt-0.5">{v.user?.email}</p>
                              {v.user?.phone && (
                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{v.user.phone}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Classification */}
                        <TableCell>
                          <Badge className={`${typeCfg.color} border border-gray-100/50 shadow-none font-bold py-0.5 px-2.5 text-[10px] rounded-full tracking-wide flex items-center gap-1.5 w-fit`}>
                            <TypeIcon className="h-3.5 w-3.5 shrink-0" />
                            {typeCfg.label}
                          </Badge>
                        </TableCell>

                        {/* Licenses */}
                        <TableCell>
                          <div>
                            {v.type === 'agency' && v.agency_name ? (
                              <p className="font-bold text-gray-800 text-[12.5px] leading-snug">{v.agency_name}</p>
                            ) : (
                              <p className="text-xs text-gray-400 font-medium italic">Không có tên công ty</p>
                            )}
                            {v.license_number ? (
                              <p className="text-[10.5px] text-gray-500 font-bold flex items-center gap-1 mt-1">
                                <FileText className="h-3 w-3 text-gray-400" />
                                {v.type === 'agency' ? 'GPKD:' : 'CCHN:'} {v.license_number}
                              </p>
                            ) : (
                              <p className="text-[10.5px] text-gray-400 font-medium italic mt-1">Chưa cập nhật GPLX</p>
                            )}
                          </div>
                        </TableCell>

                        {/* Attached documents */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {v.documents && v.documents.length > 0 ? (
                              v.documents.map((doc: string, idx: number) => (
                                <a
                                  key={idx}
                                  href={doc}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-8 w-8 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-primary-light flex items-center justify-center transition-all group"
                                  title={`Xem tài liệu ${idx + 1}`}
                                >
                                  <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary transition-colors" />
                                </a>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 font-medium italic">— Trống —</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Created time */}
                        <TableCell className="text-gray-500 font-semibold text-[11.5px] whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {formatDate(v.created_at)}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge className={`${statusCfg.color} border border-gray-100/50 shadow-none font-bold py-0.5 px-2.5 text-[10px] rounded-full tracking-wide flex items-center gap-1.5 w-fit`}>
                            <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                            {statusCfg.label}
                          </Badge>
                        </TableCell>

                        {/* Action buttons */}
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedVerification(v)}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 transition-all text-gray-600 hover:text-gray-900"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {v.status === 'pending' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 transition-all text-gray-500 hover:text-gray-800"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl w-40">
                                  <DropdownMenuItem
                                    onClick={() => handleApprove(v.id)}
                                    className="text-green-600 font-bold text-xs gap-2 focus:text-green-700 focus:bg-green-50/50 rounded-lg cursor-pointer"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Duyệt hồ sơ
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedVerification(v);
                                      setRejectReason('');
                                      setShowRejectDialog(true);
                                    }}
                                    className="text-red-600 font-bold text-xs gap-2 focus:text-red-700 focus:bg-red-50/50 rounded-lg cursor-pointer"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Từ chối duyệt
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
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
                {totalCount > 0 ? `${startIndex + 1}-${endIndex}` : '0'} / {totalCount} yêu cầu
              </span>
            </div>

            {/* Right: Numeric pagination triggers */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-150/80 shadow-sm w-fit">
              <Button
                variant="ghost"
                size="icon"
                className="h-7.5 w-7.5 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30"
                disabled={pageIndex === 1}
                onClick={() => setPage(1)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7.5 w-7.5 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30"
                disabled={pageIndex === 1}
                onClick={() => setPage(pageIndex - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Individual numeric pages */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isCurrent = p === pageIndex;
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
                disabled={pageIndex === totalPages}
                onClick={() => setPage(pageIndex + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7.5 w-7.5 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30"
                disabled={pageIndex === totalPages}
                onClick={() => setPage(totalPages)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedVerification && !showRejectDialog} onOpenChange={(open) => !open && setSelectedVerification(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl overflow-hidden border border-gray-100 p-0 shadow-lg bg-white">
          <div className="bg-gray-50 border-b border-gray-100 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="h-5.5 w-5.5 text-primary" />
                Chi tiết hồ sơ xác thực
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-xs mt-1">
                Xem xét hồ sơ pháp lý, chứng chỉ hành nghề hoặc giấy phép đăng ký kinh doanh.
              </DialogDescription>
            </DialogHeader>
          </div>

          {selectedVerification && (
            <div className="p-6 space-y-5">
              {/* User Avatar + Profile Info */}
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src={selectedVerification.user?.avatar || undefined} />
                  <AvatarFallback className="bg-gray-200 text-gray-800 font-extrabold text-sm">
                    {selectedVerification.user?.name?.charAt(0) ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-gray-900 text-[14px] leading-snug">{selectedVerification.user?.name}</p>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">{selectedVerification.user?.email}</p>
                  {selectedVerification.user?.phone && (
                    <p className="text-xs text-primary font-bold mt-1">SĐT: {selectedVerification.user.phone}</p>
                  )}
                </div>
              </div>

              {/* License details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100/50">
                  <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1">Loại đối tượng</p>
                  <p className="font-extrabold text-gray-800 text-[12px]">
                    {selectedVerification.type === 'agent' ? 'Môi giới cá nhân' : 'Công ty đại lý'}
                  </p>
                </div>
                {selectedVerification.agency_name && (
                  <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100/50">
                     <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1">Tên công ty đại lý</p>
                     <p className="font-extrabold text-gray-800 text-[12px]">{selectedVerification.agency_name}</p>
                  </div>
                )}
                <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100/50">
                  <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1">
                    {selectedVerification.type === 'agency' ? 'Số đăng ký GPKD' : 'Số chứng chỉ môi giới'}
                  </p>
                  <p className="font-extrabold text-gray-800 text-[12px]">{selectedVerification.license_number || 'Chưa cập nhật'}</p>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100/50">
                  <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px] mb-1">Trạng thái hiện tại</p>
                  <Badge className={`${statusConfig[selectedVerification.status as VerificationStatus]?.color} border-0 shadow-none font-extrabold px-2 py-0.5 rounded-full text-[10px]`}>
                    {statusConfig[selectedVerification.status as VerificationStatus]?.label}
                  </Badge>
                </div>
              </div>

              {/* Reject reason (if rejected) */}
              {selectedVerification.status === 'rejected' && selectedVerification.reject_reason && (
                <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl text-xs space-y-1">
                  <p className="text-red-700 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Lý do từ chối
                  </p>
                  <p className="text-red-600 font-semibold leading-relaxed">{selectedVerification.reject_reason}</p>
                </div>
              )}

              {/* Documents attachments */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Hồ sơ tài liệu pháp lý đính kèm</p>
                {selectedVerification.documents && selectedVerification.documents.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {selectedVerification.documents.map((doc: string, idx: number) => (
                      <a
                        key={idx}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 border border-gray-150 rounded-xl hover:bg-gray-50 hover:border-primary/45 transition-all text-xs font-bold text-gray-700 group"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                          Hồ sơ đính kèm {idx + 1}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary transition-colors shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 font-semibold italic">
                    Chưa đính kèm bất kỳ tệp tin pháp lý nào
                  </div>
                )}
              </div>

              {/* Bottom Actions if Pending */}
              {selectedVerification.status === 'pending' && (
                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl font-bold text-xs h-9.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200/50 hover:border-red-300"
                    onClick={() => {
                      setRejectReason('');
                      setShowRejectDialog(true);
                    }}
                    disabled={isActionPending}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Từ chối duyệt
                  </Button>
                  <Button
                    className="flex-1 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs h-9.5"
                    onClick={() => handleApprove(selectedVerification.id)}
                    disabled={isActionPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-1.5 text-green-400" />
                    Duyệt hồ sơ
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={(open) => !open && setShowRejectDialog(false)}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl overflow-hidden border border-gray-100 p-0 shadow-lg bg-white">
          <div className="bg-gray-50 border-b border-gray-100 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-cta" />
                Từ chối duyệt hồ sơ
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-xs mt-1">
                Nhập lý do từ chối rõ ràng để môi giới biết thông tin và nộp lại hồ sơ chính xác hơn.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Ảnh chứng chỉ hành nghề bị mờ không nhìn rõ số hiệu, hoặc hết hạn sử dụng..."
              rows={4}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder:text-gray-400"
            />

            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason('');
                }}
                className="rounded-xl font-bold text-xs h-9.5 text-gray-500 hover:bg-gray-100"
                disabled={isActionPending}
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleRejectSubmit}
                className="rounded-xl bg-cta hover:bg-cta-dark text-white font-bold text-xs h-9.5"
                disabled={!rejectReason.trim() || isActionPending}
              >
                {isActionPending ? 'Đang từ chối...' : 'Xác nhận từ chối'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
