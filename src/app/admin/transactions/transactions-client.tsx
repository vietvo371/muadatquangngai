'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  TrendingUp,
  History,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/formatters';
import { transactionApi, type Transaction } from '@/lib/admin-api';

type TransactionStatus = 'pending' | 'success' | 'failed' | 'refunded';
type TransactionType = 'deposit' | 'purchase' | 'withdraw' | 'refund';

const statusConfig: Record<TransactionStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Chờ duyệt', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100/60 border-yellow-200/50', icon: Clock },
  success: { label: 'Thành công', color: 'bg-green-50 text-green-700 hover:bg-green-100/60 border-green-200/50', icon: CheckCircle },
  failed: { label: 'Thất bại', color: 'bg-red-50 text-red-700 hover:bg-red-100/60 border-red-200/50', icon: XCircle },
  refunded: { label: 'Hoàn tiền', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100/60 border-blue-200/50', icon: RotateCcw },
};

const typeConfig: Record<TransactionType, { label: string; color: string; icon: React.ElementType }> = {
  deposit: { label: 'Nạp tiền vào ví', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: ArrowUpRight },
  purchase: { label: 'Mua gói dịch vụ', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: ArrowDownLeft },
  withdraw: { label: 'Rút tiền ví', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: ArrowDownLeft },
  refund: { label: 'Hoàn tiền ví', color: 'bg-teal-50 text-teal-700 border-teal-100', icon: RotateCcw },
};

const statusTabs = [
  { value: 'all', label: 'Tất cả GD' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'success', label: 'Thành công' },
  { value: 'failed', label: 'Thất bại' },
  { value: 'refunded', label: 'Hoàn tiền' },
];

