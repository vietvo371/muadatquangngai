'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Eye, 
  Heart, 
  MessageSquare, 
  CreditCard, 
  TrendingUp,
  ArrowRight,
  Plus,
  Clock
} from 'lucide-react';

// Mock data for dashboard
const stats = [
  { label: 'Tin đăng', value: 5, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Lượt xem', value: 1234, icon: Eye, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Tin đã lưu', value: 12, icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
  { label: 'Tin nhắn', value: 3, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const recentProperties = [
  { 
    id: '1', 
    title: 'Căn hộ cao cấp 2PN view biển', 
    price: 2800000000, 
    status: 'active',
    views: 456,
    createdAt: '2024-01-15'
  },
  { 
    id: '2', 
    title: 'Nhà mặt phố 4 tầng Quang Trung', 
    price: 6500000000, 
    status: 'pending',
    views: 123,
    createdAt: '2024-01-14'
  },
  { 
    id: '3', 
    title: 'Đất nền dự án ven biển 500m2', 
    price: 1800000000, 
    status: 'active',
    views: 789,
    createdAt: '2024-01-13'
  },
];

const statusConfig = {
  active: { label: 'Đang hiển thị', color: 'bg-green-100 text-green-700' },
  pending: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700' },
  inactive: { label: 'Tạm ẩn', color: 'bg-gray-100 text-gray-600' },
  expired: { label: 'Hết hạn', color: 'bg-red-100 text-red-700' },
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Xin chào, {user?.name || 'User'}!
          </h1>
          <p className="text-gray-500 mt-1">
            Chào mừng bạn quay trở lại trang quản lý
          </p>
        </div>
        <Link href="/dashboard/dang-tin">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Đăng tin mới
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.value.toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Properties */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Tin đăng gần đây</CardTitle>
              <Link href="/dashboard/quan-ly-tin">
                <Button variant="ghost" size="sm" className="gap-1">
                  Xem tất cả
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProperties.map((property) => {
                  const status = statusConfig[property.status as keyof typeof statusConfig];
                  return (
                    <div 
                      key={property.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/mua-ban/${property.slug || property.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 truncate"
                          >
                            {property.title}
                          </Link>
                          <Badge className={status.color}>{status.label}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{(property.price / 1000000).toFixed(0)} triệu</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {property.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {property.createdAt}
                          </span>
                        </div>
                      </div>
                      <Link href={`/dashboard/quan-ly-tin/${property.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Sửa
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Balance */}
        <div className="space-y-6">
          {/* Balance Card */}
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-blue-100">Số dư tài khoản</span>
                <CreditCard className="h-5 w-5 text-blue-200" />
              </div>
              <p className="text-3xl font-bold mb-1">
                {user?.balance?.toLocaleString('vi-VN') || '0'} đ
              </p>
              <Link href="/dashboard/nap-tien">
                <Button size="sm" className="mt-4 bg-white text-blue-700 hover:bg-blue-50">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Nạp tiền
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/dang-tin" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Đăng tin mới
                </Button>
              </Link>
              <Link href="/dashboard/tin-da-luu" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Heart className="h-4 w-4 mr-2" />
                  Tin đã lưu
                </Button>
              </Link>
              <Link href="/dashboard/tin-nhan" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Tin nhắn
                </Button>
              </Link>
              <Link href="/dashboard/profile" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Nâng cấp VIP
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upgrade to VIP CTA */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-orange-100 flex items-center justify-center mb-3">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Nâng cấp VIP</h3>
              <p className="text-sm text-gray-600 mb-4">
                Giúp tin đăng của bạn nổi bật hơn và tiếp cận nhiều khách hàng hơn
              </p>
              <Link href="/dashboard/profile?tab=vip">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Xem các gói VIP
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
