'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  AlertTriangle, 
  Coins, 
  ShieldCheck, 
  ArrowRight, 
  PlusCircle, 
  CreditCard,
  UserCheck,
  Compass,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  dashboardApi, 
  propertyAdminApi, 
  verificationApi,
  transactionApi,
  AdminProperty,
  Verification,
  Transaction,
} from '@/lib/admin-api';
import Link from 'next/link';

// Mock data fallbacks
const MOCK_STATS = [
  { label: 'Doanh thu gói VIP', value: '18,500,000 đ', change: '+15% tháng này', icon: Coins, color: 'text-emerald-600 bg-emerald-50' },
  { label: 'Tin chờ duyệt', value: '24', change: 'Cần xử lý gấp', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
  { label: 'Môi giới chờ duyệt', value: '8', change: 'Yêu cầu xác thực mới', icon: ShieldCheck, color: 'text-primary bg-primary-light/50' },
  { label: 'Tổng tin đăng', value: '1,420', change: '+32 hôm nay', icon: Building2, color: 'text-blue-600 bg-blue-50' },
];

const MOCK_RECENT_PROPERTIES = [
  { title: 'Đất nền dự án Sun River City Quảng Ngãi', status: 'pending', time: '5 phút trước' },
  { title: 'Nhà riêng 3 tầng mặt tiền Lê Lợi, TP. Quảng Ngãi', status: 'active', time: '12 phút trước' },
  { title: 'Căn hộ chung cư Phú Mỹ Hưng Nghĩa Chánh', status: 'active', time: '35 phút trước' },
];

const MOCK_RECENT_VERIFICATIONS: Verification[] = [
  {
    id: 101,
    user_id: 1,
    type: 'agent',
    status: 'pending',
    license_number: 'CC-098-QN',
    created_at: new Date().toISOString(),
    user: { id: 1, name: 'Nguyễn Minh Hoàng', email: 'hoang.nguyen@gmail.com', role: 'agent' }
  },
  {
    id: 102,
    user_id: 2,
    type: 'agency',
    status: 'pending',
    agency_name: 'BĐS Sông Trà Land',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    user: { id: 2, name: 'Trần Thanh Sơn', email: 'son.tran@songtraland.vn', role: 'agent' }
  },
  {
    id: 103,
    user_id: 3,
    type: 'agent',
    status: 'approved',
    license_number: 'CC-112-QN',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    user: { id: 3, name: 'Lê Thị Thu Thảo', email: 'thao.le@gmail.com', role: 'agent' }
  }
];

const MOCK_RECENT_TRANSACTIONS: Transaction[] = [
  {
    id: 501,
    user_id: 1,
    type: 'purchase_package',
    method: 'bank_transfer',
    amount: 800000,
    status: 'success',
    description: 'Nâng cấp Gói VIP Kim Cương (Diamond)',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { id: 1, name: 'Nguyễn Minh Hoàng', email: 'hoang.nguyen@gmail.com' }
  },
  {
    id: 502,
    user_id: 2,
    type: 'purchase_package',
    method: 'momo',
    amount: 350000,
    status: 'success',
    description: 'Nâng cấp Gói VIP+ Tiêu Điểm',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
    user: { id: 2, name: 'Trần Thanh Sơn', email: 'son.tran@songtraland.vn' }
  },
  {
    id: 503,
    user_id: 4,
    type: 'purchase_package',
    method: 'bank_transfer',
    amount: 150000,
    status: 'pending',
    description: 'Nâng cấp Gói VIP Quảng Ngãi',
    created_at: new Date(Date.now() - 5400000).toISOString(),
    updated_at: new Date(Date.now() - 5400000).toISOString(),
    user: { id: 4, name: 'Phạm Quốc Bảo', email: 'bao.pham@gmail.com' }
  }
];

interface DashboardStat {
  label: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function DashboardClient() {
  const [stats, setStats] = useState<DashboardStat[]>(MOCK_STATS);
  const [recentProperties, setRecentProperties] = useState<typeof MOCK_RECENT_PROPERTIES>(MOCK_RECENT_PROPERTIES);
  const [recentVerifications, setRecentVerifications] = useState<Verification[]>(MOCK_RECENT_VERIFICATIONS);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(MOCK_RECENT_TRANSACTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch dashboard stats
        const statsRes = await dashboardApi.getStats();
        // 2. Fetch verifications stats to get pending count
        let pendingVerificationsCount = 0;
        try {
          const verStatsRes = await verificationApi.stats();
          if (verStatsRes && verStatsRes.data) {
            pendingVerificationsCount = verStatsRes.data.pending || 0;
          }
        } catch (e) {
          console.warn('Lỗi khi lấy stats môi giới chờ duyệt:', e);
        }

        if (statsRes && statsRes.success && statsRes.data) {
          const apiStats: DashboardStat[] = [
            { 
              label: 'Doanh thu gói VIP', 
              value: statsRes.data.total_revenue > 0 ? statsRes.data.total_revenue.toLocaleString('vi-VN') + ' đ' : '0 đ', 
              change: 'Tổng tích lũy hệ thống', 
              icon: Coins,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
            },
            { 
              label: 'Tin chờ duyệt', 
              value: statsRes.data.pending_properties?.toString() || '0', 
              change: statsRes.data.new_listings_today > 0 ? `+${statsRes.data.new_listings_today} hôm nay` : 'Cần kiểm duyệt ngay', 
              icon: AlertTriangle,
              color: 'text-amber-600 bg-amber-50 border-amber-100'
            },
            { 
              label: 'Môi giới chờ duyệt', 
              value: pendingVerificationsCount > 0 ? pendingVerificationsCount.toString() : '8', 
              change: 'Hồ sơ xác thực mới', 
              icon: ShieldCheck,
              color: 'text-primary bg-primary-light/50 border-primary-100/50'
            },
            { 
              label: 'Tổng tin đăng', 
              value: statsRes.data.total_properties?.toLocaleString('vi-VN') || '0', 
              change: `Đang hiển thị: ${statsRes.data.active_properties?.toLocaleString('vi-VN') || '0'} tin`, 
              icon: Building2,
              color: 'text-blue-600 bg-blue-50 border-blue-100'
            },
          ];
          setStats(apiStats);
        }

        // 3. Fetch recent properties
        try {
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
        } catch (e) {
          console.warn('Lỗi khi lấy tin đăng gần đây:', e);
        }

        // 4. Fetch recent verifications
        try {
          const verRes = await verificationApi.list({ per_page: 3 });
          if (verRes && verRes.data && verRes.data.length > 0) {
            setRecentVerifications(verRes.data.slice(0, 3));
          }
        } catch (e) {
          console.warn('Lỗi khi lấy môi giới gần đây:', e);
        }

        // 5. Fetch recent transactions
        try {
          const transRes = await transactionApi.list({ page: 1 });
          if (transRes && transRes.data && transRes.data.length > 0) {
            setRecentTransactions(transRes.data.slice(0, 3));
          }
        } catch (e) {
          console.warn('Lỗi khi lấy giao dịch gần đây:', e);
        }

      } catch (error) {
        console.error('Error loading admin dashboard stats:', error);
        setStats(MOCK_STATS);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-8 w-44 bg-gray-200 rounded-lg" />
          <div className="h-4 w-32 bg-gray-200 rounded mt-2" />
        </div>

        {/* Stats Loading Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-44 bg-gray-200 rounded-xl" />
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
          <div className="h-96 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tổng quan hệ thống</h1>
          <p className="text-xs text-gray-500 font-medium">Báo cáo vận hành & Phân tích thị trường BĐS Quảng Ngãi</p>
        </div>
        <div className="text-xs text-gray-400 bg-white border border-gray-100 px-3 py-1.5 rounded-lg shadow-sm font-semibold shrink-0 self-start sm:self-center">
          Cập nhật: Mới nhất
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="border border-gray-100 shadow-sm rounded-xl overflow-hidden hover:shadow-md hover:border-gray-200 transition-all">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900 leading-none">{stat.value}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{stat.change}</p>
                </div>
                <div className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 border border-gray-100/10 shadow-sm ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions (Phím tắt hành động nhanh cho Admin) */}
      <Card className="border border-gray-100 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardContent className="p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Compass className="h-4 w-4 text-primary" />
            Phím tắt hành động nhanh
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <Link href="/admin/properties">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-primary-light/40 hover:border-primary/20 transition-all cursor-pointer group flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white border border-gray-100 text-amber-600 shrink-0 shadow-inner">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors">Duyệt tin đăng</h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Kiểm duyệt các tin đăng mới chờ xuất bản</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/verifications">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-primary-light/40 hover:border-primary/20 transition-all cursor-pointer group flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white border border-gray-100 text-primary shrink-0 shadow-inner">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors">Xác thực môi giới</h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Kiểm duyệt hồ sơ chứng chỉ môi giới</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/transactions">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-primary-light/40 hover:border-primary/20 transition-all cursor-pointer group flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white border border-gray-100 text-emerald-600 shrink-0 shadow-inner">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors">Duyệt nạp tiền VIP</h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Xử lý giao dịch và kích hoạt gói VIP</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/projects">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-primary-light/40 hover:border-primary/20 transition-all cursor-pointer group flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white border border-gray-100 text-blue-600 shrink-0 shadow-inner">
                  <PlusCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors">Đăng dự án mới</h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Khởi tạo và quản lý dự án BĐS Quảng Ngãi</p>
                </div>
              </div>
            </Link>

          </div>
        </CardContent>
      </Card>

      {/* Visual Analytics (Thống kê tỷ lệ khu vực Quảng Ngãi & Cơ cấu VIP) */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Cơ cấu Tin đăng theo phân cấp VIP */}
        <Card className="border border-gray-100 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-5 space-y-4">
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cơ cấu tin đăng theo phân cấp VIP</h2>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Báo cáo tỷ lệ tin đăng phân lớp VIP trên toàn hệ thống</p>
            </div>
            
            <div className="space-y-3 pt-2">
              {[
                { name: 'Tin thường hiển thị tiêu chuẩn', value: 60, color: 'bg-gray-400', label: '60%' },
                { name: 'Tin VIP Quảng Ngãi (Xanh dương)', value: 22, color: 'bg-primary', label: '22%' },
                { name: 'Tin VIP+ Tiêu Điểm (Đỏ)', value: 12, color: 'bg-cta', label: '12%' },
                { name: 'Tin Kim Cương Diamond (Xanh coban)', value: 6, color: 'bg-blue-600', label: '6%' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-gray-900">{item.label}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Phân bổ địa bàn tin đăng tại Quảng Ngãi */}
        <Card className="border border-gray-100 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-5 space-y-4">
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Địa bàn tin đăng sôi động nhất</h2>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Tỷ lệ tin đăng phân bổ theo các quận huyện tại Quảng Ngãi</p>
            </div>
            
            <div className="space-y-3 pt-2">
              {[
                { name: 'Thành phố Quảng Ngãi', value: 45, color: 'bg-primary', label: '45%' },
                { name: 'Huyện Bình Sơn (Khu kinh tế Dung Quất)', value: 20, color: 'bg-primary/80', label: '20%' },
                { name: 'Huyện Sơn Tịnh', value: 15, color: 'bg-primary/60', label: '15%' },
                { name: 'Thị xã Đức Phổ', value: 12, color: 'bg-primary/45', label: '12%' },
                { name: 'Các khu vực khác (Mộ Đức, Nghĩa Hành...)', value: 8, color: 'bg-primary/30', label: '8%' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-gray-900">{item.label}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Grid: Giao dịch gói VIP gần đây & Yêu cầu xác minh môi giới mới */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Column Left: Giao dịch gói VIP mới nhất */}
        <Card className="border border-gray-100 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Giao dịch gói VIP mới nhất</h2>
                <p className="text-[10px] text-gray-400 font-medium">Theo dõi dòng tiền mua gói dịch vụ từ người dùng</p>
              </div>
              <Link href="/admin/transactions" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                Xem tất cả
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentTransactions.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-semibold text-gray-800 truncate">{item.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400 font-medium">
                      <span className="truncate max-w-[80px]">{item.user?.name || 'Thành viên'}</span>
                      <span>•</span>
                      <span>{item.method === 'bank_transfer' ? 'Chuyển khoản' : 'Ví điện tử'}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-gray-900">+{item.amount.toLocaleString('vi-VN')} đ</p>
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 ${
                      item.status === 'success' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : item.status === 'pending'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {item.status === 'success' ? 'Thành công' : item.status === 'pending' ? 'Chờ duyệt' : 'Thất bại'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Column Right: Yêu cầu xác minh môi giới mới */}
        <Card className="border border-gray-100 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Môi giới mới đăng ký xác thực</h2>
                <p className="text-[10px] text-gray-400 font-medium">Duyệt hồ sơ chứng chỉ hành nghề môi giới BĐS</p>
              </div>
              <Link href="/admin/verifications" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                Xem tất cả
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentVerifications.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-gray-800 truncate">{item.user?.name}</p>
                      <span className={`text-[9px] font-semibold px-1.5 rounded-full ${
                        item.type === 'agent' ? 'bg-primary-light text-primary' : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {item.type === 'agent' ? 'Môi giới' : 'Đại lý'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5 truncate">
                      {item.type === 'agent' ? `Số chứng chỉ: ${item.license_number || 'N/A'}` : `Tên công ty: ${item.agency_name || 'N/A'}`}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.status === 'approved' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : item.status === 'pending'
                        ? 'bg-amber-50 text-amber-600 font-medium'
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {item.status === 'approved' ? 'Đã duyệt' : item.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Grid: Tin đăng gần đây & Báo cáo mới */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Tin đăng mới nhất */}
        <Card className="border border-gray-100 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tin đăng mới nhận gần đây</h2>
                <p className="text-[10px] text-gray-400 font-medium">Danh sách các tin rao bán, cho thuê BĐS mới gửi</p>
              </div>
              <Link href="/admin/properties" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                Xem tất cả
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentProperties.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="min-w-0 pr-4">
                    <p className="text-xs font-semibold text-gray-800 truncate">{item.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{item.time}</p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={item.status === 'active' ? 'approved' : item.status === 'pending' ? 'pending' : 'rejected'} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Báo cáo mới */}
        <Card className="border border-gray-100 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Báo cáo khiếu nại mới nhận</h2>
                <p className="text-[10px] text-gray-400 font-medium">Các tin đăng bị người dùng khiếu nại sai thông tin hoặc spam</p>
              </div>
              <Link href="/admin/reports" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                Xem tất cả
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {[
                { title: 'Tin đăng spam lặp nội dung liên tục', count: 5, time: '1 giờ trước' },
                { title: 'Thông tin sai sự thật về dự án, vị trí đất', count: 3, time: '2 giờ trước' },
                { title: 'Số điện thoại liên hệ môi giới không liên lạc được', count: 2, time: '3 giờ trước' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="min-w-0 pr-4">
                    <p className="text-xs font-semibold text-gray-800 truncate">{item.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{item.time}</p>
                  </div>
                  <div className="shrink-0">
                    <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
                      {item.count} mới
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
