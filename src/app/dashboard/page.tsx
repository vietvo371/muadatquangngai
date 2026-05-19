'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { StatBox } from '@/components/dashboard/StatBox';
import { 
  Building2, 
  Eye, 
  Heart, 
  MessageSquare, 
  CreditCard, 
  TrendingUp,
  ArrowRight,
  Plus,
  Clock,
  Star
} from 'lucide-react';
import { formatPrice } from '@/lib/formatters';

const stats = [
  { label: 'Tin đang đăng', value: 5, icon: <Building2 className="w-6 h-6 text-[#1075b1]" />, colorClassName: 'bg-[#e8f4fb]', trend: { value: 12, isUp: true } },
  { label: 'Lượt xem tin', value: '1.2K', icon: <Eye className="w-6 h-6 text-[#1075b1]" />, colorClassName: 'bg-[#e8f4fb]', trend: { value: 8, isUp: true } },
  { label: 'Lượt lưu tin', value: 45, icon: <Heart className="w-6 h-6 text-[#1075b1]" />, colorClassName: 'bg-[#e8f4fb]', trend: { value: 2, isUp: false } },
  { label: 'Yêu cầu tư vấn', value: 12, icon: <MessageSquare className="w-6 h-6 text-[#1075b1]" />, colorClassName: 'bg-[#e8f4fb]' },
];

const recentProperties = [
  {
    id: '1',
    slug: 'can-ho-cao-cap-2pn-view-bien',
    title: 'Căn hộ cao cấp 2PN view biển Mỹ Khê',
    price: 2800000000,
    status: 'active',
    views: 456,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    slug: 'nha-mat-pho-4-tang-quang-trung',
    title: 'Nhà mặt phố 4 tầng Quang Trung, kinh doanh sầm uất',
    price: 6500000000,
    status: 'pending',
    views: 123,
    createdAt: '2024-01-14'
  },
  {
    id: '3',
    slug: 'dat-nen-du-an-ven-bien-500m2',
    title: 'Đất nền dự án ven biển 500m2 có sổ đỏ',
    price: 1800000000,
    status: 'active',
    views: 789,
    createdAt: '2024-01-13'
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Welcome Banner */}
      <WelcomeBanner user={user} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <StatBox 
            key={i}
            title={stat.label} 
            value={stat.value} 
            icon={stat.icon} 
            colorClassName={stat.colorClassName}
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Recent Properties (Takes up 2 cols on lg) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Tin đăng gần đây</h2>
            <Link href="/dashboard/quan-ly-tin">
              <Button variant="ghost" className="text-primary hover:bg-primary-light hover:text-primary font-semibold text-sm gap-1 h-9 px-3">
                Xem tất cả
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            <div className="divide-y divide-gray-100">
              {recentProperties.map((property) => (
                <div key={property.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Link href={`/mua-ban/${property.slug}`} className="font-bold text-gray-900 hover:text-primary truncate max-w-[80%]">
                        {property.title}
                      </Link>
                      <StatusBadge status={property.status as any} />
                    </div>
                    <div className="flex items-center gap-4 text-[13px] text-gray-500 font-medium">
                      <span className="text-[#e03131] font-bold">{formatPrice(property.price, 'total')}</span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        {property.views} lượt xem
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {property.createdAt}
                      </span>
                    </div>
                  </div>
                  <Link href={`/dashboard/quan-ly-tin/${property.id}/edit`}>
                    <Button variant="outline" className="w-full sm:w-auto h-9 font-semibold text-gray-700 bg-white">
                      Chỉnh sửa
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          
          {/* Balance Card */}
          <Card className="bg-gray-900 border-0 rounded-2xl overflow-hidden shadow-lg shadow-gray-900/20 relative">
            {/* Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 font-medium text-sm uppercase tracking-wider">Số dư ví</span>
                <CreditCard className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-3xl font-extrabold text-white mb-6 tracking-tight">
                {user?.balance?.toLocaleString('vi-VN') || '0'} đ
              </p>
              <Link href="/dashboard/nap-tien">
                <Button className="w-full bg-primary hover:bg-[#0c5d8f] text-white font-bold h-11 border-0 transition-colors">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Nạp tiền vào ví
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="rounded-2xl shadow-sm border-gray-100">
            <CardHeader className="pb-3 px-6 pt-6">
              <CardTitle className="text-lg font-bold">Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-2">
              <Link href="/dashboard/dang-tin" className="block">
                <Button variant="outline" className="w-full justify-start h-11 font-medium text-gray-700 bg-white hover:bg-gray-50 border-gray-200">
                  <Plus className="h-4 w-4 mr-3 text-primary" />
                  Đăng tin mới
                </Button>
              </Link>
              <Link href="/dashboard/tin-da-luu" className="block">
                <Button variant="outline" className="w-full justify-start h-11 font-medium text-gray-700 bg-white hover:bg-gray-50 border-gray-200">
                  <Heart className="h-4 w-4 mr-3 text-[#e03131]" />
                  Tin đã lưu
                </Button>
              </Link>
              <Link href="/dashboard/tin-nhan" className="block">
                <Button variant="outline" className="w-full justify-start h-11 font-medium text-gray-700 bg-white hover:bg-gray-50 border-gray-200">
                  <MessageSquare className="h-4 w-4 mr-3 text-[#1075b1]" />
                  Tin nhắn
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* VIP Upgrade */}
          <Card className="rounded-2xl border border-[#1075b1]/20 bg-[#e8f4fb] shadow-sm relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-[#1075b1]/10 rounded-full blur-xl -mb-10 -mr-10"></div>
            <CardContent className="p-6 text-center relative z-10">
              <div className="w-12 h-12 mx-auto rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                <Star className="h-6 w-6 text-[#1075b1] fill-[#1075b1]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Trở thành VIP Member</h3>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                Nổi bật tin đăng của bạn và tiếp cận hàng ngàn khách hàng tiềm năng mỗi ngày.
              </p>
              <Link href="/dashboard/profile?tab=vip">
                <Button className="w-full bg-[#1075b1] hover:bg-[#0c5d8f] text-white font-bold h-11">
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
