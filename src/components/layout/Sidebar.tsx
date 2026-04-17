'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Plus, 
  List, 
  Heart, 
  Bell, 
  MessageSquare, 
  CreditCard, 
  User, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  LogOut,
  Shield,
  BarChart3,
  FileText,
  Users,
  AlertTriangle,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/dang-tin', label: 'Đăng tin mới', icon: Plus },
  { href: '/dashboard/quan-ly-tin', label: 'Quản lý tin', icon: List },
  { href: '/dashboard/tin-da-luu', label: 'Tin đã lưu', icon: Heart },
  { href: '/dashboard/thong-bao', label: 'Thông báo', icon: Bell },
  { href: '/dashboard/tin-nhan', label: 'Tin nhắn', icon: MessageSquare },
  { href: '/dashboard/nap-tien', label: 'Nạp tiền', icon: CreditCard },
  { href: '/dashboard/profile', label: 'Hồ sơ', icon: User },
  { href: '/dashboard/settings', label: 'Cài đặt', icon: Settings },
];

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3, exact: true },
  { href: '/admin/properties', label: 'Quản lý tin', icon: Building2 },
  { href: '/admin/users', label: 'Quản lý users', icon: Users },
  { href: '/admin/categories', label: 'Danh mục', icon: Package },
  { href: '/admin/reports', label: 'Báo cáo', icon: AlertTriangle },
  { href: '/admin/verifications', label: 'Xác thực', icon: Shield },
];

interface SidebarProps {
  variant?: 'dashboard' | 'admin';
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ variant = 'dashboard', collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  const navItems = variant === 'admin' ? adminNavItems : mainNavItems;

  const toggleCollapse = () => {
    onCollapsedChange?.(!collapsed);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={cn(
          'flex items-center h-16 border-b px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <span className="text-white font-bold">B</span>
            </div>
            {!collapsed && (
              <span className="font-bold text-lg text-gray-900">BatDongSan</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : (pathname ? pathname.startsWith(item.href) : false);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* Admin Link */}
          {variant === 'dashboard' && isAdmin && (
            <>
              <div className={cn('my-4', collapsed && 'mx-2')}>
                <hr className="border-gray-200" />
              </div>
              <Link
                href="/admin"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-purple-600 hover:bg-purple-50',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? 'Quản trị' : undefined}
              >
                <Shield className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>Quản trị</span>}
              </Link>
            </>
          )}
        </nav>

        {/* Collapse Button */}
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className={cn('w-full', collapsed ? 'px-2' : 'justify-start gap-2')}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Thu gọn</span>
              </>
            )}
          </Button>
        </div>

        {/* User Info & Logout */}
        <div className={cn('p-4 border-t', collapsed && 'px-2')}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-500">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="p-2">
                <LogOut className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-500">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="p-2">
                <LogOut className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
