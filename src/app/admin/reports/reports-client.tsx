'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
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
  Search,
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Home,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertOctagon,
  Loader2,
} from 'lucide-react';
import { formatDate, formatDistanceToNow } from '@/lib/formatters';
import { StatsGrid } from '@/components/admin';
import { toast } from 'sonner';
import api from '@/lib/axios';
import {
  REPORT_REASONS,
  reportReasonLabel,
  reportTypeLabel,
} from '@/lib/reports';

/**
 * Trang quản trị báo cáo vi phạm.
 *
 * Trước đây trang này GIẢ TOÀN BỘ: danh sách là 8 báo cáo hardcode với tên người bịa, và nút
 * "Xác nhận & xử lý" chỉ đổi biến trong trình duyệt rồi hiện toast "đã xử lý thành công" —
 * không gọi API, không lưu database, F5 là mất sạch. Trong khi `GET /api/v2/admin/reports` và
 * `PUT /api/v2/admin/reports/[id]/resolve` đã tồn tại và chạy thật từ trước, chỉ là chưa ai nối.
 *
 * Vài điểm phải chấp nhận vì giới hạn của bảng `reports` trong DB:
 *   - Không có cột ghi chú xử lý / người xử lý / thời điểm xử lý → đã bỏ ô nhập ghi chú thay vì
 *     để quản trị viên gõ vào chỗ không lưu được.
 *   - API chỉ trả `type` + `target_id`, không kèm tên tin đăng / tên người bị báo cáo → hiển thị
 *     đúng những gì có thật thay vì bịa tiêu đề.
 *   - API chỉ lọc theo `status` và `type` phía máy chủ; lọc theo lý do và ô tìm kiếm chạy trên
 *     trang đang xem.
 */

interface AdminReport {
  id: number;
  reporter_id: number;
  type: string;
  target_id: number;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  reporter: { id: number; name: string; email: string };
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

const statusTabs = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'resolved', label: 'Đã xử lý' },
  { value: 'dismissed', label: 'Bác bỏ' },
];

/** Icon gợi ý theo nhóm lý do — chỉ để dễ quét mắt, không mang màu riêng ngoài bảng màu brand. */
const REASON_ICON: Record<string, typeof AlertTriangle> = {
  spam: Flag,
  duplicate: Flag,
  fake: AlertTriangle,
  wrong_info: AlertTriangle,
  scam: XCircle,
  sold: Clock,
  unreachable: AlertOctagon,
  inappropriate: AlertOctagon,
  other: AlertOctagon,
};

