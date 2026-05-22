'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Eye,
  CheckCircle,
  XCircle,
  Search,
  Clock,
  User,
  Users,
  ShieldAlert,
  UserCheck,
  UserX,
  Mail,
  Phone,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { userAdminApi, type AdminUser } from '@/lib/admin-api';

type UserRole = 'admin' | 'agent' | 'user';
type UserStatus = 'active' | 'inactive' | 'banned';

// Mock users with authentic Quảng Ngãi real estate broker contexts
const MOCK_USERS = [
  {
    id: 1,
    name: 'Lê Hoài Nam',
    email: 'hoainam.moducland@gmail.com',
    phone: '0914 234 567',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    role: 'agent',
    status: 'active',
    total_listings: 45,
    created_at: '2025-06-15T10:00:00Z',
  },
  {
    id: 2,
    name: 'Nguyễn Quốc Bảo',
    email: 'quocbao.datquangngai@gmail.com',
    phone: '0905 123 456',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    role: 'agent',
    status: 'active',
    total_listings: 28,
    created_at: '2025-08-20T15:45:00Z',
  },
  {
    id: 3,
    name: 'Phạm Thu Thảo',
    email: 'thuthao.binhson@gmail.com',
    phone: '0983 998 877',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    role: 'user',
    status: 'active',
    total_listings: 2,
    created_at: '2026-01-10T09:20:00Z',
  },
  {
    id: 4,
    name: 'Vũ Đức Trọng',
    email: 'ductrong.ducpho@gmail.com',
    phone: '0912 443 322',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop',
    role: 'user',
    status: 'inactive',
    total_listings: 5,
    created_at: '2026-02-15T11:10:00Z',
  },
  {
    id: 5,
    name: 'Công ty BDS Thịnh Phát',
    email: 'contact@thinhphatquangngai.vn',
    phone: '0255 3888 999',
    avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop',
    role: 'agent',
    status: 'active',
    total_listings: 112,
    created_at: '2025-01-01T08:00:00Z',
  },
  {
    id: 6,
    name: 'Trần Minh Quân',
    email: 'minhquan.tunghia@gmail.com',
    phone: '0979 667 788',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop',
    role: 'user',
    status: 'banned',
    ban_reason: 'Đăng tin giả mạo lặp đi lặp lại nhiều lần dù đã bị cảnh cáo.',
    total_listings: 0,
    created_at: '2025-05-18T14:30:00Z',
  },
  {
    id: 7,
    name: 'Nguyễn Văn Đạt',
    email: 'vandat.diaoc@gmail.com',
    phone: '0935 443 311',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    role: 'agent',
    status: 'active',
    total_listings: 34,
    created_at: '2025-09-12T10:00:00Z',
  },
  {
    id: 8,
    name: 'Lê Thanh Bình',
    email: 'thanhbinh.datquang@gmail.com',
    phone: '0919 554 433',
    avatar: null,
    role: 'user',
    status: 'active',
    total_listings: 1,
    created_at: '2026-03-01T16:20:00Z',
  },
  {
    id: 9,
    name: 'Phan Thanh Hải',
    email: 'thanhhai.sontinh@gmail.com',
    phone: '0903 778 899',
    avatar: null,
    role: 'agent',
    status: 'inactive',
    total_listings: 12,
    created_at: '2025-11-05T09:40:00Z',
  },
  {
    id: 10,
    name: 'Super Admin',
    email: 'admin@batdongsanquangngai.vn',
    phone: '0909 999 999',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    role: 'admin',
    status: 'active',
    total_listings: 0,
    created_at: '2024-01-01T00:00:00Z',
  }
];

const roleConfig: Record<UserRole, { label: string; color: string; icon: React.ElementType }> = {
  admin: { label: 'Quản trị', color: 'bg-blue-50 text-blue-700 border-blue-200/50', icon: ShieldAlert },
  agent: { label: 'Môi giới / Đại lý', color: 'bg-primary-light text-primary border-primary-200/40', icon: UserCheck },
  user: { label: 'Người dùng thường', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: User },
};

const statusConfig: Record<UserStatus, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Hoạt động', color: 'bg-green-50 text-green-700 hover:bg-green-100/60 border-green-200/50', icon: CheckCircle },
  inactive: { label: 'Tạm khóa', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100/60 border-yellow-200/50', icon: Clock },
  banned: { label: 'Bị cấm', color: 'bg-red-50 text-red-700 hover:bg-red-100/60 border-red-200/50', icon: XCircle },
};

