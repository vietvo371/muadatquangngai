'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Search,
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Home,
  User,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { formatDate, formatDistanceToNow } from '@/lib/formatters';
import { StatsGrid } from '@/components/admin';

// Mock reports
const reports = [
  {
    id: 1,
    type: 'fake',
    reason: 'Tin đăng giả mạo',
    description: 'Đây là tin đăng giả, căn hộ không tồn tại. Tôi đến xem và không thấy địa chỉ này.',
    status: 'pending',
    reporter: { id: 1, name: 'Người dùng A' },
    reported_user: { id: 2, name: 'Nguyễn Văn X' },
    reported_property: { id: 101, title: 'Căn hộ cao cấp 2PN view biển' },
    created_at: '2024-01-20T10:30:00Z',
  },
  {
    id: 2,
    type: 'spam',
    reason: 'Spam/quảng cáo',
    description: 'Tin đăng này liên tục spam tin nhắn, gọi điện quấy rầy.',
    status: 'pending',
    reporter: { id: 3, name: 'Người dùng B' },
    reported_user: { id: 4, name: 'Trần Thị Y' },
    reported_property: null,
    created_at: '2024-01-19T15:45:00Z',
  },
  {
    id: 3,
    type: 'inappropriate',
    reason: 'Nội dung không phù hợp',
    description: 'Hình ảnh trong tin đăng không liên quan đến bất động sản.',
    status: 'resolved',
    reporter: { id: 5, name: 'Người dùng C' },
    reported_user: { id: 6, name: 'Lê Văn Z' },
    reported_property: { id: 102, title: 'Nhà phố 3 tầng' },
    resolved_by: 'Admin',
    resolved_at: '2024-01-19T18:00:00Z',
    created_at: '2024-01-18T09:20:00Z',
  },
  {
    id: 4,
    type: 'fraud',
    reason: 'Lừa đảo',
    description: 'Yêu cầu chuyển tiền đặt cọc trước khi xem nhà, có dấu hiệu lừa đảo.',
    status: 'dismissed',
    reporter: { id: 7, name: 'Người dùng D' },
    reported_user: { id: 8, name: 'Phạm Văn W' },
    reported_property: { id: 103, title: 'Đất nền KDC An Phú' },
    resolved_by: 'Admin',
    resolved_at: '2024-01-17T12:00:00Z',
    resolution_note: 'Đã kiểm tra, không có dấu hiệu lừa đảo. Cảnh báo người dùng.',
    created_at: '2024-01-16T14:10:00Z',
  },
];

