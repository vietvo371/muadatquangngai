/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Edit,
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { userAdminApi, type AdminUser } from '@/lib/admin-api';

type UserRole = 'admin' | 'agent' | 'user';
type UserStatus = 'active' | 'inactive' | 'banned';

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

export default function UsersClient() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();

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

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AdminUser | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedUserForView, setSelectedUserForView] = useState<AdminUser | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('user');
  const [formStatus, setFormStatus] = useState<UserStatus>('active');
  const [formPassword, setFormPassword] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('user');
    setFormStatus('active');
    setFormPassword('');
  };

  const handleOpenEdit = (user: AdminUser) => {
    setSelectedUserForEdit(user);
    setFormName(user.name || '');
    setFormEmail(user.email || '');
    setFormPhone(user.phone || '');
    setFormRole(user.role as UserRole);
    setFormStatus(user.status as UserStatus);
    setFormPassword('');
    setShowEditDialog(true);
  };

  // TanStack Query v5 to fetch all users
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        const res = await userAdminApi.list();
        if (res && res.data) {
          return { users: res.data, loaded: true };
        }
      } catch (error) {
        console.error('Không tải được danh sách người dùng:', error);
      }
      return { users: [] as AdminUser[], loaded: false };
    }
  });

  // CHỈ dùng dữ liệu THẬT. Trước đây khi API lỗi, trang này rơi về danh sách người dùng bịa và
  // vẫn cho bấm Khoá/Đổi vai trò — quản trị viên thao tác trên tài khoản không tồn tại.
  // Thà hiện bảng rỗng + báo lỗi tải.
  const users = useMemo(() => data?.users ?? [], [data]);

  /** Tải danh sách thất bại → cảnh báo rõ thay vì im lặng hiện bảng rỗng. */
  const loadFailed = !!data && !data.loaded;

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
  // Lỗi tải thì hiện dấu gạch ngang — số 0 sẽ bị đọc thành "sàn không có người dùng nào".
  const totalUsersCount = loadFailed ? '—' : users.length;
  const agentsCount = loadFailed ? '—' : users.filter((u) => u.role === 'agent').length;
  const normalCount = loadFailed ? '—' : users.filter((u) => u.role === 'user').length;
  const bannedCount = loadFailed ? '—' : users.filter((u) => u.status === 'banned' || u.status === 'inactive').length;

  // Mutations
  const banMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return await userAdminApi.ban(id);
    },
    onMutate: async ({ id, reason }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-users'] });
      const previousData = queryClient.getQueryData(['admin-users']);

      queryClient.setQueryData(['admin-users'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          users: old.users.map((u: any) =>
            u.id === id ? { ...u, status: 'banned', ban_reason: reason } : u
          )
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Đã khóa tài khoản người dùng thành công.');
      setShowBanDialog(false);
      setSelectedUser(null);
      setBanReason('');
    },
    // Lỗi thì LUÔN báo lỗi — trước đây nhánh không-có-API lại báo thành công giả.
    onError: (error, variables, context: any) => {
      if (context) {
        queryClient.setQueryData(['admin-users'], context.previousData);
      }
      toast.error('Không khóa được tài khoản. Tài khoản vẫn đang hoạt động, vui lòng thử lại.');
      setShowBanDialog(false);
      setSelectedUser(null);
      setBanReason('');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const unbanMutation = useMutation({
    mutationFn: async (id: number) => {
      return await userAdminApi.unban(id);
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['admin-users'] });
      const previousData = queryClient.getQueryData(['admin-users']);

      queryClient.setQueryData(['admin-users'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          users: old.users.map((u: any) =>
            u.id === id ? { ...u, status: 'active', ban_reason: null } : u
          )
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Đã mở khóa tài khoản thành công!');
    },
    onError: (error, id, context: any) => {
      if (context) {
        queryClient.setQueryData(['admin-users'], context.previousData);
      }
      toast.error('Không mở khóa được tài khoản. Tài khoản vẫn đang bị khóa, vui lòng thử lại.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: UserRole }) => {
      return await userAdminApi.updateRole(id, role);
    },
    onMutate: async ({ id, role }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-users'] });
      const previousData = queryClient.getQueryData(['admin-users']);

      queryClient.setQueryData(['admin-users'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          users: old.users.map((u: any) =>
            u.id === id ? { ...u, role: role } : u
          )
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Đã cập nhật vai trò người dùng thành công!');
    },
    onError: (error, variables, context: any) => {
      if (context) {
        queryClient.setQueryData(['admin-users'], context.previousData);
      }
      toast.error('Không cập nhật được vai trò người dùng. Vai trò cũ vẫn được giữ nguyên, vui lòng thử lại.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (payload: Partial<AdminUser> & { password?: string }) => {
      return await userAdminApi.create(payload);
    },
    onMutate: async (newUser) => {
      await queryClient.cancelQueries({ queryKey: ['admin-users'] });
      const previousData = queryClient.getQueryData(['admin-users']);

      // Id tạm cho hàng optimistic; onSettled sẽ invalidate để lấy id thật từ máy chủ.
      const optimisticId = Math.max(...(data?.users ?? []).map((u) => u.id), 0) + 1;
      const createdUser: AdminUser = {
        id: optimisticId,
        name: newUser.name || '',
        email: newUser.email || '',
        phone: newUser.phone || '',
        avatar: null,
        role: newUser.role || 'user',
        status: newUser.status || 'active',
        created_at: new Date().toISOString(),
        total_listings: 0,
      };

      queryClient.setQueryData(['admin-users'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          users: [createdUser, ...old.users]
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Đã thêm tài khoản mới thành công.');
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error, variables, context: any) => {
      if (context) {
        queryClient.setQueryData(['admin-users'], context.previousData);
      }
      toast.error('Không tạo được tài khoản mới. Chưa có tài khoản nào được thêm, vui lòng thử lại.');
      setShowCreateDialog(false);
      resetForm();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<AdminUser> }) => {
      return await userAdminApi.update(id, payload);
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-users'] });
      const previousData = queryClient.getQueryData(['admin-users']);

      queryClient.setQueryData(['admin-users'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          users: old.users.map((u: any) => (u.id === id ? { ...u, ...payload } : u))
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin tài khoản thành công!');
      setShowEditDialog(false);
      setSelectedUserForEdit(null);
      resetForm();
    },
    onError: (error, variables, context: any) => {
      if (context) {
        queryClient.setQueryData(['admin-users'], context.previousData);
      }
      toast.error('Không cập nhật được tài khoản. Thông tin cũ vẫn được giữ nguyên, vui lòng thử lại.');
      setShowEditDialog(false);
      setSelectedUserForEdit(null);
      resetForm();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim() || !formPassword.trim()) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    createUserMutation.mutate({
      name: formName,
      email: formEmail,
      phone: formPhone,
      role: formRole,
      status: formStatus,
      password: formPassword,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    updateUserMutation.mutate({
      id: selectedUserForEdit.id,
      payload: {
        name: formName,
        email: formEmail,
        phone: formPhone,
        role: formRole,
        status: formStatus,
      },
    });
  };

  const handleBanSubmit = () => {
    if (selectedUser && banReason.trim()) {
      banMutation.mutate({ id: selectedUser.id, reason: banReason });
    }
  };

  const handleUnban = async (user: AdminUser) => {
    const isConfirmed = await confirm({
      title: 'Mở khóa tài khoản?',
      description: `Xác nhận mở khóa tài khoản cho "${user.name}"? Người dùng sẽ được phép đăng nhập lại và đăng tin bình thường.`,
      confirmText: 'Mở khóa',
      variant: 'default',
    });
    if (isConfirmed) {
      unbanMutation.mutate(user.id);
    }
  };

  const handleChangeRole = async (user: AdminUser, newRole: UserRole) => {
    const isConfirmed = await confirm({
      title: 'Thay đổi vai trò?',
      description: `Bạn có chắc muốn chuyển vai trò của "${user.name}" sang "${roleConfig[newRole].label}"?`,
      confirmText: 'Thay đổi',
      variant: 'warning',
    });
    if (isConfirmed) {
      updateRoleMutation.mutate({ id: user.id, role: newRole });
    }
  };

  const isActionPending =
    banMutation.isPending ||
    unbanMutation.isPending ||
    updateRoleMutation.isPending ||
    createUserMutation.isPending ||
    updateUserMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý người dùng</h1>
          <p className="text-sm text-gray-500 mt-1">Kiểm soát danh sách tài khoản, số điện thoại, phân quyền và trạng thái hoạt động môi giới Quảng Ngãi</p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setShowCreateDialog(true);
          }}
          data-testid="create-user-btn"
          className="bg-primary hover:bg-primary-dark rounded-xl font-bold text-xs h-9.5 gap-1.5 shadow-sm text-white transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          Thêm tài khoản mới
        </Button>
      </div>

      {/* Tải dữ liệu thất bại — nói rõ, KHÔNG hiện bảng rỗng như thể sàn không có tài khoản nào. */}
      {loadFailed && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-[13px] text-red-800">
            <p className="font-semibold">Không tải được danh sách người dùng từ máy chủ.</p>
            <p className="mt-0.5">Bảng bên dưới đang trống và các ô thống kê hiển thị dấu gạch ngang do lỗi kết nối, không phải vì sàn không có tài khoản. Vui lòng tải lại trang.</p>
          </div>
        </div>
      )}

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

          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v || 'all'); setPage(1); }}>
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
                {isLoading ? (
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
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
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
                                  setSelectedUserForView(user);
                                  setShowViewDialog(true);
                                }}
                                data-testid={`view-user-btn-${user.id}`}
                                className="font-bold text-xs gap-2 rounded-lg cursor-pointer"
                              >
                                <Eye className="h-4 w-4" />
                                Xem nhanh thông tin
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleOpenEdit(user)}
                                data-testid={`edit-user-btn-${user.id}`}
                                className="font-bold text-xs gap-2 rounded-lg cursor-pointer"
                              >
                                <Edit className="h-4 w-4 text-gray-500" />
                                Chỉnh sửa thông tin
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
                                  disabled={isActionPending}
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
                                  disabled={isActionPending}
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
        <DialogContent className="sm:max-w-[440px] rounded-2xl overflow-hidden border border-gray-100 p-0 shadow-lg bg-white">
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

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => !open && setShowCreateDialog(false)}>
        <DialogContent className="sm:max-w-[540px] rounded-2xl overflow-hidden border border-gray-100 p-0 shadow-lg bg-white">
          <div className="bg-gray-50 border-b border-gray-100 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Thêm tài khoản mới
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-xs mt-1">
                Tạo mới tài khoản quản trị, hỗ trợ nội bộ hoặc tài khoản cho môi giới đối tác chiến lược Quảng Ngãi.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Họ tên */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Họ tên *</label>
                <Input
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  data-testid="user-name-input"
                  className="rounded-xl border-gray-200 focus:ring-primary/20 focus:border-primary text-xs font-medium h-9.5"
                />
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Số điện thoại *</label>
                <Input
                  required
                  placeholder="Ví dụ: 0905 123 456"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  data-testid="user-phone-input"
                  className="rounded-xl border-gray-200 focus:ring-primary/20 focus:border-primary text-xs font-medium h-9.5"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email liên hệ *</label>
                <Input
                  required
                  type="email"
                  placeholder="vi_du@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  data-testid="user-email-input"
                  className="rounded-xl border-gray-200 focus:ring-primary/20 focus:border-primary text-xs font-medium h-9.5"
                />
              </div>

              {/* Mật khẩu khởi tạo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mật khẩu *</label>
                <Input
                  required
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  data-testid="user-password-input"
                  className="rounded-xl border-gray-200 focus:ring-primary/20 focus:border-primary text-xs font-medium h-9.5"
                />
              </div>

              {/* Vai trò */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vai trò chính *</label>
                <Select value={formRole} onValueChange={(v) => setFormRole((v || 'user') as UserRole)}>
                  <SelectTrigger data-testid="user-role-select" className="rounded-xl border-gray-200 text-xs font-semibold text-gray-700 h-9.5 bg-white w-full">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="user">Người dùng thường</SelectItem>
                    <SelectItem value="agent">Môi giới / Đại lý</SelectItem>
                    <SelectItem value="admin">Quản trị viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Trạng thái */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái ban đầu *</label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus((v || 'active') as UserStatus)}>
                  <SelectTrigger data-testid="user-status-select" className="rounded-xl border-gray-200 text-xs font-semibold text-gray-700 h-9.5 bg-white w-full">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Tạm khóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                className="rounded-xl font-bold text-xs h-9.5 text-gray-500 hover:bg-gray-100"
                disabled={isActionPending}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                data-testid="user-submit-btn"
                className="rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs h-9.5 px-4 shadow-sm"
                disabled={isActionPending}
              >
                {isActionPending ? 'Đang xử lý...' : 'Thêm tài khoản'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => !open && setShowEditDialog(false)}>
        <DialogContent className="sm:max-w-[540px] rounded-2xl overflow-hidden border border-gray-100 p-0 shadow-lg bg-white">
          <div className="bg-gray-50 border-b border-gray-100 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Chỉnh sửa tài khoản #{selectedUserForEdit?.id}
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-xs mt-1">
                Cập nhật thông tin định danh và vai trò hoạt động của thành viên trong hệ thống Quảng Ngãi.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
            {/* Warning Message */}
            <div className="bg-yellow-50/70 border border-yellow-200 p-3 rounded-xl flex gap-2.5 items-start">
              <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-yellow-800 leading-snug">
                <strong>Lưu ý:</strong> Việc thay đổi các trường định danh nhạy cảm như Email hay Số điện thoại có thể ảnh hưởng đến lịch sử giao dịch và khả năng xác thực hiện tại của thành viên này.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Họ tên */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Họ tên *</label>
                <Input
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  data-testid="user-name-input"
                  className="rounded-xl border-gray-200 focus:ring-primary/20 focus:border-primary text-xs font-medium h-9.5"
                />
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Số điện thoại *</label>
                <Input
                  required
                  placeholder="Ví dụ: 0905 123 456"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  data-testid="user-phone-input"
                  className="rounded-xl border-gray-200 focus:ring-primary/20 focus:border-primary text-xs font-medium h-9.5"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email liên hệ *</label>
                <Input
                  required
                  type="email"
                  placeholder="vi_du@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  data-testid="user-email-input"
                  className="rounded-xl border-gray-200 focus:ring-primary/20 focus:border-primary text-xs font-medium h-9.5"
                />
              </div>

              {/* Vai trò */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vai trò chính *</label>
                <Select value={formRole} onValueChange={(v) => setFormRole((v || 'user') as UserRole)}>
                  <SelectTrigger data-testid="user-role-select" className="rounded-xl border-gray-200 text-xs font-semibold text-gray-700 h-9.5 bg-white w-full">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="user">Người dùng thường</SelectItem>
                    <SelectItem value="agent">Môi giới / Đại lý</SelectItem>
                    <SelectItem value="admin">Quản trị viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Trạng thái */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái *</label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus((v || 'active') as UserStatus)}>
                  <SelectTrigger data-testid="user-status-select" className="rounded-xl border-gray-200 text-xs font-semibold text-gray-700 h-9.5 bg-white w-full">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Tạm khóa</SelectItem>
                    <SelectItem value="banned">Bị cấm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowEditDialog(false);
                  setSelectedUserForEdit(null);
                  resetForm();
                }}
                className="rounded-xl font-bold text-xs h-9.5 text-gray-500 hover:bg-gray-100"
                disabled={isActionPending}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                data-testid="user-submit-btn"
                className="rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs h-9.5 px-4 shadow-sm"
                disabled={isActionPending}
              >
                {isActionPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View User Details Dialog */}
      <Dialog open={showViewDialog} onOpenChange={(open) => !open && setShowViewDialog(false)}>
        <DialogContent data-testid="view-user-dialog" className="sm:max-w-[480px] rounded-2xl overflow-hidden border border-gray-100 p-0 shadow-lg bg-white">
          <div className="bg-gray-50 border-b border-gray-100 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Chi tiết tài khoản #{selectedUserForView?.id}
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-xs mt-1">
                Xem nhanh thông tin định danh và lịch sử hoạt động của thành viên.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            {/* User Profile Card Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100">
              <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                <AvatarImage src={selectedUserForView?.avatar || ''} alt={selectedUserForView?.name || ''} />
                <AvatarFallback className="bg-primary-light text-primary text-lg font-bold">
                  {selectedUserForView?.name?.substring(0, 2).toUpperCase() || 'US'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-gray-900 leading-none">{selectedUserForView?.name}</h4>
                <p className="text-[11px] text-gray-500 font-medium">{selectedUserForView?.email}</p>
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {/* Role Badge */}
                  {selectedUserForView?.role === 'admin' && (
                    <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                      Quản trị viên
                    </Badge>
                  )}
                  {selectedUserForView?.role === 'agent' && (
                    <Badge className="bg-primary-light text-primary hover:bg-primary-light border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                      Môi giới / Đại lý
                    </Badge>
                  )}
                  {selectedUserForView?.role === 'user' && (
                    <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                      Người dùng thường
                    </Badge>
                  )}

                  {/* Status Badge */}
                  {selectedUserForView?.status === 'active' && (
                    <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                      Hoạt động
                    </Badge>
                  )}
                  {selectedUserForView?.status === 'inactive' && (
                    <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                      Tạm khóa
                    </Badge>
                  )}
                  {selectedUserForView?.status === 'banned' && (
                    <Badge className="bg-red-50 text-red-650 hover:bg-red-50 border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                      Bị cấm
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Ban Reason Info Box */}
            {selectedUserForView?.status === 'banned' && (
              <div className="bg-red-50/50 border border-red-100 p-3.5 rounded-xl flex gap-3 items-start">
                <AlertTriangle className="h-4 w-4 text-red-650 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Lý do bị cấm hoạt động</span>
                  <p className="text-xs text-red-850 font-semibold leading-relaxed">
                    {selectedUserForView.ban_reason || 'Không ghi nhận lý do chi tiết.'}
                  </p>
                </div>
              </div>
            )}

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Họ tên */}
              <div className="space-y-1 p-3 rounded-xl border border-gray-100 bg-white shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Họ và tên</span>
                <p className="text-xs font-bold text-gray-800">{selectedUserForView?.name}</p>
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1 p-3 rounded-xl border border-gray-100 bg-white shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Phone className="h-3 w-3 text-gray-400" /> Số điện thoại
                </span>
                <p className="text-xs font-bold text-gray-800">{selectedUserForView?.phone || 'Chưa cập nhật'}</p>
              </div>

              {/* Email */}
              <div className="space-y-1 p-3 rounded-xl border border-gray-100 bg-white shadow-xs col-span-1 sm:col-span-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Mail className="h-3 w-3 text-gray-400" /> Email liên hệ
                </span>
                <p className="text-xs font-bold text-gray-800">{selectedUserForView?.email}</p>
              </div>

              {/* Tổng số tin đăng */}
              <div className="space-y-1 p-3 rounded-xl border border-gray-100 bg-white shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Users className="h-3 w-3 text-gray-400" /> Tổng số tin đăng
                </span>
                <p className="text-xs font-bold text-primary">{selectedUserForView?.total_listings || 0} tin</p>
              </div>

              {/* Ngày đăng ký */}
              <div className="space-y-1 p-3 rounded-xl border border-gray-100 bg-white shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-400" /> Ngày đăng ký
                </span>
                <p className="text-xs font-bold text-gray-800">
                  {selectedUserForView?.created_at ? formatDate(selectedUserForView.created_at) : 'Chưa xác định'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowViewDialog(false);
                  setSelectedUserForView(null);
                }}
                className="rounded-xl font-bold text-xs h-9.5 text-gray-500 hover:bg-gray-100"
              >
                Đóng lại
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (selectedUserForView) {
                    setShowViewDialog(false);
                    handleOpenEdit(selectedUserForView);
                  }
                }}
                data-testid="view-user-edit-btn"
                className="rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs h-9.5 px-4 shadow-sm flex items-center gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" />
                Chỉnh sửa tài khoản
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
