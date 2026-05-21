'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Camera,
  Save,
  Lock,
  User,
  CheckCircle,
  ShieldAlert,
  Loader2,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Link as LinkIcon,
} from 'lucide-react';
import { toast } from 'sonner';

const TAB_LIST = [
  { id: 'info', label: 'Thông tin cá nhân', icon: User },
  { id: 'password', label: 'Đổi mật khẩu', icon: Lock },
];

export default function AdminProfilePage() {
  const { user, isLoading, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [isSaving, setIsSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    address: user?.address || '',
    facebook: user?.facebook || '',
    zalo: user?.zalo || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    try {
      const result = await updateProfile(profileForm);
      if (result.success) {
        toast.success('Đã cập nhật thông tin hồ sơ thành công!');
      } else {
        toast.error(result.message || 'Không thể cập nhật hồ sơ');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật hồ sơ');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    setIsSaving(true);
    try {
      const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (result.success) {
        toast.success('Đã cập nhật mật khẩu thành công!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(result.message || 'Không thể đổi mật khẩu');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const roleLabel =
    user.role === 'super_admin'
      ? 'Super Admin'
      : user.role === 'admin'
      ? 'Quản trị viên'
      : user.role === 'agent'
      ? 'Môi giới'
      : 'Người dùng';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hồ sơ cá nhân</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý thông tin và cài đặt tài khoản quản trị của bạn</p>
        </div>
        <div className="flex items-center gap-2">
          {user.phone_verified_at ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 gap-1.5 px-3 py-1 text-xs font-bold">
              <CheckCircle className="h-3.5 w-3.5" />
              Đã xác thực
            </Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-0 gap-1.5 px-3 py-1 text-xs font-bold">
              <ShieldAlert className="h-3.5 w-3.5" />
              Chưa xác thực
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Profile Card Sidebar */}
        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
          {/* Cover gradient */}
          <div className="h-20 bg-gradient-to-r from-primary/70 to-primary w-full" />
          <CardContent className="pt-0 px-5 pb-6 relative">
            <div className="flex justify-center -mt-10 mb-4">
              <div className="relative inline-block rounded-full p-1 bg-white shadow-sm">
                <Avatar className="h-20 w-20 border-4 border-white shadow">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="text-xl font-bold bg-primary-light text-primary">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-gray-900 hover:bg-black text-white border-2 border-white shadow-sm flex items-center justify-center transition-colors">
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="text-center mb-5">
              <h2 className="text-[16px] font-bold text-gray-900">{user.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5 mb-2">{user.email}</p>
              <Badge className="bg-primary-light text-primary hover:bg-primary-light border-0 text-xs font-bold px-3">
                {roleLabel}
              </Badge>
            </div>

            {/* Contact quick info */}
            <div className="space-y-2 text-[12.5px] text-gray-500 font-medium border-t border-gray-100 pt-4">
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{user.address}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100 text-center">
              <div>
                <p className="text-xl font-black text-gray-900">{user.total_listings || 0}</p>
                <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Tin đã đăng</p>
              </div>
              <div>
                <p className="text-xl font-black text-gray-900">{user.rating || '—'}</p>
                <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Đánh giá</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tab Navigation */}
          <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-2">
              <nav className="flex gap-1">
                {TAB_LIST.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                        isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          {/* Tab: Thông tin cá nhân */}
          {activeTab === 'info' && (
            <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      Họ và tên
                    </Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm focus-visible:ring-primary/20 focus-visible:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      Địa chỉ Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="h-10 rounded-xl border-gray-200 bg-gray-100 text-sm text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      Số điện thoại
                    </Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm focus-visible:ring-primary/20 focus-visible:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      Địa chỉ
                    </Label>
                    <Input
                      id="address"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm focus-visible:ring-primary/20 focus-visible:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                    Giới thiệu bản thân
                  </Label>
                  <textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    rows={4}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none outline-none transition-colors"
                    placeholder="Mô tả ngắn gọn về vai trò và trách nhiệm của bạn..."
                  />
                </div>

                <div className="pt-1 border-t border-gray-100">
                  <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3">Mạng xã hội</p>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="facebook" className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5">
                        <LinkIcon className="h-3.5 w-3.5 text-gray-400" />
                        Facebook
                      </Label>
                      <Input
                        id="facebook"
                        value={profileForm.facebook}
                        onChange={(e) => setProfileForm({ ...profileForm, facebook: e.target.value })}
                        placeholder="Link Facebook của bạn"
                        className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm focus-visible:ring-primary/20 focus-visible:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zalo" className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        Zalo
                      </Label>
                      <Input
                        id="zalo"
                        value={profileForm.zalo}
                        onChange={(e) => setProfileForm({ ...profileForm, zalo: e.target.value })}
                        placeholder="Số điện thoại Zalo"
                        className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm focus-visible:ring-primary/20 focus-visible:border-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <Button
                    onClick={handleProfileUpdate}
                    disabled={isLoading || isSaving}
                    className="bg-primary hover:bg-primary/90 rounded-xl font-bold text-xs h-9.5 gap-1.5 shadow-sm text-white"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Lưu thay đổi
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab: Đổi mật khẩu */}
          {activeTab === 'password' && (
            <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-6">
                <div className="max-w-md space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="current_password" className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-gray-400" />
                      Mật khẩu hiện tại
                    </Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm focus-visible:ring-primary/20 focus-visible:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password" className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-gray-400" />
                      Mật khẩu mới
                    </Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm focus-visible:ring-primary/20 focus-visible:border-primary"
                    />
                    <p className="text-[11.5px] text-gray-400">Tối thiểu 8 ký tự, nên kết hợp chữ hoa, số và ký tự đặc biệt.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password" className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-gray-400" />
                      Xác nhận mật khẩu mới
                    </Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm focus-visible:ring-primary/20 focus-visible:border-primary"
                    />
                  </div>
                  <div className="pt-2 flex justify-end border-t border-gray-100">
                    <Button
                      onClick={handlePasswordChange}
                      disabled={isLoading || isSaving}
                      className="bg-primary hover:bg-primary/90 rounded-xl font-bold text-xs h-9.5 gap-1.5 shadow-sm text-white"
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                      Cập nhật mật khẩu
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