export default function TransactionsClient() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  // Filters state
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  // Actions Dialog state
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // TanStack Query to fetch transactions list
  const { data: listData, isLoading } = useQuery({
    queryKey: ['admin-transactions', statusFilter, typeFilter],
    queryFn: async () => {
      try {
        const params: Record<string, string> = {};
        if (statusFilter !== 'all') params.status = statusFilter;
        if (typeFilter !== 'all') params.type = typeFilter;

        const res = await transactionApi.list(params);
        if (res && res.data) {
          return { transactions: res.data, loaded: true };
        }
      } catch (error) {
        console.error('Không tải được danh sách giao dịch:', error);
      }
      return { transactions: [] as Transaction[], loaded: false };
    }
  });

  // TanStack Query to fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['admin-transaction-stats'],
    queryFn: async () => {
      try {
        const res = await transactionApi.stats();
        if (res) {
          return {
            total_revenue: Number(res.total_revenue || 0),
            total_transactions: Number(res.total_transactions || 0),
            pending_count: Number(res.pending_count || 0),
            loaded: true
          };
        }
      } catch (error) {
        console.error('Không tải được thống kê giao dịch:', error);
      }
      return {
        total_revenue: 0,
        total_transactions: 0,
        pending_count: 0,
        loaded: false
      };
    }
  });

  // CHỈ dùng dữ liệu THẬT. Trước đây khi API lỗi, trang này rơi về danh sách giao dịch bịa và
  // panel doanh thu được tính từ chính số bịa đó — quản trị viên đọc ra con số tiền không tồn tại
  // và bấm Phê duyệt/Hoàn tiền trên id không có thật. Thà hiện bảng rỗng + báo lỗi tải.
  const transactions = useMemo(() => listData?.transactions ?? [], [listData]);

  /** Tải danh sách thất bại → cảnh báo rõ thay vì im lặng hiện bảng rỗng. */
  const listFailed = !!listData && !listData.loaded;

  /** Thống kê thất bại → hiện dấu gạch ngang, tuyệt đối không hiện số tự tính. */
  const statsFailed = !!statsData && !statsData.loaded;

  const stats = statsData ?? { total_revenue: 0, total_transactions: 0, pending_count: 0 };

  // Lọc phía client trên dữ liệu thật đã tải về (tìm nhanh theo từ khoá)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchStatus = statusFilter === 'all' || tx.status === statusFilter;
      const matchType = typeFilter === 'all' || tx.type === typeFilter;
      const matchSearch = !searchQuery.trim() || 
        tx.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.amount?.toString().includes(searchQuery) ||
        tx.id?.toString().includes(searchQuery);
      return matchStatus && matchType && matchSearch;
    });
  }, [transactions, statusFilter, typeFilter, searchQuery]);

  // Pagination calculation
  const totalCount = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const pageIndex = Math.min(page, totalPages);
  const startIndex = (pageIndex - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalCount);

  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, startIndex, endIndex]);

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return await transactionApi.approve(id);
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['admin-transactions'] });
      const queryKey = ['admin-transactions', statusFilter, typeFilter];
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          transactions: old.transactions.map((tx: any) =>
            tx.id === id ? { ...tx, status: 'success' } : tx
          )
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Đã phê duyệt giao dịch thành công!');
    },
    // Lỗi thì LUÔN báo lỗi — trước đây nhánh không-có-API lại báo thành công giả.
    onError: (error, id, context: any) => {
      if (context) {
        queryClient.setQueryData(['admin-transactions', statusFilter, typeFilter], context.previousData);
      }
      toast.error(`Không phê duyệt được giao dịch #${id}. Giao dịch vẫn đang chờ duyệt, vui lòng thử lại.`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transaction-stats'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return await transactionApi.reject(id, reason);
    },
    onMutate: async ({ id, reason }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-transactions'] });
      const queryKey = ['admin-transactions', statusFilter, typeFilter];
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          transactions: old.transactions.map((tx: any) =>
            tx.id === id ? { ...tx, status: 'failed', reject_reason: reason } : tx
          )
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Đã từ chối giao dịch thành công.');
      setShowRejectDialog(false);
      setSelectedTx(null);
      setRejectReason('');
    },
    onError: (error, variables, context: any) => {
      if (context) {
        queryClient.setQueryData(['admin-transactions', statusFilter, typeFilter], context.previousData);
      }
      toast.error(`Không từ chối được giao dịch #${variables.id}. Trạng thái giao dịch chưa thay đổi, vui lòng thử lại.`);
      setShowRejectDialog(false);
      setSelectedTx(null);
      setRejectReason('');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transaction-stats'] });
    }
  });

  const refundMutation = useMutation({
    mutationFn: async (id: number) => {
      return await transactionApi.refund(id);
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['admin-transactions'] });
      const queryKey = ['admin-transactions', statusFilter, typeFilter];
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          transactions: old.transactions.map((tx: any) =>
            tx.id === id ? { ...tx, status: 'refunded' } : tx
          )
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Đã thực hiện hoàn tiền giao dịch thành công.');
    },
    onError: (error, id, context: any) => {
      if (context) {
        queryClient.setQueryData(['admin-transactions', statusFilter, typeFilter], context.previousData);
      }
      toast.error(`Không hoàn tiền được giao dịch #${id}. Chưa có khoản tiền nào được hoàn, vui lòng thử lại.`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transaction-stats'] });
    }
  });

  const handleApprove = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Phê duyệt giao dịch',
      description: 'Xác nhận duyệt giao dịch này? Số tiền sẽ được cộng vào tài khoản của người dùng.',
      confirmText: 'Phê duyệt',
      cancelText: 'Hủy',
      variant: 'default'
    });
    if (isConfirmed) {
      approveMutation.mutate(id);
    }
  };

  const handleRejectSubmit = () => {
    if (!selectedTx || !rejectReason.trim()) return;
    rejectMutation.mutate({ id: selectedTx.id, reason: rejectReason });
  };

  const handleRefund = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Hoàn tiền giao dịch',
      description: 'Bạn có chắc chắn muốn hoàn tiền cho giao dịch này? Hành động này không thể hoàn tác.',
      confirmText: 'Hoàn tiền',
      cancelText: 'Hủy',
      variant: 'destructive'
    });
    if (isConfirmed) {
      refundMutation.mutate(id);
    }
  };

  const isActionPending = approveMutation.isPending || rejectMutation.isPending || refundMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý giao dịch</h1>
          <p className="text-sm text-gray-500 mt-1">Duyệt giao dịch nạp tiền ví, thanh toán gói VIP và hoàn tiền của các tài khoản môi giới</p>
        </div>
      </div>

      {/* Tải dữ liệu thất bại — nói rõ, KHÔNG hiện bảng rỗng như thể chưa có giao dịch nào. */}
      {listFailed && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-[13px] text-red-800">
            <p className="font-semibold">Không tải được danh sách giao dịch từ máy chủ.</p>
            <p className="mt-0.5">Bảng bên dưới đang trống do lỗi kết nối, không phải vì hệ thống không có giao dịch. Vui lòng tải lại trang.</p>
          </div>
        </div>
      )}

      {statsFailed && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-[13px] text-red-800">
            <p className="font-semibold">Không tải được số liệu doanh thu từ máy chủ.</p>
            <p className="mt-0.5">Các ô thống kê đang hiển thị dấu gạch ngang thay vì số liệu. Vui lòng tải lại trang.</p>
          </div>
        </div>
      )}

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl border border-green-100/50">
              <TrendingUp className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{statsFailed ? '—' : formatPrice(stats.total_revenue)}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Tổng doanh thu nạp</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-gray-50 text-gray-600 rounded-xl border border-gray-100/50">
              <History className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{statsFailed ? '—' : stats.total_transactions}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Tổng số giao dịch</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl border border-yellow-100/50">
              <Clock className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{statsFailed ? '—' : stats.pending_count}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Giao dịch chờ duyệt</p>
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
              ? transactions.length
              : transactions.filter(t => t.status === tab.value).length;

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

        {/* Right: Search & Type dropdown */}
        <div className="flex items-center gap-3 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm theo ID, người dùng, số tiền..."
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
              <SelectValue placeholder="Loại giao dịch" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tất cả loại hình</SelectItem>
              <SelectItem value="deposit">Nạp tiền vào ví</SelectItem>
              <SelectItem value="purchase">Mua gói dịch vụ</SelectItem>
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
                  <TableHead className="w-[280px] font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Môi giới / Tài khoản</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Loại giao dịch</TableHead>
                  <TableHead className="text-right font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Số tiền</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Thời gian</TableHead>
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
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell><div className="h-5.5 w-24 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell className="text-right"><div className="h-4 w-16 bg-gray-100 rounded animate-pulse ml-auto" /></TableCell>
                      <TableCell><div className="h-4 w-20 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-5.5 w-16 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell className="text-right pr-6"><div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-gray-400 font-medium">
                      Không tìm thấy lịch sử giao dịch nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((tx) => {
                    const statusCfg = statusConfig[tx.status as TransactionStatus] || statusConfig.pending;
                    const typeCfg = typeConfig[tx.type as TransactionType] || typeConfig.deposit;
                    const StatusIcon = statusCfg.icon;
                    const TypeIcon = typeCfg.icon;

                    return (
                      <TableRow key={tx.id} className="hover:bg-gray-50/40 border-b border-gray-100 transition-colors">
                        {/* ID */}
                        <TableCell className="font-bold text-gray-400 text-xs pl-6">
                          #{tx.id}
                        </TableCell>

                        {/* User Profile */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-[13px] leading-snug">{tx.user?.name || 'N/A'}</p>
                              <p className="text-xs text-gray-500 font-medium mt-0.5">{tx.user?.email}</p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Transaction Type */}
                        <TableCell>
                          <Badge className={`${typeCfg.color} border border-gray-100/50 shadow-none font-bold py-0.5 px-2.5 text-[10px] rounded-full tracking-wide flex items-center gap-1.5 w-fit`}>
                            <TypeIcon className="h-3.5 w-3.5 shrink-0" />
                            {typeCfg.label}
                          </Badge>
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="text-right py-3 pr-4">
                          <p className={`font-black text-[13px] ${
                            tx.type === 'deposit' || tx.type === 'refund' ? 'text-green-600' : 'text-gray-900'
                          }`}>
                            {tx.type === 'deposit' || tx.type === 'refund' ? '+' : '-'} {formatPrice(tx.amount)}
                          </p>
                        </TableCell>

                        {/* Time */}
                        <TableCell className="text-gray-500 font-semibold text-[11.5px] whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {formatDate(tx.created_at)}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge className={`${statusCfg.color} border border-gray-100/50 shadow-none font-bold py-0.5 px-2.5 text-[10px] rounded-full tracking-wide flex items-center gap-1.5 w-fit`}>
                            <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                            {statusCfg.label}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            {tx.status === 'pending' && (
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
                                    onClick={() => handleApprove(tx.id)}
                                    className="text-green-600 font-bold text-xs gap-2 focus:text-green-700 focus:bg-green-50/50 rounded-lg cursor-pointer"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Duyệt giao dịch
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedTx(tx);
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

                            {tx.status === 'success' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRefund(tx.id)}
                                className="h-8 px-2 rounded-lg font-bold text-xs text-primary hover:bg-primary-light transition-all flex items-center gap-1"
                                title="Hoàn tiền ví"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Hoàn tiền
                              </Button>
                            )}

                            {tx.status === 'failed' && tx.reject_reason && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  toast.info(`Lý do từ chối: ${tx.reject_reason}`, {
                                    duration: 5000,
                                  });
                                }}
                                className="h-8 px-2 rounded-lg font-bold text-xs text-red-500 hover:bg-red-50 transition-all"
                              >
                                Lý do lỗi
                              </Button>
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
                {totalCount > 0 ? `${startIndex + 1}-${endIndex}` : '0'} / {totalCount} giao dịch
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

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={(open) => !open && setShowRejectDialog(false)}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl overflow-hidden border border-gray-100 p-0 shadow-lg bg-white">
          <div className="bg-gray-50 border-b border-gray-100 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-cta" />
                Từ chối giao dịch
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-xs mt-1">
                Vui lòng nhập lý do từ chối cụ thể để người dùng nắm rõ nguyên nhân giao dịch không thành công.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Tài khoản chuyển khoản không trùng khớp với số tiền đăng ký hoặc mã thanh toán sai lệch..."
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
                {approveMutation.isPending ? 'Đang duyệt...' : rejectMutation.isPending ? 'Đang từ chối...' : refundMutation.isPending ? 'Đang hoàn tiền...' : 'Từ chối GD'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
