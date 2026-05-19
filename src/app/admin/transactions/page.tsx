'use client';

import { useState, useEffect } from 'react';
import { transactionApi, Transaction } from '@/lib/admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { FilterBar } from '@/components/admin';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/formatters';


const TYPE_LABELS: Record<string, string> = {
  deposit: 'Nạp tiền',
  purchase: 'Mua gói VIP',
  withdraw: 'Rút tiền',
  refund: 'Hoàn tiền',
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [stats, setStats] = useState<{
    total_revenue: number;
    total_transactions: number;
    pending_count: number;
  } | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
  });
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    id: number | null;
    reason: string;
  }>({
    open: false,
    id: null,
    reason: '',
  });

  const loadTransactions = async (page = 1) => {
    try {
      setLoading(true);
      const response = await transactionApi.list({
        status: filters.status || undefined,
        type: filters.type || undefined,
        page,
      });
      setTransactions(response.data);
      setPagination({
        current_page: response.meta.current_page,
        last_page: response.meta.last_page,
        total: response.meta.total,
      });
    } catch (error) {
      toast.error('Không thể tải giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await transactionApi.stats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  useEffect(() => {
    loadTransactions();
    loadStats();
  }, []);

  const handleFilter = () => {
    loadTransactions(1);
  };

  const handleApprove = async (id: number) => {
    try {
      await transactionApi.approve(id);
      toast.success('Đã duyệt giao dịch');
      loadTransactions(pagination.current_page);
      loadStats();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.id) return;

    try {
      await transactionApi.reject(rejectDialog.id, rejectDialog.reason);
      toast.success('Đã từ chối giao dịch');
      setRejectDialog({ open: false, id: null, reason: '' });
      loadTransactions(pagination.current_page);
      loadStats();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleRefund = async (id: number) => {
    if (!confirm('Bạn có chắc muốn hoàn tiền giao dịch này?')) return;

    try {
      await transactionApi.refund(id);
      toast.success('Đã hoàn tiền giao dịch');
      loadTransactions(pagination.current_page);
      loadStats();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý giao dịch</h1>
        <p className="text-gray-500">Tổng cộng {pagination.total} giao dịch</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Tổng doanh thu</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatPrice(stats.total_revenue)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Tổng giao dịch</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.total_transactions}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Chờ duyệt</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {stats.pending_count}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <FilterBar
        filters={[
          {
            name: 'status',
            placeholder: 'Trạng thái',
            type: 'select',
            value: filters.status,
            onChange: (v) => setFilters({ ...filters, status: v }),
            options: [
              { value: 'pending', label: 'Chờ duyệt' },
              { value: 'success', label: 'Thành công' },
              { value: 'failed', label: 'Thất bại' },
              { value: 'refunded', label: 'Đã hoàn tiền' },
            ],
          },
          {
            name: 'type',
            placeholder: 'Loại',
            type: 'select',
            value: filters.type,
            onChange: (v) => setFilters({ ...filters, type: v }),
            options: [
              { value: 'deposit', label: 'Nạp tiền' },
              { value: 'purchase', label: 'Mua gói VIP' },
            ],
          },
        ]}
        onSearch={handleFilter}
      />

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Người dùng</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Chưa có giao dịch nào
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-gray-500">#{tx.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{tx.user?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{tx.user?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{TYPE_LABELS[tx.type] || tx.type}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(tx.amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={tx.status as 'pending' | 'success' | 'failed' | 'refunded'} />
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {new Date(tx.created_at).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {tx.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600"
                            onClick={() => handleApprove(tx.id)}
                          >
                            Duyệt
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => setRejectDialog({ open: true, id: tx.id, reason: '' })}
                          >
                            Từ chối
                          </Button>
                        </>
                      )}
                      {tx.status === 'success' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#1075b1]"
                          onClick={() => handleRefund(tx.id)}
                        >
                          Hoàn tiền
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-gray-500">
              Trang {pagination.current_page} / {pagination.last_page}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.current_page === 1}
                onClick={() => loadTransactions(pagination.current_page - 1)}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => loadTransactions(pagination.current_page + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ ...rejectDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối giao dịch</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Lý do từ chối</label>
            <Input
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
              placeholder="VD: Thông tin thanh toán không hợp lệ"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: null, reason: '' })}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
