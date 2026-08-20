'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/stores/authStore';
import axios from '@/lib/axios';
import { dashboardApi } from '@/lib/admin-api';
import {
  Search,
  Bell,
  LogOut,
  ExternalLink,
  ChevronDown,
  User as UserIcon,
  Settings,
  Menu,
} from 'lucide-react';
import { useConfirm } from '@/components/providers/confirm-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const confirm = useConfirm();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();

  const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';

  const [authorized, setAuthorized] = useState(false);

  // Handle Mount and Zustand Hydration in Client
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      if (useAuthStore.persist.hasHydrated()) {
        setIsHydrated(true);
      }
    }, 0);

    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  // Fetch pending items count for Bell Notification icon
  const fetchPendingStats = async () => {
    try {
      const statsRes = await dashboardApi.getStats();
      if (statsRes && statsRes.success && statsRes.data) {
        setPendingCount(statsRes.data.pending_properties || 0);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thống kê chờ duyệt cho Header:', error);
    }
  };

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;

    const verifyAuth = async () => {
      // 1. Kiểm tra nhanh bằng localStorage token để tránh race condition đẩy về login ngay khi F5
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        router.replace('/login');
        return;
      }

      // 2. Chờ Zustand khôi phục dữ liệu từ localStorage xong
      if (!isHydrated) return;

      // Nếu đã hydrate xong mà store báo không có auth hoặc không có user thì mới redirect
      if (!isAuthenticated || !user) {
        router.replace('/login');
        return;
      }

      // Check role locally first
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      if (!isAdmin) {
        router.replace('/dashboard');
        return;
      }

      if (!cancelled) {
        setAuthorized(true);
        // Fetch pending notifications after authorization
        fetchPendingStats();
      }

      // 3. Server-side verification: confirm token is still valid
      try {
        const response = await axios.get('/api/v2/user/me');
        const fetchedUser = response.data.data;
        const fetchedIsAdmin = fetchedUser.role === 'admin' || fetchedUser.role === 'super_admin';

        if (!fetchedIsAdmin) {
          router.replace('/dashboard');
          return;
        }
      } catch {
        // Token expired or invalid — clear and redirect to login
        if (!cancelled) {
          logout();
          router.replace('/login');
        }
      }
    };

    verifyAuth();

    return () => {
      cancelled = true;
    };
  }, [mounted, isHydrated, isAuthenticated, user, logout, router]);

  // Handle standard logout with Zustand authStore
  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: 'Đăng xuất tài khoản?',
      description: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị BatDongSan Quảng Ngãi?',
      confirmText: 'Đăng xuất',
      variant: 'destructive',
    });
    if (isConfirmed) {
      logout();
      router.replace('/login');
    }
  };

  // Generate dynamic breadcrumbs based on active pathname
  const getBreadcrumbs = () => {
    const paths = (pathname || '').split('/').filter(Boolean);
    return paths.map((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      let label = path;
      if (path === 'admin') {
        label = 'Hệ thống';
      } else {
        const mapping: Record<string, string> = {
          properties: 'Quản lý tin đăng',
          verifications: 'Xác thực môi giới',
          projects: 'Quản lý dự án',
          transactions: 'Quản lý giao dịch',
          users: 'Quản lý người dùng',
          categories: 'Quản lý danh mục',
          packages: 'Gói dịch vụ',
          reports: 'Báo cáo vi phạm',
        };
        label = mapping[path] || path;
      }

      const isLast = index === paths.length - 1;
      return { label, href, isLast };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  // Show loading spinner while verifying
  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <p className="text-sm text-gray-500 font-medium">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Sidebar 
          variant="admin"
          collapsed={sidebarCollapsed} 
          onCollapsedChange={setSidebarCollapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-sm border border-gray-100 hover:bg-gray-50 lg:hidden focus:outline-none"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>

        {/* Main Content */}
        <div
          className={`transition-all duration-300 ${
            sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'
          }`}
        >
          {/* Top Bar / Header */}
          <header className="sticky top-0 z-30 bg-white border-b border-gray-100 h-16 flex items-center justify-between px-4 lg:px-6 pl-14 lg:pl-6 shadow-sm shadow-gray-100/40">
            
            {/* Left Area: Dynamic Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
              {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.href} className="flex items-center min-w-0">
                  {idx > 0 && <span className="mx-2 text-gray-300 select-none">/</span>}
                  {crumb.isLast ? (
                    <span className="font-semibold text-gray-900 truncate">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link 
                      href={crumb.href} 
                      className="hover:text-primary transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Right Area: Actions & Avatar */}
            <div className="flex items-center gap-3 lg:gap-5">
              {/* Quick Search Bar */}
              <div className="relative hidden md:block w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm nhanh hệ thống..."
                  className="w-full text-xs pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:bg-white transition-all text-gray-700"
                />
              </div>

              {/* View Client Website */}
              <a
                href={CLIENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/20 rounded-lg bg-primary-light/30 hover:bg-primary-light/60 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Xem website
              </a>

              {/* Notification Bell Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors block relative focus:outline-none select-none">
                  <Bell className="h-5 w-5" />
                  {pendingCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cta text-[10px] font-bold text-white leading-none">
                      {pendingCount}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 mt-1 p-1">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-900 border-b border-gray-100 flex items-center justify-between">
                    <span>Công việc chờ duyệt</span>
                    {pendingCount > 0 && (
                      <span className="bg-red-50 text-cta text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {pendingCount} tin chờ duyệt
                      </span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {pendingCount > 0 ? (
                      <>
                        <Link href="/admin/properties?status=pending" className="block w-full">
                          <DropdownMenuItem className="p-2.5 text-xs flex flex-col items-start gap-1 cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-2 w-full justify-between">
                              <span className="font-semibold text-gray-800">Tin đăng chờ duyệt</span>
                              <span className="bg-primary-light text-primary text-[10px] px-1.5 py-0.5 rounded font-bold">
                                {pendingCount} tin
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 font-normal">
                              Có tin đăng mới đang chờ quản trị viên phê duyệt để hiển thị.
                            </p>
                          </DropdownMenuItem>
                        </Link>
                        
                        <Link href="/admin/verifications?status=pending" className="block w-full">
                          <DropdownMenuItem className="p-2.5 text-xs flex flex-col items-start gap-1 cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-2 w-full justify-between">
                              <span className="font-semibold text-gray-800">Xác thực môi giới</span>
                              <span className="bg-yellow-50 text-yellow-600 text-[10px] px-1.5 py-0.5 rounded font-bold border border-yellow-100">
                                Yêu cầu mới
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 font-normal">
                              Kiểm tra hồ sơ đăng ký xác thực của các môi giới trên hệ thống.
                            </p>
                          </DropdownMenuItem>
                        </Link>

                        <Link href="/admin/reports" className="block w-full">
                          <DropdownMenuItem className="p-2.5 text-xs flex flex-col items-start gap-1 cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-2 w-full justify-between">
                              <span className="font-semibold text-gray-800">Báo cáo vi phạm</span>
                              <span className="bg-red-50 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-bold border border-red-100">
                                Cảnh báo
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 font-normal">
                              Người dùng báo cáo tin đăng vi phạm quy chế hoặc thông tin sai lệch.
                            </p>
                          </DropdownMenuItem>
                        </Link>
                      </>
                    ) : (
                      <div className="py-6 px-4 text-center text-xs text-gray-400 font-medium">
                        Không có thông báo mới nào cần xử lý.
                      </div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/admin/properties" className="block w-full">
                    <div className="p-2 text-center text-xs font-semibold text-primary hover:bg-primary-light/30 transition-colors cursor-pointer select-none">
                      Xem tất cả tin đăng
                    </div>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  data-testid="profile-dropdown-trigger"
                  className="flex items-center gap-2 focus:outline-none hover:opacity-90 select-none text-left p-1 rounded-lg"
                >
                  <div className="h-8 w-8 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold text-sm border border-primary/10 shadow-inner">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="hidden lg:block min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate leading-none mb-0.5">
                      {user?.name || 'Administrator'}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none">
                      {user?.role === 'super_admin' ? 'Super Admin' : 'Quản trị viên'}
                    </p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden lg:block" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-1 p-1">
                  <div className="px-2.5 py-2 text-xs font-normal text-gray-500 select-none">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => router.push('/admin/profile')}
                    className="p-2 text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    Trang cá nhân
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => router.push('/admin/settings')}
                    className="p-2 text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    Cấu hình hệ thống
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    data-testid="logout-menu-item"
                    onClick={handleLogout}
                    className="p-2 text-xs flex items-center gap-2 text-cta hover:bg-red-50 hover:text-cta focus:bg-red-50 focus:text-cta cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất tài khoản
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutContent>{children}</AdminLayoutContent>
  );
}