const typeConfig = {
  fake: { label: 'Tin giả', color: 'bg-red-100 text-red-700', icon: XCircle },
  spam: { label: 'Spam', color: 'bg-amber-100 text-amber-700', icon: Flag },
  inappropriate: { label: 'Không phù hợp', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  fraud: { label: 'Lừa đảo', color: 'bg-gray-100 text-gray-700', icon: User },
};

export default function AdminReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<typeof reports[0] | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveAction, setResolveAction] = useState<'resolve' | 'dismiss'>('resolve');
  const [resolutionNote, setResolutionNote] = useState('');

  const filteredReports = reports.filter(r => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        r.reason.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.reported_user.name.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  const handleResolve = () => {
    if (selectedReport) {
      console.log('Resolve report:', selectedReport.id, 'Action:', resolveAction, 'Note:', resolutionNote);
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý báo cáo</h1>
          <p className="text-gray-500">Xử lý báo cáo từ người dùng</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-base px-4 py-2">
            {pendingCount} báo cáo chưa xử lý
          </Badge>
        )}
      </div>

      {/* Stats */}
      <StatsGrid
        stats={[
          { label: 'Tin giả', value: reports.filter(r => r.type === 'fake' && r.status === 'pending').length, icon: XCircle },
          { label: 'Spam', value: reports.filter(r => r.type === 'spam' && r.status === 'pending').length, icon: Flag },
          { label: 'Không phù hợp', value: reports.filter(r => r.type === 'inappropriate' && r.status === 'pending').length, icon: AlertTriangle },
          { label: 'Lừa đảo', value: reports.filter(r => r.type === 'fraud' && r.status === 'pending').length, icon: User },
        ]}
      />

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            Tất cả
            <Badge variant="secondary" className="ml-2">{reports.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Chờ xử lý
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved">Đã xử lý</TabsTrigger>
          <TabsTrigger value="dismissed">Bác bỏ</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <ReportList
            reports={filteredReports}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            onView={(report) => {
              setSelectedReport(report);
              setShowResolveDialog(true);
            }}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <ReportList
            reports={filteredReports.filter(r => r.status === 'pending')}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            onView={(report) => {
              setSelectedReport(report);
              setResolveAction('resolve');
              setShowResolveDialog(true);
            }}
          />
        </TabsContent>

        <TabsContent value="resolved" className="mt-4">
          <ReportList
            reports={filteredReports.filter(r => r.status === 'resolved')}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            onView={(report) => setSelectedReport(report)}
          />
        </TabsContent>

        <TabsContent value="dismissed" className="mt-4">
          <ReportList
            reports={filteredReports.filter(r => r.status === 'dismissed')}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            onView={(report) => setSelectedReport(report)}
          />
        </TabsContent>
      </Tabs>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedReport?.status === 'pending' ? 'Xử lý báo cáo' : 'Chi tiết báo cáo'}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              {/* Report Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className={typeConfig[selectedReport.type as keyof typeof typeConfig].color}>
                    {typeConfig[selectedReport.type as keyof typeof typeConfig].label}
                  </Badge>
                  <StatusBadge status={selectedReport.status as 'pending' | 'resolved' | 'dismissed'} />
                </div>
                <p className="font-medium">{selectedReport.reason}</p>
                <p className="text-sm text-gray-600">{selectedReport.description}</p>
              </div>

              {/* Reporter */}
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Người báo cáo:</span>
                <span className="font-medium">{selectedReport.reporter.name}</span>
              </div>

              {/* Reported */}
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-gray-500">Người bị báo cáo:</span>
                <span className="font-medium">{selectedReport.reported_user.name}</span>
              </div>

              {/* Property */}
              {selectedReport.reported_property && (
                <div className="flex items-center gap-2 text-sm">
                  <Home className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Tin đăng:</span>
                  <span className="font-medium">{selectedReport.reported_property.title}</span>
                </div>
              )}

              {/* Time */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Thời gian:</span>
                <span>{formatDistanceToNow(new Date(selectedReport.created_at))}</span>
              </div>

              {/* Resolution */}
              {selectedReport.resolved_by && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">Đã xử lý bởi: {selectedReport.resolved_by}</p>
                  {selectedReport.resolution_note && (
                    <p className="text-sm mt-2">Ghi chú: {selectedReport.resolution_note}</p>
                  )}
                </div>
              )}

              {/* Action (only for pending) */}
              {selectedReport.status === 'pending' && (
                <>
                  <div className="border-t pt-4">
                    <p className="font-medium mb-2">Hành động:</p>
                    <div className="flex gap-2">
                      <Button
                        variant={resolveAction === 'resolve' ? 'default' : 'outline'}
                        onClick={() => setResolveAction('resolve')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Xác nhận báo cáo
                      </Button>
                      <Button
                        variant={resolveAction === 'dismiss' ? 'default' : 'outline'}
                        onClick={() => setResolveAction('dismiss')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Bác bỏ
                      </Button>
                    </div>
                  </div>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Ghi chú xử lý..."
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Đóng
            </Button>
            {selectedReport?.status === 'pending' && (
              <Button onClick={handleResolve}>
                {resolveAction === 'resolve' ? 'Xác nhận & xử lý' : 'Bác bỏ báo cáo'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ReportListProps {
  reports: typeof reports;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  onView: (report: typeof reports[0]) => void;
}

function ReportList({
  reports,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  onView,
}: ReportListProps) {
  return (
    <>
      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm báo cáo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Loại báo cáo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="fake">Tin giả</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="inappropriate">Không phù hợp</SelectItem>
                <SelectItem value="fraud">Lừa đảo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loại</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Người bị báo cáo</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => {
                const type = typeConfig[report.type as keyof typeof typeConfig];

                return (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Badge className={type.color}>
                        {type.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium line-clamp-1">{report.reason}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{report.description}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{report.reported_user.name}</p>
                      {report.reported_property && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {report.reported_property.title}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={report.status as 'pending' | 'resolved' | 'dismissed'} />
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(report.created_at))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => onView(report)}>
                        <Eye className="h-4 w-4 mr-1" />
                        {report.status === 'pending' ? 'Xử lý' : 'Xem'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