export default function ReportsClient() {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveAction, setResolveAction] = useState<'resolve' | 'dismiss'>('resolve');

  const listQueryKey = ['admin-reports', statusFilter, page] as const;

  const { data, isLoading } = useQuery({
    queryKey: listQueryKey,
    queryFn: async () => {
      try {
        const params: Record<string, string> = { page: String(page) };
        if (statusFilter !== 'all') params.status = statusFilter;

        const res = await api.get<{ success: boolean; data: AdminReport[]; meta: PaginationMeta }>(
          '/api/v2/admin/reports',
          { params },
        );
        if (res?.data?.data) {
          return { reports: res.data.data, meta: res.data.meta, loaded: true };
        }
      } catch (error) {
        console.error('Không tải được danh sách báo cáo vi phạm:', error);
      }
      return { reports: [] as AdminReport[], meta: null as PaginationMeta | null, loaded: false };
    },
  });

  /** Thống kê báo cáo chờ xử lý, gom theo lý do — dùng chung API với trang Tổng quan. */
  const { data: pendingStats } = useQuery({
    queryKey: ['admin-reports-pending'],
    queryFn: async () => {
      try {
        const res = await api.get<{
          success: boolean;
          data: {
            total_pending: number;
            items: Array<{ reason: string; label: string; count: number; last_at: string | null }>;
          };
        }>('/api/v2/admin/dashboard/reports');
        return res?.data?.data ?? null;
      } catch (error) {
        console.error('Không tải được thống kê báo cáo:', error);
        return null;
      }
    },
  });

  const reports = useMemo(() => data?.reports ?? [], [data]);
  const meta = data?.meta ?? null;

  /** Tải danh sách thất bại → nói rõ, thay vì im lặng hiện bảng rỗng như đã có dữ liệu thật. */
  const loadFailed = !!data && !data.loaded;

  const pendingCount = pendingStats?.total_pending ?? 0;

  const statCards = useMemo(() => {
    const items = pendingStats?.items ?? [];
    if (items.length === 0) {
      return [{ label: 'Báo cáo chờ xử lý', value: pendingCount, icon: Flag }];
    }
    return items.slice(0, 4).map((item) => ({
      label: item.label,
      value: item.count,
      icon: REASON_ICON[item.reason] ?? AlertOctagon,
    }));
  }, [pendingStats, pendingCount]);

  /** Lọc lý do + tìm kiếm chạy trên trang đang xem (API không hỗ trợ hai bộ lọc này). */
  const visibleReports = useMemo(() => {
    return reports.filter((r) => {
      if (reasonFilter !== 'all' && r.reason !== reasonFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          reportReasonLabel(r.reason).toLowerCase().includes(query) ||
          (r.description ?? '').toLowerCase().includes(query) ||
          r.reporter.name.toLowerCase().includes(query) ||
          String(r.target_id).includes(query)
        );
      }
      return true;
    });
  }, [reports, reasonFilter, searchQuery]);

  const resolveMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: 'resolve' | 'dismiss' }) => {
      const res = await api.put<{ success: boolean; message: string | null }>(
        `/api/v2/admin/reports/${id}/resolve`,
        { action },
      );
      return res.data;
    },
    onSuccess: (res, variables) => {
      toast.success(
        res?.message ??
          (variables.action === 'resolve' ? 'Đã xử lý báo cáo!' : 'Đã bác bỏ báo cáo.'),
      );
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-pending'] });
      setShowResolveDialog(false);
      setSelectedReport(null);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không xử lý được báo cáo. Vui lòng thử lại.';
      toast.error(message);
    },
  });

  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý phản ánh vi phạm</h1>
          <p className="text-gray-500">Giám sát, xem xét và xử lý các báo cáo vi phạm nội dung từ thành viên</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="text-sm px-4 py-2 bg-cta hover:bg-cta-dark text-white border-0 shadow-sm rounded-full font-bold">
            {pendingCount} báo cáo chờ xử lý
          </Badge>
        )}
      </div>

      {loadFailed && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
          Không tải được danh sách báo cáo từ máy chủ. Bảng bên dưới đang trống vì chưa lấy được dữ
          liệu, không phải vì hệ thống không có báo cáo nào.
        </div>
      )}

      {/* Stats */}
      <StatsGrid stats={statCards} />

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap gap-1.5 bg-gray-50 p-1 rounded-full w-fit border border-gray-150">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm trong trang này: lý do, mô tả, người báo cáo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-gray-200 focus:ring-primary/20 focus:border-primary font-medium text-xs h-9.5"
            />
          </div>

          <Select value={reasonFilter} onValueChange={(v) => setReasonFilter(v || 'all')}>
            <SelectTrigger className="w-40 rounded-xl border-gray-200 text-xs font-semibold text-gray-700 h-9.5">
              <SelectValue placeholder="Lý do" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tất cả lý do</SelectItem>
              {REPORT_REASONS.map((reason) => (
                <SelectItem key={reason} value={reason}>
                  {reportReasonLabel(reason)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="border-b border-gray-100">
                  <TableHead className="w-16 font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5 pl-6">ID</TableHead>
                  <TableHead className="w-[350px] font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Thông tin phản ánh</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Lý do</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Đối tượng bị báo cáo</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Trạng thái</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Thời gian</TableHead>
                  <TableHead className="text-right font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5 pr-6">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, idx) => (
                    <TableRow key={idx} className="border-b border-gray-100/60">
                      <TableCell className="pl-6"><div className="h-4 w-6 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-64 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell><div className="h-5.5 w-16 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell><div className="h-3.5 w-24 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-5.5 w-20 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-28 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell className="text-right pr-6"><div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : visibleReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-gray-400 font-medium">
                      {reports.length === 0
                        ? 'Chưa có báo cáo vi phạm nào.'
                        : 'Không có báo cáo nào khớp bộ lọc trong trang này.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleReports.map((report) => {
                    const ReasonIcon = REASON_ICON[report.reason] ?? AlertOctagon;

                    return (
                      <TableRow key={report.id} className="hover:bg-gray-50/40 border-b border-gray-100 transition-colors">
                        <TableCell className="font-bold text-gray-400 text-xs pl-6">
                          #{report.id}
                        </TableCell>

                        <TableCell className="py-3">
                          <div className="max-w-[320px]">
                            <p className="font-bold text-gray-900 text-[13px] leading-snug line-clamp-1">
                              {reportReasonLabel(report.reason)}
                            </p>
                            <p className="text-xs text-gray-500 font-medium line-clamp-1 mt-1">
                              {report.description || 'Người báo cáo không nhập mô tả.'}
                            </p>
                            <p className="text-[11px] text-gray-400 font-medium mt-1 flex items-center gap-1.5">
                              <User className="h-3 w-3" />
                              {report.reporter.name}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge className="bg-primary-light text-primary border-0 shadow-none font-bold py-0.5 px-2 text-[10px] uppercase rounded-full tracking-wider flex items-center gap-1.5 w-fit">
                            <ReasonIcon className="h-3.5 w-3.5 shrink-0" />
                            {reportReasonLabel(report.reason)}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <p className="font-bold text-gray-800 text-[12.5px] flex items-center gap-1.5">
                            {report.type === 'property' ? (
                              <Home className="h-3.5 w-3.5 text-gray-400" />
                            ) : (
                              <User className="h-3.5 w-3.5 text-gray-400" />
                            )}
                            {reportTypeLabel(report.type)} #{report.target_id}
                          </p>
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={report.status as 'pending' | 'resolved' | 'dismissed'} className="font-bold px-2.5 py-0.5" />
                        </TableCell>

                        <TableCell className="text-gray-500 font-semibold text-[11.5px] whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {formatDistanceToNow(new Date(report.created_at))}
                          </span>
                        </TableCell>

                        <TableCell className="text-right pr-6">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedReport(report);
                              setResolveAction('resolve');
                              setShowResolveDialog(true);
                            }}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 transition-all text-gray-600 hover:text-gray-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 gap-4">
            <span className="text-xs text-gray-500 font-bold">
              {meta && meta.total > 0
                ? `Hiển thị ${meta.from}–${meta.to} trên tổng ${meta.total} báo cáo`
                : 'Không có báo cáo nào'}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage(1)}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-xs font-bold text-gray-600">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(totalPages)}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail / resolve dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 rounded-2xl overflow-hidden">
          <div className="p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold text-gray-900">
                {selectedReport?.status === 'pending' ? 'Xử lý báo cáo phản ánh' : 'Chi tiết báo cáo'}
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-xs mt-1">
                Xem xét nội dung phản ánh rồi quyết định xử lý hoặc bác bỏ.
              </DialogDescription>
            </DialogHeader>
          </div>

          {selectedReport && (
            <div className="p-6 pt-0 space-y-5">
              <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary-light text-primary border-0 shadow-none font-bold py-0.5 px-2.5 text-[10px] rounded-full uppercase tracking-wider">
                    {reportReasonLabel(selectedReport.reason)}
                  </Badge>
                  <StatusBadge status={selectedReport.status as 'pending' | 'resolved' | 'dismissed'} />
                </div>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  {selectedReport.description || 'Người báo cáo không nhập mô tả.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50/40 border border-gray-100 p-3.5 rounded-xl">
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-wider text-[9.5px]">Người phản ánh</p>
                  <p className="font-bold text-gray-800 mt-1">{selectedReport.reporter.name}</p>
                  <p className="text-gray-500 font-medium mt-0.5">{selectedReport.reporter.email}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-wider text-[9.5px]">Đối tượng bị báo cáo</p>
                  <p className="font-bold text-gray-800 mt-1">
                    {reportTypeLabel(selectedReport.type)} #{selectedReport.target_id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                <Clock className="h-4 w-4 text-gray-400" />
                Thời gian nhận phản ánh:
                <span className="text-gray-700">{formatDate(selectedReport.created_at)}</span>
              </div>

              {selectedReport.status === 'pending' && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <p className="text-xs font-bold text-gray-700">Quyết định xử lý:</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={resolveAction === 'resolve' ? 'default' : 'outline'}
                      onClick={() => setResolveAction('resolve')}
                      className={`flex-1 rounded-xl text-xs font-bold h-10 ${
                        resolveAction === 'resolve'
                          ? 'bg-primary text-white hover:bg-primary/90 border-0'
                          : 'border-primary text-primary hover:bg-primary-light'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Duyệt phản ánh
                    </Button>
                    <Button
                      type="button"
                      variant={resolveAction === 'dismiss' ? 'default' : 'outline'}
                      onClick={() => setResolveAction('dismiss')}
                      className={`flex-1 rounded-xl text-xs font-bold h-10 ${
                        resolveAction === 'dismiss'
                          ? 'bg-gray-800 text-white hover:bg-gray-900 border-0'
                          : 'border-gray-250 text-gray-650'
                      }`}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Bác bỏ
                    </Button>
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                    Hệ thống chỉ lưu trạng thái đã xử lý hoặc đã bác bỏ. Muốn lưu thêm ghi chú xử lý
                    thì cần bổ sung cột tương ứng vào cơ sở dữ liệu.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-gray-100 p-6 pt-4 bg-gray-50 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowResolveDialog(false);
                setSelectedReport(null);
              }}
              className="rounded-xl font-bold h-10 text-xs px-4"
            >
              Đóng
            </Button>
            {selectedReport?.status === 'pending' && (
              <Button
                disabled={resolveMutation.isPending}
                onClick={() =>
                  resolveMutation.mutate({ id: selectedReport.id, action: resolveAction })
                }
                className={`rounded-xl font-bold h-10 text-xs px-5 border-0 shadow-sm ${
                  resolveAction === 'resolve'
                    ? 'bg-primary hover:bg-primary/90 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                {resolveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {resolveAction === 'resolve' ? 'Xác nhận xử lý' : 'Xác nhận bác bỏ'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
