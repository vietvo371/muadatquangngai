'use client';

import { useState, useEffect } from 'react';
import { Building2, Users, AlertTriangle, BarChart3 } from 'lucide-react';
import { StatsGrid } from '@/components/admin';
import { StatusBadge } from '@/components/ui/status-badge';
import { dashboardApi, propertyAdminApi, AdminProperty } from '@/lib/admin-api';

// Mock data fallbacks
const MOCK_STATS = [
  { label: 'Tin đăng', value: '1,234', change: '+12%', icon: Building2 },
  { label: 'Người dùng', value: '5,678', change: '+8%', icon: Users },
  { label: 'Tin chờ duyệt', value: '89', change: '-5%', icon: AlertTriangle },
  { label: 'Báo cáo', value: '12', change: '-20%', icon: BarChart3 },
];

const MOCK_RECENT_PROPERTIES = [
  { title: 'Căn hộ cao cấp 2PN view biển', status: 'pending', time: '5 phút trước' },
  { title: 'Nhà mặt phố 4 tầng Quang Trung', status: 'active', time: '10 phút trước' },
  { title: 'Đất nền dự án ven biển 500m2', status: 'active', time: '30 phút trước' },
];

interface DashboardStat {
  label: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface RecentProperty {
  title: string;
  status: string;
  time: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStat[]>(MOCK_STATS);
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>(MOCK_RECENT_PROPERTIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch stats
        const statsRes = await dashboardApi.getStats();
        if (statsRes && statsRes.success && statsRes.data) {
          const apiStats = [
            { 
              label: 'Tin đăng', 
              value: statsRes.data.total_properties?.toLocaleString('vi-VN') || '0', 
              change: statsRes.data.new_listings_today > 0 ? `+${statsRes.data.new_listings_today} hôm nay` : '0 hôm nay', 
              icon: Building2 
            },
            { 
              label: 'Người dùng', 
              value: statsRes.data.total_users?.toLocaleString('vi-VN') || '0', 
              change: statsRes.data.new_users_today > 0 ? `+${statsRes.data.new_users_today} hôm nay` : '0 hôm nay', 
              icon: Users 
            },
            { 
              label: 'Tin chờ duyệt', 
              value: statsRes.data.pending_properties?.toLocaleString('vi-VN') || '0', 
              change: '', 
              icon: AlertTriangle 
            },
            { 
              label: 'Báo cáo', 
              value: statsRes.data.pending_reports?.toLocaleString('vi-VN') || '0', 
              change: '', 
              icon: BarChart3 
            },
          ];
          setStats(apiStats);
        }

        // Fetch recent properties
        const propertiesRes = await propertyAdminApi.list({ page: 1 });
        if (propertiesRes && propertiesRes.data && propertiesRes.data.length > 0) {
          const mapped = propertiesRes.data.slice(0, 3).map((p: AdminProperty) => {
            let timeStr = 'Vừa xong';
            if (p.created_at) {
              const diffMs = new Date().getTime() - new Date(p.created_at).getTime();
              const diffMins = Math.floor(diffMs / 60000);
              if (diffMins > 60) {
                const diffHours = Math.floor(diffMins / 60);
                timeStr = diffHours > 24 ? `${Math.floor(diffHours / 24)} ngày trước` : `${diffHours} giờ trước`;
              } else if (diffMins > 0) {
                timeStr = `${diffMins} phút trước`;
              }
            }
            return {
              title: p.title,
              status: p.status,
              time: timeStr
            };
          });
          setRecentProperties(mapped);
        }
      } catch (error) {
        console.error('Error loading admin dashboard stats:', error);
        setStats(MOCK_STATS);
        setRecentProperties(MOCK_RECENT_PROPERTIES);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-2" />
        </div>

        {/* Stats Loading Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>

        {/* Tables Loading Skeleton */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-[250px] bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-[250px] bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Tổng quan hệ thống</p>
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={stats} />

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Tin đăng gần đây</h2>
          <div className="space-y-4">
            {recentProperties.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="min-w-0 pr-4">
                  <p className="font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.time}</p>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={item.status === 'active' ? 'approved' : item.status === 'pending' ? 'pending' : 'rejected'} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Báo cáo mới</h2>
          <div className="space-y-4">
            {[
              { title: 'Tin đăng spam', count: 5, time: '1 giờ trước' },
              { title: 'Thông tin sai sự thật', count: 3, time: '2 giờ trước' },
              { title: 'Liên hệ không hợp lệ', count: 2, time: '3 giờ trước' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.time}</p>
                </div>
                <StatusBadge status="rejected" label={`${item.count} mới`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