const statusTabs = [
  { value: 'all', label: 'Tất cả' },
  { value: 'agent', label: 'Môi giới / Đại lý' },
  { value: 'user', label: 'Người dùng thường' },
  { value: 'banned', label: 'Bị cấm / Khóa' },
];

export default function AdminUsersPage() {
  const confirm = useConfirm();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [useRealApi, setUseRealApi] = useState(true);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState('');
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {};
      
      const res = await userAdminApi.list(params);
      if (res && res.data) {
        setUsers(res.data);
        setUseRealApi(true);
      } else {
        setUsers(MOCK_USERS);
        setUseRealApi(false);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
      setUsers(MOCK_USERS);
      setUseRealApi(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Simulate premium micro-animation delay when page/filters change
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, searchQuery, roleFilter, page, perPage]);

  // Client-side combined filtering
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 1. Status Filter Tab matching
      let matchStatusTab = true;
      if (statusFilter === 'agent') matchStatusTab = user.role === 'agent';
      else if (statusFilter === 'user') matchStatusTab = user.role === 'user';
      else if (statusFilter === 'banned') matchStatusTab = user.status === 'banned' || user.status === 'inactive';

      // 2. Role select box matching
      const matchRole = roleFilter === 'all' || user.role === roleFilter;

      // 3. Search query matching
      const matchSearch = !searchQuery.trim() || 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.includes(searchQuery) ||
        user.id?.toString().includes(searchQuery);

      return matchStatusTab && matchRole && matchSearch;
    });
  }, [users, statusFilter, roleFilter, searchQuery]);

  // Pagination calculation
  const totalCount = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const pageIndex = Math.min(page, totalPages);
  const startIndex = (pageIndex - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalCount);

  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, startIndex, endIndex]);

  // Quick stats calculation
  const totalUsersCount = users.length;
  const agentsCount = users.filter((u) => u.role === 'agent').length;
  const normalCount = users.filter((u) => u.role === 'user').length;
  const bannedCount = users.filter((u) => u.status === 'banned' || u.status === 'inactive').length;

  // Actions
  const handleBanSubmit = async () => {
    if (!selectedUser || !banReason.trim()) return;
    try {
      setIsActionPending(true);
      if (useRealApi) {
        await userAdminApi.ban(selectedUser.id);
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? { ...u, status: 'banned', ban_reason: banReason }
            : u
        )
      );
      toast.success('Đã khóa tài khoản người dùng thành công.');
      setShowBanDialog(false);
      setSelectedUser(null);
      setBanReason('');
    } catch {
      toast.error('Có lỗi xảy ra khi khóa tài khoản.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleUnban = async (user: AdminUser) => {
    const isConfirmed = await confirm({
      title: 'Mở khóa tài khoản?',
      description: `Xác nhận mở khóa tài khoản cho "${user.name}"? Người dùng sẽ được phép đăng nhập lại và đăng tin bình thường.`,
      confirmText: 'Mở khóa',
      variant: 'default',
    });
    if (!isConfirmed) return;
    try {
      setIsActionPending(true);
      if (useRealApi) {
        await userAdminApi.unban(user.id);
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: 'active', ban_reason: null } : u))
      );
      toast.success('Đã mở khóa tài khoản thành công!');
    } catch {
      toast.error('Có lỗi xảy ra khi mở khóa tài khoản.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleChangeRole = async (user: AdminUser, newRole: UserRole) => {
    const isConfirmed = await confirm({
      title: 'Thay đổi vai trò?',
      description: `Bạn có chắc muốn chuyển vai trò của "${user.name}" sang "${roleConfig[newRole].label}"?`,
      confirmText: 'Thay đổi',
      variant: 'warning',
    });
    if (!isConfirmed) return;
    try {
      setIsActionPending(true);
      if (useRealApi) {
        await userAdminApi.updateRole(user.id, newRole);
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      toast.success('Đã cập nhật vai trò người dùng thành công!');
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật phân quyền.');
    } finally {
      setIsActionPending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý người dùng</h1>
          <p className="text-sm text-gray-500 mt-1">Kiểm soát danh sách tài khoản, số điện thoại, phân quyền và trạng thái hoạt động môi giới Quảng Ngãi</p>
        </div>
        <Button className="bg-primary hover:bg-primary-dark rounded-xl font-bold text-xs h-9.5 gap-1.5 shadow-sm text-white transition-all">
          <PlusCircle className="h-4 w-4" />
          Thêm tài khoản mới
        </Button>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-gray-50 text-gray-650 rounded-xl border border-gray-100/50">
              <Users className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{totalUsersCount}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Tổng tài khoản</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-primary-light text-primary rounded-xl border border-primary-200/30">
              <UserCheck className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{agentsCount}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Môi giới / Đại lý</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/50">
              <User className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{normalCount}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Người dùng thường</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100/50">
              <UserX className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{bannedCount}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Tài khoản bị khóa</p>
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
            let count = 0;
            if (tab.value === 'all') count = users.length;
            else if (tab.value === 'agent') count = users.filter(u => u.role === 'agent').length;
            else if (tab.value === 'user') count = users.filter(u => u.role === 'user').length;
            else if (tab.value === 'banned') count = users.filter(u => u.status === 'banned' || u.status === 'inactive').length;

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

        {/* Right: Search Box & Role dropdown */}
        <div className="flex items-center gap-3 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-10 rounded-xl border-gray-200 focus:ring-primary/20 focus:border-primary font-medium text-xs h-9.5"
            />
          </div>

          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-44 rounded-xl border-gray-200 text-xs font-semibold text-gray-700 h-9.5 bg-white">
              <SelectValue placeholder="Phân quyền chính" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="admin">Quản trị viên</SelectItem>
              <SelectItem value="agent">Môi giới / Đại lý</SelectItem>
              <SelectItem value="user">Người dùng thường</SelectItem>
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
                  <TableHead className="w-[300px] font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Thành viên / Liên hệ</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Vai trò quyền</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Trạng thái</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Số tin đăng</TableHead>
                  <TableHead className="font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5">Ngày tham gia</TableHead>
                  <TableHead className="text-right font-extrabold text-[10.5px] uppercase tracking-wider text-gray-400 py-3.5 pr-6">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading || isFiltering ? (
                  [...Array(perPage)].map((_, idx) => (
                    <TableRow key={idx} className="border-b border-gray-100/60">
                      <TableCell className="pl-6"><div className="h-4 w-6 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
                            <div className="h-3 w-44 bg-gray-100 rounded animate-pulse" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><div className="h-5.5 w-24 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell><div className="h-5.5 w-20 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-10 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-20 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell className="text-right pr-6"><div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-gray-400 font-medium">
                      Không tìm thấy tài khoản người dùng nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => {
                    const roleCfg = roleConfig[user.role as UserRole] || roleConfig.user;
                    const statusCfg = statusConfig[user.status as UserStatus] || statusConfig.active;
                    const RoleIcon = roleCfg.icon;
                    const StatusIcon = statusCfg.icon;

                    return (
                      <TableRow key={user.id} className="hover:bg-gray-50/40 border-b border-gray-100 transition-colors">
                        {/* ID */}
                        <TableCell className="font-bold text-gray-400 text-xs pl-6">
                          #{user.id}
                        </TableCell>

                        {/* Profile Info */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-gray-100 shadow-sm shrink-0">
                              <AvatarImage src={user.avatar || undefined} />
                              <AvatarFallback className="bg-gray-100 text-gray-700 font-extrabold text-xs">
                                {user.name?.charAt(0) ?? '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 text-[13px] leading-snug truncate">{user.name}</p>
                              <div className="flex flex-col text-[10.5px] text-gray-500 font-medium mt-0.5 space-y-0.5">
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                                  {user.email}
                                </span>
                                {user.phone && (
                                  <span className="flex items-center gap-1 shrink-0 font-bold">
                                    <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                                    {user.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Role */}
                        <TableCell>
                          <Badge className={`${roleCfg.color} border border-gray-100/50 shadow-none font-bold py-0.5 px-2.5 text-[10px] rounded-full tracking-wide flex items-center gap-1.5 w-fit`}>
                            <RoleIcon className="h-3.5 w-3.5 shrink-0" />
                            {roleCfg.label}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge className={`${statusCfg.color} border border-gray-100/50 shadow-none font-bold py-0.5 px-2.5 text-[10px] rounded-full tracking-wide flex items-center gap-1.5 w-fit`}>
                            <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                            {statusCfg.label}
                          </Badge>
                        </TableCell>

                        {/* Total Listings */}
                        <TableCell className="font-bold text-gray-800 text-xs">
                          {user.total_listings || 0} tin đăng
                        </TableCell>

                        {/* Created At */}
                        <TableCell className="text-gray-500 font-semibold text-[11.5px] whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400 animate-pulse-slow" />
                            {formatDate(user.created_at)}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right pr-6">
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
                            <DropdownMenuContent align="end" className="rounded-xl w-52">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  // Trigger modal xem chi tiết nếu cần thiết, ở đây ta có thể dùng pop-up toast nhanh
                                  toast.info(
                                    <div>
                                      <p className="font-bold text-gray-900">Chi tiết tài khoản #{user.id}</p>
                                      <p className="text-xs text-gray-500 mt-1">Họ tên: {user.name}</p>
                                      <p className="text-xs text-gray-500">Email: {user.email}</p>
                                      <p className="text-xs text-gray-500">SĐT: {user.phone || 'Chưa cập nhật'}</p>
                                      <p className="text-xs text-gray-500">Tin đăng: {user.total_listings || 0} tin</p>
                                      <p className="text-xs text-gray-500">Ngày tạo: {new Date(user.created_at).toLocaleDateString('vi-VN')}</p>
                                      {user.ban_reason && <p className="text-xs text-red-650 font-bold mt-1">Lý do khóa: {user.ban_reason}</p>}
                                    </div>,
                                    { duration: 6000 }
                                  );
                                }}
                                className="font-bold text-xs gap-2 rounded-lg cursor-pointer"
                              >
                                <Eye className="h-4 w-4" />
                                Xem nhanh thông tin
                              </DropdownMenuItem>

                              {user.role !== 'admin' && (
                                <>
                                  <DropdownMenuSeparator />
                                  {user.role !== 'agent' && (
                                    <DropdownMenuItem
                                      onClick={() => handleChangeRole(user, 'agent')}
                                      className="font-bold text-xs text-primary gap-2 focus:bg-primary-light focus:text-primary rounded-lg cursor-pointer"
                                    >
                                      <UserCheck className="h-4 w-4 text-primary" />
                                      Cấp quyền Môi giới
                                    </DropdownMenuItem>
                                  )}
                                  {user.role !== 'user' && (
                                    <DropdownMenuItem
                                      onClick={() => handleChangeRole(user, 'user')}
                                      className="font-bold text-xs text-gray-600 gap-2 focus:bg-gray-100 focus:text-gray-700 rounded-lg cursor-pointer"
                                    >
                                      <User className="h-4 w-4 text-gray-500" />
                                      Hạ quyền Người dùng
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleChangeRole(user, 'admin')}
                                    className="font-bold text-xs text-blue-600 gap-2 focus:bg-blue-50 focus:text-blue-700 rounded-lg cursor-pointer"
                                  >
                                    <ShieldAlert className="h-4 w-4 text-blue-500" />
                                    Cấp quyền Quản trị
                                  </DropdownMenuItem>
                                </>
                              )}

                              <DropdownMenuSeparator />
                              {user.status === 'banned' || user.status === 'inactive' ? (
                                <DropdownMenuItem
                                  onClick={() => handleUnban(user)}
                                  className="text-green-600 font-bold text-xs gap-2 focus:text-green-700 focus:bg-green-50/50 rounded-lg cursor-pointer"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Mở khóa tài khoản
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setBanReason('');
                                    setShowBanDialog(true);
                                  }}
                                  className="text-red-600 font-bold text-xs gap-2 focus:text-red-700 focus:bg-red-50/50 rounded-lg cursor-pointer"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Khóa tài khoản
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
                {totalCount > 0 ? `${startIndex + 1}-${endIndex}` : '0'} / {totalCount} người dùng
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

      {/* Ban User Dialog */}
      <Dialog open={showBanDialog} onOpenChange={(open) => !open && setShowBanDialog(false)}>
        <DialogContent className="max-w-[440px] rounded-2xl overflow-hidden border border-gray-100 p-0 shadow-lg bg-white">
          <div className="bg-gray-50 border-b border-gray-100 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-cta" />
                Khóa tài khoản thành viên
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-xs mt-1">
                Tài khoản bị khóa sẽ không thể truy cập hệ thống hoặc đăng tin cho tới khi được Quản trị viên mở khóa lại.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4">
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Ví dụ: Đăng tin rao bán dự án ma vi phạm quy chuẩn đạo đức hoặc spam hệ thống..."
              rows={4}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder:text-gray-400"
            />

            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowBanDialog(false);
                  setBanReason('');
                }}
                className="rounded-xl font-bold text-xs h-9.5 text-gray-500 hover:bg-gray-100"
                disabled={isActionPending}
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleBanSubmit}
                className="rounded-xl bg-cta hover:bg-cta-dark text-white font-bold text-xs h-9.5"
                disabled={!banReason.trim() || isActionPending}
              >
                {isActionPending ? 'Đang khóa...' : 'Khóa tài khoản'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
