'use client';

import { Building2, Users, AlertTriangle, BarChart3 } from 'lucide-react';
import { StatsGrid } from '@/components/admin';
import { StatusBadge } from '@/components/ui/status-badge';

export default function AdminDashboardPage() {
  const stats = [
    { label: 'Tin đăng', value: '1,234', change: '+12%', icon: Building2 },
    { label: 'Người dùng', value: '5,678', change: '+8%', icon: Users },
    { label: 'Tin chờ duyệt', value: '89', change: '-5%', icon: AlertTriangle },
    { label: 'Báo cáo', value: '12', change: '-20%', icon: BarChart3 },
  ];

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
            {[
              { title: 'Căn hộ cao cấp 2PN view biển', status: 'pending', time: '5 phút trước' },
              { title: 'Nhà mặt phố 4 tầng Quang Trung', status: 'active', time: '10 phút trước' },
              { title: 'Đất nền dự án ven biển 500m2', status: 'active', time: '30 phút trước' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.time}</p>
                </div>
                <StatusBadge status={item.status === 'active' ? 'approved' : 'pending'} />
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
