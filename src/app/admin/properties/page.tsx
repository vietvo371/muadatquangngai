'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Home,
  Image as ImageIcon,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/formatters';

// Mock data
const properties = [
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
  {
    id: 3,
    title: 'Đất nền KDC An Phú Quý 200m2',
    slug: 'dat-nen-kdc-an-phu-quy',
    price: 1800000000,
    area: 200,
    thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=100&h=100&fit=crop',
    status: 'active',
    verification_status: 'verified',
    type: 'sale',
    category: 'Đất nền',
    province: 'Quảng Ngãi',
    user: { id: 3, name: 'Lê Văn C' },
    created_at: '2024-01-10',
  },
  {
    id: 4,
    title: 'Căn hộ cho thuê 2PN full nội thất',
    slug: 'can-ho-cho-thue-2pn',
    price: 15000000,
    area: 65,
    thumbnail: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=100&h=100&fit=crop',
    status: 'inactive',
    verification_status: 'rejected',
    type: 'rent',
    category: 'Căn hộ',
    province: 'Đà Nẵng',
    user: { id: 4, name: 'Phạm Thị D' },
    created_at: '2024-01-12',
  },
];

const statusConfig = {
  active: { label: 'Đang đăng', color: 'bg-green-100 text-green-700' },
  pending: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700' },
  inactive: { label: 'Đã ẩn', color: 'bg-gray-100 text-gray-700' },
  expired: { label: 'Hết hạn', color: 'bg-red-100 text-red-700' },
};

const verificationConfig = {
  verified: { label: 'Đã xác minh', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending: { label: 'Chờ xác minh', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function AdminPropertiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState<typeof properties[0] | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const filteredProperties = properties.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const pendingCount = properties.filter(p => p.status === 'pending').length;

  const handleApprove = (property: typeof properties[0]) => {
    console.log('Approve:', property.id);
  };

  const handleReject = () => {
    if (selectedProperty) {
      console.log('Reject:', selectedProperty.id, 'Reason:', rejectReason);
      setShowRejectDialog(false);
      setSelectedProperty(null);
      setRejectReason('');
    }
  };

  const handleDelete = (property: typeof properties[0]) => {
    if (confirm(`Xóa tin "${property.title}"?`)) {
      console.log('Delete:', property.id);
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
          <Badge variant="destructive" className="text-base px-4 py-2">
            {pendingCount} tin chờ duyệt
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm tin đăng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang đăng</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="inactive">Đã ẩn</SelectItem>
                <SelectItem value="expired">Hết hạn</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Loại tin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="sale">Mua bán</SelectItem>
                <SelectItem value="rent">Cho thuê</SelectItem>
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
                <TableHead className="w-[300px]">Tin đăng</TableHead>
                <TableHead>Người đăng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Xác minh</TableHead>
                <TableHead>Ngày đăng</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => {
                const status = statusConfig[property.status as keyof typeof statusConfig];
                const verification = verificationConfig[property.verification_status as keyof typeof verificationConfig];
                const VerificationIcon = verification.icon;

                return (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={property.thumbnail}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium line-clamp-1">{property.title}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{formatPrice(property.price)}</span>
                            <span>•</span>
                            <span>{property.area}m²</span>
                            <span>•</span>
                            <span>{property.province}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{property.user.name}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <VerificationIcon className="h-4 w-4" />
                        <Badge variant="outline" className={verification.color}>
                          {verification.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(property.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Link href={`/mua-ban/${property.slug}`} className="flex items-center">
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {property.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(property)}>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Duyệt tin
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProperty(property);
                                  setShowRejectDialog(true);
                                }}
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Từ chối
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(property)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối tin đăng</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối tin đăng "{selectedProperty?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Lý do từ chối..."
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
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
