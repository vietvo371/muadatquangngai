'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Bell, Menu, Plus, Home, Building2, MessageSquare, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const mobileNavItems = [
  { href: '/dashboard', icon: Home, label: 'Tổng quan' },
  { href: '/dashboard/dang-tin', icon: Plus, label: 'Đăng tin', isCta: true },
  { href: '/dashboard/quan-ly-tin', icon: Building2, label: 'Quản lý' },
  { href: '/dashboard/tin-nhan', icon: MessageSquare, label: 'Tin nhắn' },
  { href: '/dashboard/profile', icon: User, label: 'Hồ sơ' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
        }`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center px-4 lg:px-8 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-[16px] font-bold text-gray-900 hidden sm:block">
              Quản lý tài khoản
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Link href="/dashboard/thong-bao">
              <button className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cta border-2 border-white"></span>
              </button>
            </Link>

            <div className="w-px h-6 bg-gray-200 mx-1"></div>

            <Link href="/dashboard/dang-tin">
              <Button className="bg-cta hover:bg-cta-dark text-white font-medium text-[14px] h-9 px-4 gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Đăng tin mới</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

            if (item.isCta) {
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5">
                  <div className="w-12 h-12 rounded-full bg-[#e03131] flex items-center justify-center shadow-md shadow-red-500/30 -mt-5">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#e03131] mt-0.5">{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors"
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive ? 'text-[#1075b1]' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`text-[10px] font-semibold transition-colors ${
                    isActive ? 'text-[#1075b1]' : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
