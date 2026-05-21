'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/stores/authStore';
import axios from '@/lib/axios';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  // Sync initial state to avoid loading flash for already-authenticated admin users
  const [authorized, setAuthorized] = useState(
    isAuthenticated && user && (user.role === 'admin' || user.role === 'super_admin')
  );

  useEffect(() => {
    let cancelled = false;

    const verifyAuth = async () => {
      // Quick local check: if no auth data in store, redirect immediately
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

      // Server-side verification: confirm token is still valid
      try {
        const response = await axios.get('/api/user/me');
        const fetchedUser = response.data.data;
        const fetchedIsAdmin = fetchedUser.role === 'admin' || fetchedUser.role === 'super_admin';

        if (!fetchedIsAdmin) {
          router.replace('/dashboard');
          return;
        }

        if (!cancelled) setAuthorized(true);
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
  }, [isAuthenticated, user, logout]);

  // Show loading spinner while verifying
  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <p className="text-sm text-gray-500">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
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
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Xem website →
            </a>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
