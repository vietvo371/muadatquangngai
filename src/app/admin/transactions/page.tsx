'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useConfirm } from '@/components/providers/confirm-provider';
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

// Mock transactions dataset with local real estate brokers in Quang Ngai
const MOCK_TRANSACTIONS = [
  {
    id: 1,
    type: 'deposit',
    amount: 5000000,
    status: 'pending',
    user: {
      id: 201,
      name: 'Nguyễn Văn Hùng',
      email: 'vanhung.bdsquangngai@gmail.com',
    },
    created_at: '2026-05-20T10:30:00Z',
  },
  {
    id: 2,
    type: 'purchase',
    amount: 1200000,
    status: 'pending',
    user: {
      id: 202,
      name: 'Phạm Thị Minh Trang',
      email: 'minhtrang.ducpholand@gmail.com',
    },
    created_at: '2026-05-19T15:45:00Z',
  },
  {
    id: 3,
    type: 'deposit',
    amount: 10000000,
    status: 'success',
    user: {
      id: 203,
      name: 'Lê Quốc Khánh',
      email: 'khanh.leland@gmail.com',
    },
    created_at: '2026-05-18T09:20:00Z',
  },
  {
    id: 4,
    type: 'purchase',
    amount: 3500000,
    status: 'success',
    user: {
      id: 204,
      name: 'Trần Minh Hải',
      email: 'minhhai@binhsonhouse.vn',
    },
    created_at: '2026-05-17T11:10:00Z',
  },
  {
    id: 5,
    type: 'deposit',
    amount: 2000000,
    status: 'failed',
    user: {
      id: 205,
      name: 'Võ Thị Bé',
      email: 'vothibe1992@gmail.com',
    },
    reject_reason: 'Mã giao dịch ngân hàng không khớp, tài khoản chuyển tiền không đúng tên môi giới.',
    created_at: '2026-05-15T14:10:00Z',
  },
  {
    id: 6,
    type: 'purchase',
    amount: 2000000,
    status: 'refunded',
    user: {
      id: 206,
      name: 'Huỳnh Tấn Đạt',
      email: 'tandat.moducland@gmail.com',
    },
    created_at: '2026-05-14T08:15:00Z',
  },
  {
    id: 7,
    type: 'deposit',
    amount: 15000000,
    status: 'success',
    user: {
      id: 207,
      name: 'Nguyễn Văn An',
      email: 'vanan@diaocnghiahanh.com',
    },
    created_at: '2026-05-13T10:00:00Z',
  },
  {
    id: 8,
    type: 'purchase',
    amount: 800000,
    status: 'success',
    user: {
      id: 208,
      name: 'Trương Thị Kim Chi',
      email: 'kimchi.bdsquangngai@gmail.com',
    },
    created_at: '2026-05-12T16:20:00Z',
  },
  {
    id: 9,
    type: 'deposit',
    amount: 3000000,
    status: 'pending',
    user: {
      id: 209,
      name: 'Phan Thanh Bình',
      email: 'thanhbinh.trabong@gmail.com',
    },
    created_at: '2026-05-11T09:40:00Z',
  },
  {
    id: 10,
    type: 'purchase',
    amount: 1200000,
    status: 'failed',
    user: {
      id: 210,
      name: 'Bùi Tấn Lực',
      email: 'tanluc.bato@gmail.com',
    },
    reject_reason: 'Số dư ví không đủ để thực hiện thanh toán mua tin VIP Diamond.',
    created_at: '2026-05-10T14:15:00Z',
  }
];

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

