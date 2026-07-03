'use client';

import { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { formatDate, formatDistanceToNow } from '@/lib/formatters';
import { StatsGrid } from '@/components/admin';
import { toast } from 'sonner';

// Mock reports rich dataset for pagination and filtering
const INITIAL_REPORTS = [
  {
    id: 1,
    type: 'fake',
    reason: 'Tin đăng giả mạo, sai vị trí',
    description: 'Vị trí ghi phường Nghĩa Lộ nhưng khi dẫn khách đi xem thì đất nằm tận huyện Tư Nghĩa. Giá bán cũng cao hơn 200 triệu so với đăng tin.',
    status: 'pending',
    reporter: { id: 1, name: 'Lê Thanh Bình' },
    reported_user: { id: 2, name: 'Nguyễn Quốc Bảo (Môi giới)' },
    reported_property: { id: 101, title: 'Đất nền trung tâm TP Quảng Ngãi sát Co.opmart' },
    created_at: '2026-05-20T10:30:00Z',
  },
  {
    id: 2,
    type: 'fraud',
    reason: 'Có dấu hiệu lừa đảo nhận cọc',
    description: 'Yêu cầu chuyển khoản đặt cọc giữ chỗ 20 triệu qua ngân hàng trước rồi mới cho xem giấy tờ sổ hồng gốc. Có dấu hiệu lừa đảo chiếm đoạt tài sản.',
    status: 'pending',
    reporter: { id: 3, name: 'Trần Thị Thu' },
    reported_user: { id: 4, name: 'Phạm Minh Hải (Môi giới tự do)' },
    reported_property: { id: 102, title: 'Bán gấp nhà 2 tầng Nghĩa Chánh giá ngộp' },
    created_at: '2026-05-19T15:45:00Z',
  },
  {
    id: 3,
    type: 'spam',
    reason: 'Đăng tin trùng lặp, spam hệ thống',
    description: 'Một tài khoản đăng lặp đi lặp lại 15 tin đăng cùng nội dung đất nền VSIP Quảng Ngãi gây rác trang tìm kiếm.',
    status: 'pending',
    reporter: { id: 5, name: 'Nguyễn Văn Hùng' },
    reported_user: { id: 6, name: 'Lê Hoài Nam (Đại lý)' },
    reported_property: { id: 103, title: 'Đất nền VSIP Quảng Ngãi sổ đỏ trao tay' },
    created_at: '2026-05-18T09:20:00Z',
  },
  {
    id: 4,
    type: 'inappropriate',
    reason: 'Hình ảnh không phù hợp',
    description: 'Hình ảnh đính kèm tin đăng là hình ảnh rác, nhạy cảm không liên quan đến bất động sản cần bán.',
    status: 'resolved',
    reporter: { id: 7, name: 'Đỗ Mỹ Linh' },
    reported_user: { id: 8, name: 'Vũ Đức Trọng' },
    reported_property: { id: 104, title: 'Nhà cấp 4 kiệt ôtô đường Hùng Vương' },
    resolved_by: 'Admin',
    resolved_at: '2026-05-18T14:00:00Z',
    resolution_note: 'Đã yêu cầu người dùng thay đổi ảnh đại diện phù hợp.',
    created_at: '2026-05-17T11:10:00Z',
  },
  {
    id: 5,
    type: 'fake',
    reason: 'Giá đăng tin sai lệch nghiêm trọng',
    description: 'Đăng giá bán 150 triệu để câu khách nhưng thực chất là bán 1.5 tỷ. Gây mất thời gian của người mua.',
    status: 'dismissed',
    reporter: { id: 9, name: 'Hoàng Văn Thái' },
    reported_user: { id: 10, name: 'Phạm Thu Thảo' },
    reported_property: { id: 105, title: 'Đất thổ cư Bình Sơn giá rẻ bất ngờ' },
    resolved_by: 'Admin',
    resolved_at: '2026-05-16T12:00:00Z',
    resolution_note: 'Đã liên hệ chủ tin đăng, đây là giá cọc giữ chỗ được ghi rõ trong phần mô tả chi tiết.',
    created_at: '2026-05-15T14:10:00Z',
  },
  {
    id: 6,
    type: 'fraud',
    reason: 'Đất tranh chấp, chưa có sổ đỏ',
    description: 'Tin đăng ghi đã có sổ hồng riêng nhưng thực tế đất đang tranh chấp gia sản và chưa có sổ đỏ thổ cư.',
    status: 'pending',
    reporter: { id: 11, name: 'Phan Thanh Hải' },
    reported_user: { id: 12, name: 'Nguyễn Văn Đạt' },
    reported_property: { id: 106, title: 'Đất nền ven sông Trà Khúc view siêu đẹp' },
    created_at: '2026-05-14T08:15:00Z',
  },
  {
    id: 7,
    type: 'spam',
    reason: 'Số điện thoại liên hệ không đúng',
    description: 'Gọi vào số điện thoại trên tin đăng thì người nghe máy báo không phải là người bán đất và liên tục bị làm phiền.',
    status: 'resolved',
    reporter: { id: 13, name: 'Bùi Thị Hà' },
    reported_user: { id: 14, name: 'Trần Minh Quân' },
    reported_property: { id: 107, title: 'Nhà mặt tiền đường Quang Trung kinh doanh tốt' },
    resolved_by: 'Admin',
    resolved_at: '2026-05-13T10:00:00Z',
    resolution_note: 'Đã tạm ẩn tin đăng và gửi email cảnh báo tài khoản môi giới cập nhật lại số điện thoại.',
    created_at: '2026-05-12T16:20:00Z',
  },
  {
    id: 8,
    type: 'fake',
    reason: 'Dự án ma chưa được cấp phép',
    description: 'Khu đất nông nghiệp tự ý phân lô bán nền, đặt tên dự án sang chảnh nhưng thực tế chính quyền chưa cấp phép quy hoạch.',
    status: 'pending',
    reporter: { id: 15, name: 'Lê Văn Tám' },
    reported_user: { id: 16, name: 'Công ty BDS Thịnh Phát' },
    reported_property: { id: 108, title: 'Khu đô thị sinh thái ven biển Mộ Đức' },
    created_at: '2026-05-11T09:40:00Z',
  },
  {
    id: 9,
    type: 'fraud',
    reason: 'Nhận tiền giữ chỗ xong trốn tránh',
    description: 'Nhận 10 triệu tiền giữ chỗ mua đất nền Tây Sông Trà Bồng của khách hàng qua tài khoản cá nhân rồi khóa mạng xã hội, tắt máy liên lạc.',
    status: 'pending',
    reporter: { id: 17, name: 'Trịnh Xuân Hùng' },
    reported_user: { id: 18, name: 'Vũ Quốc Khánh' },
    reported_property: { id: 109, title: 'Đất mặt tiền thị trấn Châu Ổ giá đầu tư' },
    created_at: '2026-05-10T15:25:00Z',
  },
  {
    id: 10,
    type: 'spam',
    reason: 'Spam tin nhắn tiếp thị liên tục',
    description: 'Tài khoản liên tục gửi tin nhắn quảng cáo tư vấn mua chung cư, bất kể ngày đêm gây bức xúc.',
    status: 'resolved',
    reporter: { id: 19, name: 'Võ Thị Mai' },
    reported_user: { id: 20, name: 'Trần Văn Thịnh' },
    reported_property: null,
    resolved_by: 'Admin',
    resolved_at: '2026-05-09T09:00:00Z',
    resolution_note: 'Đã khóa chức năng nhắn tin của tài khoản 7 ngày.',
    created_at: '2026-05-08T10:15:00Z',
  }
];

const typeConfig = {
  fake: { label: 'Tin giả', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-150', icon: AlertTriangle },
  spam: { label: 'Spam', color: 'bg-orange-100 text-orange-700 hover:bg-orange-150', icon: Flag },
  inappropriate: { label: 'Sai nội dung', color: 'bg-blue-100 text-blue-700 hover:bg-blue-150', icon: AlertOctagon },
  fraud: { label: 'Lừa đảo', color: 'bg-red-100 text-red-700 hover:bg-red-150', icon: XCircle },
};

const statusTabs = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'resolved', label: 'Đã xử lý' },
  { value: 'dismissed', label: 'Bác bỏ' },
];

