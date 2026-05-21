'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Users,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { StatsGrid } from '@/components/admin';
import { toast } from 'sonner';
import { userAdminApi, AdminUser } from '@/lib/admin-api';

// Mock users fallback
const MOCK_USERS = [
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
  admin: { label: 'Quản trị', color: 'bg-[#e8f4fb] text-[#1075b1]' },
  agent: { label: 'Môi giới', color: 'bg-primary-light text-primary' },
  user: { label: 'Người dùng', color: 'bg-gray-100 text-gray-700' },
};

const statusConfig = {
  active: { label: 'Hoạt động', className: 'bg-green-100 text-green-700' },
  inactive: { label: 'Khóa', className: 'bg-red-100 text-red-700' },
  banned: { label: 'Cấm', className: 'bg-gray-100 text-gray-700' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [useRealApi, setUseRealApi] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState('');

  // Fetch users from live API
  const loadUsers = useCallback(async (targetPage = 1) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        page: targetPage,
      };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await userAdminApi.list(params);
      if (res && res.data) {
        setUsers(res.data);
        setPagination({
          current_page: res.meta.current_page || 1,
          last_page: res.meta.last_page || 1,
          per_page: res.meta.per_page || 20,
          total: res.meta.total || 0,
        });
        setUseRealApi(true);
      } else {
        setUseRealApi(false);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
      setUseRealApi(false);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, searchQuery]);

  useEffect(() => {
    loadUsers(page);
  }, [page, loadUsers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleRoleChange = (val: string) => {
    setRoleFilter(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  // Offline filters fallback
  const displayUsers = useMemo(() => {
    if (useRealApi) {
      return users;
    }
    return MOCK_USERS.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          (u.phone && u.phone.includes(query))
        );
      }
      return true;
    });
  }, [useRealApi, users, roleFilter, statusFilter, searchQuery]);

  // Compute statistics
  const stats = useMemo(() => {
    if (useRealApi) {
      const total = pagination.total;
      const agents = users.filter(u => u.role === 'agent').length;
      const normalUsers = users.filter(u => u.role === 'user').length;
      const inactiveOrBanned = users.filter(u => u.status === 'inactive' || u.status === 'banned').length;
      return {
        total,
        agents: roleFilter === 'agent' ? total : (roleFilter === 'all' ? agents : 0),
        users: roleFilter === 'user' ? total : (roleFilter === 'all' ? normalUsers : 0),
        banned: statusFilter === 'inactive' || statusFilter === 'banned' ? total : inactiveOrBanned,
      };
    } else {
      const total = MOCK_USERS.length;
      const agents = MOCK_USERS.filter(u => u.role === 'agent').length;
      const normalUsers = MOCK_USERS.filter(u => u.role === 'user').length;
      const inactiveOrBanned = MOCK_USERS.filter(u => u.status === 'inactive' || u.status === 'banned').length;
      return {
        total,
        agents,
        users: normalUsers,
        banned: inactiveOrBanned,
      };
    }
  }, [useRealApi, users, pagination.total, roleFilter, statusFilter]);

  // Live actions integration
  const handleBan = async () => {
    if (selectedUser) {
      try {
        const res = await userAdminApi.ban(selectedUser.id);
        if (res && res.success) {
          toast.success(res.message || `Đã khóa tài khoản của "${selectedUser.name}"!`);
          setShowBanDialog(false);
          setSelectedUser(null);
          setBanReason('');
          loadUsers(page);
        } else {
          toast.error('Không thể khóa tài khoản.');
        }
      } catch {
        toast.error('Lỗi khi kết nối đến máy chủ.');
      }
    }
  };

  const handleUnban = async (user: AdminUser) => {
    try {
      const res = await userAdminApi.unban(user.id);
      if (res && res.success) {
        toast.success(res.message || `Đã mở khóa tài khoản của "${user.name}"!`);
        loadUsers(page);
      } else {
        toast.error('Không thể mở khóa tài khoản.');
      }
    } catch {
      toast.error('Lỗi khi kết nối đến máy chủ.');
    }
  };

  const handleChangeRole = async (user: AdminUser, newRole: string) => {
    try {
      const res = await userAdminApi.updateRole(user.id, newRole);
      if (res && res.success) {
        toast.success(res.message || `Đã cập nhật vai trò của "${user.name}" thành công!`);
        loadUsers(page);
      } else {
        toast.error('Không thể cập nhật vai trò.');
      }
    } catch {
      toast.error('Lỗi khi kết nối đến máy chủ.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-500">Quản lý tài khoản và phân quyền người dùng</p>
        </div>
        <Button className="bg-primary text-white hover:bg-primary/90 rounded-xl font-bold px-5 h-11 border-0 shadow-sm transition-all duration-200">
          <UserPlus className="h-4.5 w-4.5 mr-2" />
          Thêm người dùng
        </Button>
      </div>

      {/* Stats */}
      <StatsGrid
        stats={[
          { label: 'Tổng người dùng', value: stats.total, icon: Users },
          { label: 'Môi giới', value: stats.agents, icon: UserCheck },
          { label: 'Người dùng', value: stats.users, icon: Users },
          { label: 'Bị khóa/Cấm', value: stats.banned, icon: UserX },
        ]}
      />

      {/* Filters */}
      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4 bg-white">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm người dùng bằng tên, email, số điện thoại..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10.5 rounded-xl border-gray-200 focus:ring-primary/20 focus:border-primary font-medium"
                />
              </div>
            </div>

            <Select value={roleFilter} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-44 rounded-xl border-gray-200 focus:ring-primary/20 focus:border-primary font-semibold text-gray-700">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="admin">Quản trị</SelectItem>
                <SelectItem value="agent">Môi giới</SelectItem>
                <SelectItem value="user">Người dùng</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-44 rounded-xl border-gray-200 focus:ring-primary/20 focus:border-primary font-semibold text-gray-700">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
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
      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-[380px] font-bold text-gray-700">Người dùng</TableHead>
                <TableHead className="font-bold text-gray-700">Vai trò</TableHead>
                <TableHead className="font-bold text-gray-700">Trạng thái</TableHead>
                <TableHead className="font-bold text-gray-700">Tin đăng</TableHead>
                <TableHead className="font-bold text-gray-700">Ngày tham gia</TableHead>
                <TableHead className="text-right font-bold text-gray-700">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><div className="h-6 w-16 bg-gray-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-6 w-20 bg-gray-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-8 bg-gray-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-20 bg-gray-100 rounded animate-pulse" /></TableCell>
                    <TableCell className="text-right"><div className="h-8 w-8 bg-gray-100 rounded-full animate-pulse ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : displayUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500 font-medium">
                    Không có người dùng nào phù hợp với bộ lọc của bạn.
                  </TableCell>
                </TableRow>
              ) : (
                displayUsers.map((user) => {
                  const role = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.user;
                  const status = statusConfig[user.status as keyof typeof statusConfig] || statusConfig.active;

                  return (
                    <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-gray-100 shadow-sm shrink-0">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback className="bg-primary-light text-primary font-extrabold">{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                            <div className="flex items-center gap-2 text-[12px] text-gray-500 font-medium mt-0.5">
                              <span className="flex items-center gap-1 truncate">
                                <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                {user.email}
                              </span>
                              {user.phone && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 shrink-0">
                                    <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                    {user.phone}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${role.color} border-0 font-bold px-2.5 py-0.5 shadow-none text-[11px]`}>
                          {role.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${status.className} border-0 font-bold px-2.5 py-0.5 shadow-none text-[11px]`}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-700">{user.total_listings || 0}</TableCell>
                      <TableCell className="text-gray-500 font-medium text-[13px]">{formatDate(user.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-gray-100 rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setShowViewDialog(true);
                            }} className="cursor-pointer">
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.role !== 'admin' && (
                              <>
                                {user.role !== 'agent' && (
                                  <DropdownMenuItem onClick={() => handleChangeRole(user, 'agent')} className="cursor-pointer font-medium text-primary hover:bg-primary-light">
                                    <Shield className="h-4 w-4 mr-2 text-primary" />
                                    Phân quyền Môi giới
                                  </DropdownMenuItem>
                                )}
                                {user.role !== 'user' && (
                                  <DropdownMenuItem onClick={() => handleChangeRole(user, 'user')} className="cursor-pointer font-medium text-gray-650">
                                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                                    Chuyển thành Người dùng
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => {
                                  if (confirm(`Bạn có chắc chắn muốn phân quyền Quản trị cho "${user.name}"?`)) {
                                    handleChangeRole(user, 'admin');
                                  }
                                }} className="cursor-pointer text-[#1075b1] font-medium">
                                  <ShieldAlert className="h-4 w-4 mr-2 text-[#1075b1]" />
                                  Phân quyền Quản trị
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {user.status === 'active' ? (
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user);
                                setShowBanDialog(true);
                              }} className="text-red-650 cursor-pointer font-medium">
                                <XCircle className="h-4 w-4 mr-2" />
                                Khóa tài khoản
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleUnban(user)} className="text-green-600 cursor-pointer font-medium">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mở khóa
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!loading && useRealApi && pagination.last_page > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <p className="text-[13px] text-gray-500 font-semibold">
                Hiển thị {displayUsers.length} trên tổng số {pagination.total} người dùng
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={pagination.current_page === 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {(() => {
                  const pages = [];
                  const curr = pagination.current_page;
                  const last = pagination.last_page;
                  
                  if (last <= 5) {
                    for (let i = 1; i <= last; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    const start = Math.max(2, curr - 1);
                    const end = Math.min(last - 1, curr + 1);
                    if (start > 2) pages.push('...');
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (end < last - 1) pages.push('...');
                    pages.push(last);
                  }
                  
                  return pages.map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 font-medium">
                          …
                        </span>
                      );
                    }
                    
                    const isCurrent = p === curr;
                    return (
                      <Button
                        key={`page-${p}`}
                        variant={isCurrent ? 'default' : 'outline'}
                        className={`h-8 w-8 rounded-lg font-bold text-xs ${isCurrent ? 'bg-primary text-white shadow-sm border-0' : ''}`}
                        onClick={() => setPage(Number(p))}
                      >
                        {p}
                      </Button>
                    );
                  });
                })()}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={pagination.current_page === pagination.last_page}
                  onClick={() => setPage(p => Math.min(p + 1, pagination.last_page))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-[440px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Chi tiết người dùng</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-5 py-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border border-gray-100 shadow-sm shrink-0">
                  <AvatarImage src={selectedUser.avatar || undefined} />
                  <AvatarFallback className="text-2xl bg-primary-light text-primary font-black">
                    {selectedUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedUser.name}</h3>
                  <Badge className={`${roleConfig[selectedUser.role as keyof typeof roleConfig]?.color || 'bg-gray-100 text-gray-700'} border-0 font-bold px-2.5 py-0.5 shadow-none text-[11px] mt-1.5`}>
                    {roleConfig[selectedUser.role as keyof typeof roleConfig]?.label || 'Người dùng'}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-[13px] bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                <div className="space-y-1">
                  <p className="text-gray-400 font-medium">Email</p>
                  <p className="font-bold text-gray-800 break-all">{selectedUser.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400 font-medium">Số điện thoại</p>
                  <p className="font-bold text-gray-800">{selectedUser.phone || 'Chưa cung cấp'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400 font-medium">Số tin đăng</p>
                  <p className="font-bold text-gray-800">{selectedUser.total_listings || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400 font-medium">Ngày tham gia</p>
                  <p className="font-bold text-gray-800">{formatDate(selectedUser.created_at)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)} className="rounded-xl font-bold h-11 w-full sm:w-auto">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent className="max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Khóa tài khoản</DialogTitle>
            <DialogDescription className="text-gray-500 text-sm mt-1">
              Bạn có chắc chắn muốn khóa tài khoản của &ldquo;{selectedUser?.name}&rdquo;? Người dùng này sẽ không thể đăng nhập hoặc thực hiện bất kỳ hành động nào.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Vui lòng nhập lý do khóa tài khoản..."
              rows={4}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-[14px] font-medium placeholder-gray-400 transition-all"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowBanDialog(false)} className="rounded-xl font-bold h-11">
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleBan} className="bg-cta text-white hover:bg-cta-dark border-0 rounded-xl font-bold h-11">
              Khóa tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
