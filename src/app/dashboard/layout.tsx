'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md border hover:bg-gray-50 lg:hidden"
      >
        <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b h-16 flex items-center px-4 lg:px-6 pl-14 lg:pl-6">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">
              {/* Dynamic title will be set by page */}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/dashboard/dang-tin"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-cta hover:bg-cta-dark text-white rounded-lg text-sm font-medium transition-colors"
            >
              + Đăng tin
            </a>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