export default function ReportsClient() {
  const [reportsList, setReportsList] = useState(INITIAL_REPORTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<typeof INITIAL_REPORTS[0] | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveAction, setResolveAction] = useState<'resolve' | 'dismiss'>('resolve');
  const [resolutionNote, setResolutionNote] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [isFiltering, setIsFiltering] = useState(false);

  // Stats
  const pendingCount = useMemo(() => reportsList.filter(r => r.status === 'pending').length, [reportsList]);
  const fakeCount = useMemo(() => reportsList.filter(r => r.type === 'fake' && r.status === 'pending').length, [reportsList]);
  const spamCount = useMemo(() => reportsList.filter(r => r.type === 'spam' && r.status === 'pending').length, [reportsList]);
  const inappropCount = useMemo(() => reportsList.filter(r => r.type === 'inappropriate' && r.status === 'pending').length, [reportsList]);
  const fraudCount = useMemo(() => reportsList.filter(r => r.type === 'fraud' && r.status === 'pending').length, [reportsList]);

  // Simulate loading on filter/page change
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setIsFiltering(true);
    });
    const timer = setTimeout(() => setIsFiltering(false), 250);
    return () => {
      cancelAnimationFrame(handle);
      clearTimeout(timer);
    };
  }, [searchQuery, typeFilter, statusFilter, page, perPage]);

  const filteredReports = useMemo(() => {
    return reportsList.filter(r => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          r.reason.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.reported_user.name.toLowerCase().includes(query) ||
          r.reporter.name.toLowerCase().includes(query) ||
          (r.reported_property && r.reported_property.title.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [reportsList, typeFilter, statusFilter, searchQuery]);

  // Calculate paginated slice
  const totalCount = filteredReports.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  // Keep page in bound
  useEffect(() => {
    if (page > totalPages) {
      const timer = setTimeout(() => setPage(totalPages), 0);
      return () => clearTimeout(timer);
    }
  }, [totalPages, page]);

  const paginatedReports = useMemo(() => {
    const startIndex = (page - 1) * perPage;
    return filteredReports.slice(startIndex, startIndex + perPage);
  }, [filteredReports, page, perPage]);

  const startIndex = (page - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalCount);

  // Actions
  const handleResolve = () => {
    if (selectedReport) {
      setReportsList(prev =>
        prev.map(r =>
          r.id === selectedReport.id
            ? {
                ...r,
                status: resolveAction === 'resolve' ? 'resolved' : 'dismissed',
                resolved_by: 'Admin',
                resolved_at: new Date().toISOString(),
                resolution_note: resolutionNote.trim() || (resolveAction === 'resolve' ? 'Đã duyệt báo cáo và xử lý tài khoản vi phạm.' : 'Bác bỏ báo cáo, thông tin không đủ căn cứ.'),
              }
            : r
        )
      );
      toast.success(
        resolveAction === 'resolve'
          ? `Đã xác nhận phản ánh & xử lý thành công báo cáo #${selectedReport.id}!`
          : `Đã bác bỏ phản ánh báo cáo #${selectedReport.id}.`
      );
      setShowResolveDialog(false);
      setSelectedReport(null);
      setResolutionNote('');
    }
  };

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

      {/* Stats */}
      <StatsGrid
        stats={[
          { label: 'Tin giả / Sai vị trí', value: fakeCount, icon: AlertTriangle },
          { label: 'Spam hệ thống', value: spamCount, icon: Flag },
          { label: 'Sai nội dung / Ảnh', value: inappropCount, icon: AlertOctagon },
          { label: 'Dấu hiệu Lừa đảo', value: fraudCount, icon: XCircle },
        ]}
      />

      {/* Modern Filter Pill Bar & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        {/* Left: Pill Status Filters (Identical to reference UI image) */}
        <div className="flex flex-wrap gap-1.5 bg-gray-50 p-1 rounded-full w-fit border border-gray-150">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            const count = tab.value === 'all'
              ? reportsList.length
              : reportsList.filter(r => r.status === tab.value).length;

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

        {/* Right: Search Input & Category Dropdown */}
        <div className="flex items-center gap-3 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm theo lý do, người đăng, tin đăng..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-10 rounded-xl border-gray-200 focus:ring-primary/20 focus:border-primary font-medium text-xs h-9.5"
            />
          </div>

          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v || 'all'); setPage(1); }}>
            <SelectTrigger className="w-40 rounded-xl border-gray-200 text-xs font-semibold text-gray-700 h-9.5">
              <SelectValue placeholder="Loại báo cáo" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tất cả phân loại</SelectItem>
              <SelectItem value="fake">Tin giả</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
              <SelectItem value="inappropriate">Sai nội dung</SelectItem>
              <SelectItem value="fraud">Lừa đảo</SelectItem>
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
                  <TableHead className="w-[350px] font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Thông tin phản ánh</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Phân loại (Type)</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Đối tượng bị báo cáo</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Trạng thái</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Thời gian</TableHead>
                  <TableHead className="text-right font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5 pr-6">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFiltering ? (
                  [...Array(perPage)].map((_, idx) => (
                    <TableRow key={idx} className="border-b border-gray-100/60">
                      <TableCell className="pl-6"><div className="h-4 w-6 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-64 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell><div className="h-5.5 w-16 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-24 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell><div className="h-5.5 w-20 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-28 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell className="text-right pr-6"><div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-gray-400 font-medium">
                      Không tìm thấy bất kỳ báo cáo phản ánh nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedReports.map((report) => {
                    const type = typeConfig[report.type as keyof typeof typeConfig] || typeConfig.fake;
                    const TypeIcon = type.icon;

                    return (
                      <TableRow key={report.id} className="hover:bg-gray-50/40 border-b border-gray-100 transition-colors">
                        {/* ID (Reference image style #) */}
                        <TableCell className="font-bold text-gray-400 text-xs pl-6">
                          #{report.id}
                        </TableCell>

                        {/* Title & description */}
                        <TableCell className="py-3">
                          <div className="max-w-[320px]">
                            <p className="font-bold text-gray-900 text-[13px] leading-snug line-clamp-1">
                              {report.reason}
                            </p>
                            <p className="text-xs text-gray-500 font-medium line-clamp-1 mt-1">
                              {report.description}
                            </p>
                          </div>
                        </TableCell>

                        {/* Classification badge */}
                        <TableCell>
                          <Badge className={`${type.color} border-0 shadow-none font-bold py-0.5 px-2 text-[10px] uppercase rounded-full tracking-wider flex items-center gap-1.5 w-fit`}>
                            <TypeIcon className="h-3.5 w-3.5 shrink-0" />
                            {type.label}
                          </Badge>
                        </TableCell>

                        {/* Target of report */}
                        <TableCell>
                          <div>
                            <p className="font-bold text-gray-800 text-[12.5px] flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-gray-400" />
                              {report.reported_user.name}
                            </p>
                            {report.reported_property ? (
                              <p className="text-[11px] text-primary hover:underline cursor-pointer truncate max-w-[200px] mt-1 font-semibold flex items-center gap-1.5">
                                <Home className="h-3 w-3 text-primary" />
                                {report.reported_property.title}
                              </p>
                            ) : (
                              <p className="text-[11px] text-gray-400 mt-1 font-medium italic">Không liên quan tin đăng</p>
                            )}
                          </div>
                        </TableCell>

                        {/* Status badge */}
                        <TableCell>
                          <StatusBadge status={report.status as 'pending' | 'resolved' | 'dismissed'} className="font-bold px-2.5 py-0.5" />
                        </TableCell>

                        {/* Distance time with Clock icon */}
                        <TableCell className="text-gray-500 font-semibold text-[11.5px] whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {formatDistanceToNow(new Date(report.created_at))}
                          </span>
                        </TableCell>

                        {/* Action buttons */}
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

          {/* Premium Pagination Footer (Mirroring reference UI) */}
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
                {totalCount > 0 ? `${startIndex + 1}-${endIndex}` : '0'} / {totalCount} phản ánh
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
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
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7.5 w-7.5 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30"
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl overflow-hidden border border-gray-100 p-0 shadow-lg bg-white">
          <div className="bg-gray-50 border-b border-gray-100 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-cta" />
                {selectedReport?.status === 'pending' ? 'Xử lý báo cáo phản ánh' : 'Chi tiết báo cáo'}
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-xs mt-1">
                Xem xét kỹ lưỡng các bằng chứng và đưa ra quyết định xử phạt tài khoản vi phạm hoặc bỏ qua báo cáo.
              </DialogDescription>
            </DialogHeader>
          </div>

          {selectedReport && (
            <div className="p-6 space-y-5">
              {/* Report Reason & Description */}
              <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <Badge className={`${typeConfig[selectedReport.type as keyof typeof typeConfig].color} border-0 shadow-none font-bold py-0.5 px-2.5 text-[10px] rounded-full uppercase tracking-wider`}>
                    {typeConfig[selectedReport.type as keyof typeof typeConfig].label}
                  </Badge>
                  <StatusBadge status={selectedReport.status as 'pending' | 'resolved' | 'dismissed'} />
                </div>
                <h4 className="font-extrabold text-gray-900 text-sm leading-snug">{selectedReport.reason}</h4>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">{selectedReport.description}</p>
              </div>

              {/* Stakeholders grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50/40 border border-gray-100 p-3.5 rounded-xl">
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-wider text-[9.5px]">Người phản ánh</p>
                  <p className="font-bold text-gray-800 mt-1">{selectedReport.reporter.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-wider text-[9.5px]">Bị báo cáo</p>
                  <p className="font-bold text-red-600 mt-1">{selectedReport.reported_user.name}</p>
                </div>
                {selectedReport.reported_property && (
                  <div className="col-span-2 border-t border-gray-100/60 pt-2.5 mt-1">
                     <p className="text-gray-400 font-bold uppercase tracking-wider text-[9.5px]">Tin đăng liên quan</p>
                    <p className="font-semibold text-primary truncate mt-1 flex items-center gap-1">
                      <Home className="h-3.5 w-3.5" />
                      {selectedReport.reported_property.title}
                    </p>
                  </div>
                )}
              </div>

              {/* Time display */}
              <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                <Clock className="h-4 w-4 text-gray-400" />
                Thời gian nhận phản ánh:
                <span className="text-gray-700">{formatDate(selectedReport.created_at)}</span>
              </div>

              {/* Historic resolution notes */}
              {selectedReport.resolved_by && (
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <p className="text-xs text-gray-500 font-bold">
                    Đã được giải quyết bởi: <span className="text-gray-850 font-extrabold">{selectedReport.resolved_by}</span> vào lúc {formatDate(selectedReport.resolved_at || '')}
                  </p>
                  {selectedReport.resolution_note && (
                    <div className="p-3 bg-green-50/50 border border-green-100 rounded-xl text-xs text-green-800 font-medium">
                      <strong className="block text-green-900 font-bold mb-1">Ghi chú xử lý:</strong>
                      {selectedReport.resolution_note}
                    </div>
                  )}
                </div>
              )}

              {/* Input Action Form (only for pending) */}
              {selectedReport.status === 'pending' && (
                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-700">Quyết định xử lý:</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={resolveAction === 'resolve' ? 'default' : 'outline'}
                        onClick={() => setResolveAction('resolve')}
                        className={`flex-1 rounded-xl text-xs font-bold h-10 ${
                          resolveAction === 'resolve' ? 'bg-primary text-white hover:bg-primary/90 border-0' : 'border-gray-250 text-gray-650'
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
                          resolveAction === 'dismiss' ? 'bg-gray-800 text-white hover:bg-gray-900 border-0' : 'border-gray-250 text-gray-650'
                        }`}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Bác bỏ (Bỏ qua)
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Ghi chú giải quyết:</label>
                    <textarea
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder={resolveAction === 'resolve' ? 'Nhập ghi chú (ví dụ: Đã khóa tin đăng lừa đảo, hạ uy tín tài khoản môi giới...)' : 'Lý do bác bỏ phản ánh (ví dụ: Báo cáo không có chứng cứ xác thực...)'}
                      rows={3}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-medium placeholder-gray-400 transition-all resize-none"
                    />
                  </div>
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
                setResolutionNote('');
              }}
              className="rounded-xl font-bold h-10 text-xs px-4"
            >
              Hủy
            </Button>
            {selectedReport?.status === 'pending' && (
              <Button
                onClick={handleResolve}
                className={`rounded-xl font-bold h-10 text-xs px-5 border-0 shadow-sm ${
                  resolveAction === 'resolve' ? 'bg-cta hover:bg-cta-dark text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                {resolveAction === 'resolve' ? 'Xác nhận & Duyệt phạt' : 'Xác nhận bác bỏ'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
