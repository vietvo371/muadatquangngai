'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  MoreVertical,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Users,
  UserCheck,
  UserX,
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { StatsGrid } from '@/components/admin';

// Mock users
const users = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@email.com',
    phone: '0901234567',
    avatar: null,
    role: 'agent',
    status: 'active',
    email_verified_at: '2024-01-01',
    total_listings: 45,
    created_at: '2023-06-15',
  },
  {
    id: 2,
    name: 'Trần Thị B',
    email: 'tranthib@email.com',
    phone: '0912345678',
    avatar: null,
    role: 'user',
    status: 'active',
    email_verified_at: '2024-01-05',
    total_listings: 12,
    created_at: '2023-08-20',
  },
  {
    id: 3,
    name: 'Lê Văn C',
    email: 'levanc@email.com',
    phone: '0923456789',
    avatar: null,
    role: 'user',
    status: 'inactive',
    email_verified_at: null,
    total_listings: 3,
    created_at: '2024-01-10',
  },
  {
    id: 4,
    name: 'Admin',
    email: 'admin@bds.vn',
    phone: null,
    avatar: null,
    role: 'admin',
    status: 'active',
    email_verified_at: '2023-01-01',
    total_listings: 0,
    created_at: '2023-01-01',
  },
];

const roleConfig = {
  admin: { label: 'Quản trị', color: 'bg-purple-100 text-purple-700' },
  agent: { label: 'Môi giới', color: 'bg-primary-light text-primary' },
  user: { label: 'Người dùng', color: 'bg-gray-100 text-gray-700' },
};

const statusConfig = {
  active: { label: 'Hoạt động', className: 'bg-green-100 text-green-700' },
  inactive: { label: 'Khóa', className: 'bg-red-100 text-red-700' },
  banned: { label: 'Cấm', className: 'bg-gray-100 text-gray-700' },
};

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState('');

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.phone?.includes(query)
      );
    }
    return true;
  });

  const agentCount = users.filter(u => u.role === 'agent').length;
  const userCount = users.filter(u => u.role === 'user').length;

  const handleBan = () => {
    if (selectedUser) {
      console.log('Ban user:', selectedUser.id, 'Reason:', banReason);
      setShowBanDialog(false);
      setSelectedUser(null);
      setBanReason('');
    }
  };

  const handleDelete = (user: typeof users[0]) => {
    if (confirm(`Xóa người dùng "${user.name}"?`)) {
      console.log('Delete user:', user.id);
    }
  };

  const handleChangeRole = (user: typeof users[0], newRole: string) => {
    console.log('Change role:', user.id, 'New role:', newRole);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-500">Quản lý tài khoản và phân quyền người dùng</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Thêm người dùng
        </Button>
      </div>

      {/* Stats */}
      <StatsGrid
        stats={[
          { label: 'Tổng người dùng', value: users.length, icon: Users },
          { label: 'Môi giới', value: agentCount, icon: UserCheck },
          { label: 'Người dùng', value: userCount, icon: Users },
          { label: 'Bị khóa/Cấm', value: users.filter(u => u.status === 'inactive' || u.status === 'banned').length, icon: UserX },
        ]}
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm người dùng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={roleFilter} onValueChange={(v) => v && setRoleFilter(v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="admin">Quản trị</SelectItem>
                <SelectItem value="agent">Môi giới</SelectItem>
                <SelectItem value="user">Người dùng</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Khóa</SelectItem>
                <SelectItem value="banned">Cấm</SelectItem>
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
                <TableHead>Người dùng</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Tin đăng</TableHead>
                <TableHead>Ngày tham gia</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const role = roleConfig[user.role as keyof typeof roleConfig];
                const status = statusConfig[user.status as keyof typeof statusConfig];

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                            {user.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={role.color}>{role.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.total_listings}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button size="icon" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setShowViewDialog(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.role !== 'admin' && (
                            <DropdownMenuItem onClick={() => handleChangeRole(user, 'agent')}>
                              <Shield className="h-4 w-4 mr-2 text-primary" />
                              Phân quyền Môi giới
                            </DropdownMenuItem>
                          )}
                          {user.status === 'active' ? (
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setShowBanDialog(true);
                            }} className="text-red-600">
                              <XCircle className="h-4 w-4 mr-2" />
                              Khóa tài khoản
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-green-600">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mở khóa
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {user.role !== 'admin' && (
                            <DropdownMenuItem onClick={() => handleDelete(user)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          )}
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

      {/* View User Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar || undefined} />
                  <AvatarFallback className="text-xl">{selectedUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <Badge className={roleConfig[selectedUser.role as keyof typeof roleConfig].color}>
                    {roleConfig[selectedUser.role as keyof typeof roleConfig].label}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Số điện thoại</p>
                  <p className="font-medium">{selectedUser.phone || 'Chưa cung cấp'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tin đăng</p>
                  <p className="font-medium">{selectedUser.total_listings}</p>
                </div>
                <div>
                  <p className="text-gray-500">Ngày tham gia</p>
                  <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Khóa tài khoản</DialogTitle>
            <DialogDescription>
              Khóa tài khoản của "{selectedUser?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Lý do khóa tài khoản..."
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleBan}>
              Khóa tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
