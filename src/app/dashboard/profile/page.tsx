'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Star,
  Camera,
  Edit,
  Save,
  Lock,
  Bell,
  Eye,
  CheckCircle
} from 'lucide-react';

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
        <p className="text-gray-500">Vui lòng đăng nhập</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ của tôi</h1>
          <p className="text-gray-500">Quản lý thông tin cá nhân</p>
        </div>
        <Badge variant={user.phone_verified_at ? 'default' : 'outline'} className="gap-1">
          {user.phone_verified_at ? (
            <>
              <CheckCircle className="h-3 w-3" />
              Đã xác thực
            </>
          ) : (
            <>
              <Shield className="h-3 w-3" />
              Chưa xác thực
            </>
          )}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="relative inline-block">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="text-2xl">{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mt-4">{user.name}</h2>
              <p className="text-gray-500">{user.email}</p>
              <Badge variant="secondary" className="mt-2">
                {user.role === 'admin' ? 'Quản trị' : user.role === 'agent' ? 'Môi giới' : 'Người dùng'}
              </Badge>
            </div>

            <Separator className="my-6" />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{user.total_listings || 0}</p>
                <p className="text-sm text-gray-500">Tin đăng</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1">
                  {user.rating || '0'}
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                </p>
                <p className="text-sm text-gray-500">Đánh giá</p>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Quick Links */}
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Bell className="h-4 w-4" />
                Thông báo
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Lock className="h-4 w-4" />
                Bảo mật
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Eye className="h-4 w-4" />
                Quyền riêng tư
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="lg:col-span-2">
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader>
                <TabsList>
                  <TabsTrigger value="info">Thông tin</TabsTrigger>
                  <TabsTrigger value="password">Đổi mật khẩu</TabsTrigger>
                  <TabsTrigger value="vip">VIP</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                {/* Info Tab */}
                <TabsContent value="info" className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Họ và tên</Label>
                      <Input
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Số điện thoại</Label>
                      <Input
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Địa chỉ</Label>
                      <Input
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Giới thiệu bản thân</Label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                      rows={4}
                      className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Chia sẻ về bản thân..."
                    />
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Facebook</Label>
                      <Input
                        value={profileForm.facebook}
                        onChange={(e) => setProfileForm({...profileForm, facebook: e.target.value})}
                        className="mt-1"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div>
                      <Label>Zalo</Label>
                      <Input
                        value={profileForm.zalo}
                        onChange={(e) => setProfileForm({...profileForm, zalo: e.target.value})}
                        className="mt-1"
                        placeholder="Số điện thoại Zalo"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleProfileUpdate} disabled={isLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      Lưu thay đổi
                    </Button>
                  </div>
                </TabsContent>

                {/* Password Tab */}
                <TabsContent value="password" className="space-y-6">
                  <div className="max-w-md">
                    <div className="mb-4">
                      <Label>Mật khẩu hiện tại</Label>
                      <Input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div className="mb-4">
                      <Label>Mật khẩu mới</Label>
                      <Input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div className="mb-6">
                      <Label>Xác nhận mật khẩu mới</Label>
                      <Input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={handlePasswordChange} disabled={isLoading}>
                      <Lock className="h-4 w-4 mr-2" />
                      Đổi mật khẩu
                    </Button>
                  </div>
                </TabsContent>

                {/* VIP Tab */}
                <TabsContent value="vip" className="space-y-6">
                  <div className="text-center py-8">
                    <Shield className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Nâng cấp VIP</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Giúp tin đăng của bạn nổi bật hơn và tiếp cận nhiều khách hàng tiềm năng hơn
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                      {/* VIP Packages */}
                      {[
                        { name: 'VIP', price: '500,000', color: 'bg-yellow-500', duration: '7 ngày' },
                        { name: 'VIP+', price: '1,500,000', color: 'bg-orange-500', duration: '30 ngày' },
                        { name: 'Diamond', price: '3,000,000', color: 'bg-gradient-to-r from-primary to-primary-dark', duration: '30 ngày' },
                      ].map((pkg) => (
                        <Card key={pkg.name} className="relative overflow-hidden">
                          {pkg.name === 'VIP+' && (
                            <div className="absolute top-0 left-0 right-0 bg-orange-500 text-white text-xs py-1 text-center">
                              Phổ biến
                            </div>
                          )}
                          <CardContent className="pt-8">
                            <div className={`w-12 h-12 rounded-full ${pkg.color} mx-auto flex items-center justify-center mb-4`}>
                              <Star className="h-6 w-6 text-white" />
                            </div>
                            <h4 className="font-bold text-gray-900">{pkg.name}</h4>
                            <p className="text-sm text-gray-500 mb-2">{pkg.duration}</p>
                            <p className="text-2xl font-bold text-red-600">{pkg.price}đ</p>
                            <Button variant="outline" className="w-full mt-4">
                              Mua ngay
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
