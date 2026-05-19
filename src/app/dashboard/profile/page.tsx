'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PillTabs } from '@/components/ui/pill-tabs';
import { PackageCard } from '@/components/dashboard/PackageCard';
import { 
  Camera,
  Save,
  Lock,
  Bell,
  Eye,
  CheckCircle,
  ShieldAlert,
  Star
} from 'lucide-react';

const PACKAGES = [
  { id: 'vip', name: 'Gói VIP', price: 50000, duration: 7, color: 'vip' as const, features: ['Hiển thị trên tin thường', 'Có huy hiệu VIP vàng', 'Màu sắc khung thẻ nổi bật'] },
  { id: 'vip_plus', name: 'Gói VIP+', price: 100000, duration: 30, color: 'vip_plus' as const, isPopular: true, features: ['Hiển thị trên VIP và tin thường', 'Có huy hiệu VIP+ cam', 'Ảnh đại diện lớn hơn'] },
  { id: 'diamond', name: 'Gói Diamond', price: 200000, duration: 30, color: 'diamond' as const, features: ['Luôn nằm trên cùng trang chủ', 'Huy hiệu Diamond đỏ độc quyền', 'Hỗ trợ đẩy tin 2 lần/ngày'] },
];

export default function ProfilePage() {
  const { user, isLoading, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  
  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    address: user?.address || '',
    facebook: user?.facebook || '',
    zalo: user?.zalo || '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async () => {
    const result = await updateProfile(profileForm);
    if (result.success) {
      // Show success message
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }
    
    const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    if (result.success) {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 font-medium">Vui lòng đăng nhập để xem thông tin</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hồ sơ cá nhân</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý thông tin và cài đặt tài khoản của bạn</p>
        </div>
        <div className="flex items-center gap-3">
          {user.phone_verified_at ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 gap-1.5 px-3 py-1">
              <CheckCircle className="h-3.5 w-3.5" />
              Đã xác thực
            </Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-0 gap-1.5 px-3 py-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              Chưa xác thực
            </Badge>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar Profile */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-2xl shadow-sm border-gray-100 overflow-hidden">
            {/* Header background */}
            <div className="h-24 bg-gradient-to-r from-primary/80 to-primary w-full"></div>
            
            <CardContent className="pt-0 px-6 pb-6 relative">
              <div className="flex justify-center -mt-12 mb-4">
                <div className="relative inline-block rounded-full p-1 bg-white">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback className="text-2xl font-bold bg-primary-light text-primary">{user.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-gray-900 hover:bg-black text-white border-2 border-white shadow-sm"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500 mb-3">{user.email}</p>
                <Badge className="bg-primary-light text-primary hover:bg-primary-light border-0">
                  {user.role === 'admin' ? 'Quản trị viên' : user.role === 'agent' ? 'Môi giới' : 'Người dùng'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{user.total_listings || 0}</p>
                  <p className="text-[13px] text-gray-500 font-medium">Tin đã đăng</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1">
                    {user.rating || '0.0'}
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  </p>
                  <p className="text-[13px] text-gray-500 font-medium">Đánh giá</p>
                </div>
              </div>

              <div className="mt-6 space-y-1">
                <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium">
                  <Bell className="h-5 w-5 text-gray-400" />
                  Cài đặt thông báo
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium">
                  <Lock className="h-5 w-5 text-gray-400" />
                  Bảo mật tài khoản
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium">
                  <Eye className="h-5 w-5 text-gray-400" />
                  Quyền riêng tư
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Main Content */}
        <div className="lg:col-span-8">
          <Card className="rounded-2xl shadow-sm border-gray-100">
            <div className="px-6 pt-6 pb-2 border-b border-gray-100">
              <PillTabs 
                tabs={[
                  { id: 'info', label: 'Thông tin cá nhân' },
                  { id: 'password', label: 'Đổi mật khẩu' },
                  { id: 'vip', label: 'Nâng cấp VIP' },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>

            <CardContent className="p-6">
              {/* Info Tab */}
              {activeTab === 'info' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-gray-700 font-semibold">Họ và tên</Label>
                      <Input
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                        className="mt-2 bg-gray-50 h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-semibold">Email</Label>
                      <Input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                        className="mt-2 bg-gray-50 h-11"
                        disabled
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-semibold">Số điện thoại</Label>
                      <Input
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        className="mt-2 bg-gray-50 h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-semibold">Địa chỉ</Label>
                      <Input
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                        className="mt-2 bg-gray-50 h-11"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-700 font-semibold">Giới thiệu bản thân</Label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                      rows={4}
                      className="mt-2 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none text-[15px]"
                      placeholder="Chia sẻ vài điều về bạn để khách hàng tin tưởng hơn..."
                    />
                  </div>

                  <Separator className="bg-gray-100" />

                  <h3 className="text-md font-bold text-gray-900">Mạng xã hội</h3>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-gray-700 font-semibold">Facebook</Label>
                      <Input
                        value={profileForm.facebook}
                        onChange={(e) => setProfileForm({...profileForm, facebook: e.target.value})}
                        className="mt-2 bg-gray-50 h-11"
                        placeholder="Link Facebook của bạn"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-semibold">Zalo</Label>
                      <Input
                        value={profileForm.zalo}
                        onChange={(e) => setProfileForm({...profileForm, zalo: e.target.value})}
                        className="mt-2 bg-gray-50 h-11"
                        placeholder="Số điện thoại Zalo"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleProfileUpdate} disabled={isLoading} className="h-11 px-6 bg-gray-900 hover:bg-black font-bold">
                      <Save className="h-4 w-4 mr-2" />
                      Lưu thay đổi
                    </Button>
                  </div>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <div className="space-y-5 max-w-md animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <Label className="text-gray-700 font-semibold">Mật khẩu hiện tại</Label>
                    <Input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="mt-2 bg-gray-50 h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 font-semibold">Mật khẩu mới</Label>
                    <Input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="mt-2 bg-gray-50 h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 font-semibold">Xác nhận mật khẩu mới</Label>
                    <Input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="mt-2 bg-gray-50 h-11"
                    />
                  </div>
                  <div className="pt-2">
                    <Button onClick={handlePasswordChange} disabled={isLoading} className="h-11 px-6 font-bold w-full sm:w-auto">
                      <Lock className="h-4 w-4 mr-2" />
                      Cập nhật mật khẩu
                    </Button>
                  </div>
                </div>
              )}

              {/* VIP Tab */}
              {activeTab === 'vip' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#e8f4fb] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="h-8 w-8 text-[#1075b1] fill-[#1075b1]" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Đăng ký thành viên VIP</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Các gói VIP giúp tin đăng của bạn nổi bật hơn, tiếp cận được lượng lớn khách hàng tiềm năng.
                    </p>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {PACKAGES.map((pkg) => (
                      <PackageCard
                        key={pkg.id}
                        id={pkg.id}
                        name={pkg.name}
                        price={pkg.price}
                        duration={pkg.duration}
                        features={pkg.features}
                        isPopular={pkg.isPopular}
                        color={pkg.color}
                        onSelect={() => {}}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