export default function AdminTransactionsPage() {
  const confirm = useConfirm();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [useRealApi, setUseRealApi] = useState(true);
  
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_transactions: 0,
    pending_count: 0,
  });

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
  const [isActionPending, setIsActionPending] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;

      const res = await transactionApi.list(params);
      if (res && res.data) {
        setTransactions(res.data);
        setUseRealApi(true);
      } else {
        setTransactions(MOCK_TRANSACTIONS);
        setUseRealApi(false);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions(MOCK_TRANSACTIONS);
      setUseRealApi(false);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  const loadStats = useCallback(async () => {
    try {
      const res = await transactionApi.stats();
      if (res) {
        setStats({
          total_revenue: Number(res.total_revenue || 0),
          total_transactions: Number(res.total_transactions || 0),
          pending_count: Number(res.pending_count || 0),
        });
      } else {
        calculateLocalStats();
      }
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
      calculateLocalStats();
    }
  }, []);

  const calculateLocalStats = () => {
    const successRevenue = MOCK_TRANSACTIONS
      .filter(tx => tx.status === 'success' && tx.type === 'deposit')
      .reduce((sum, tx) => sum + tx.amount, 0);

    setStats({
      total_revenue: successRevenue, // or successSpend depending on what revenue means
      total_transactions: MOCK_TRANSACTIONS.length,
      pending_count: MOCK_TRANSACTIONS.filter(tx => tx.status === 'pending').length,
    });
  };

  useEffect(() => {
    loadTransactions();
    loadStats();
  }, [loadTransactions, loadStats]);

  // Simulate premium micro-animation delay when page/filters change
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, typeFilter, searchQuery, page, perPage]);

  // Client-side combined filtering
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

  // Actions implementation
  const handleApprove = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Phê duyệt giao dịch',
      description: 'Xác nhận duyệt giao dịch này? Số tiền sẽ được cộng vào tài khoản của người dùng.',
      confirmText: 'Phê duyệt',
      cancelText: 'Hủy',
      variant: 'default'
    });
    if (!isConfirmed) return;
    try {
      setIsActionPending(true);
      if (useRealApi) {
        await transactionApi.approve(id);
      }
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, status: 'success' } : tx))
      );
      toast.success('Đã phê duyệt giao dịch thành công!');
      loadStats();
    } catch {
      toast.error('Có lỗi xảy ra khi duyệt giao dịch.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedTx || !rejectReason.trim()) return;
    try {
      setIsActionPending(true);
      if (useRealApi) {
        await transactionApi.reject(selectedTx.id, rejectReason);
      }
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === selectedTx.id
            ? { ...tx, status: 'failed', reject_reason: rejectReason }
            : tx
        )
      );
      toast.success('Đã từ chối giao dịch thành công.');
      setShowRejectDialog(false);
      setSelectedTx(null);
      setRejectReason('');
      loadStats();
    } catch {
      toast.error('Có lỗi xảy ra khi từ chối giao dịch.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRefund = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Hoàn tiền giao dịch',
      description: 'Bạn có chắc chắn muốn hoàn tiền cho giao dịch này? Hành động này không thể hoàn tác.',
      confirmText: 'Hoàn tiền',
      cancelText: 'Hủy',
      variant: 'destructive'
    });
    if (!isConfirmed) return;
    try {
      setIsActionPending(true);
      if (useRealApi) {
        await transactionApi.refund(id);
      }
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, status: 'refunded' } : tx))
      );
      toast.success('Đã thực hiện hoàn tiền giao dịch thành công.');
      loadStats();
    } catch {
      toast.error('Có lỗi xảy ra khi hoàn tiền giao dịch.');
    } finally {
      setIsActionPending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý giao dịch</h1>
          <p className="text-sm text-gray-500 mt-1">Duyệt giao dịch nạp tiền ví, thanh toán gói VIP và hoàn tiền của các tài khoản môi giới</p>
        </div>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl border border-green-100/50 animate-pulse-subtle">
              <TrendingUp className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{formatPrice(stats.total_revenue)}</p>
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
              <p className="text-2xl font-black text-gray-900">{stats.total_transactions}</p>
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
              <p className="text-2xl font-black text-gray-900">{stats.pending_count}</p>
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

          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
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
                {loading || isFiltering ? (
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
              <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
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
        <DialogContent className="max-w-[440px] rounded-2xl overflow-hidden border border-gray-100 p-0 shadow-lg bg-white">
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
                {isActionPending ? 'Đang từ chối...' : 'Từ chối GD'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
