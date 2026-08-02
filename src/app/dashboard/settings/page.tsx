'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Smartphone,
  Mail,
  Lock,
  Camera,
  Save,
  Loader2,
  Trash2,
  AlertTriangle,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';
import { PillTabs } from '@/components/ui/pill-tabs';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [closePassword, setClosePassword] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  // Hồ sơ — nạp từ tài khoản ĐANG ĐĂNG NHẬP. Trước đây hardcode "Nguyễn Văn A" /
  // "nguyenvana@email.com" nên ai vào cũng thấy tên người khác và tưởng đăng nhập nhầm.
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const setAuthUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: null as string | null,
  });

  useEffect(() => {
    if (!authUser) return;
    setProfile({
      name: authUser.name ?? '',
      email: authUser.email ?? '',
      phone: authUser.phone ?? '',
      avatar: authUser.avatar ?? null,
    });
  }, [authUser]);

  // Notification settings
  const [notifications, setNotifications] = useState({
    email_new_message: true,
    email_new_notification: true,
    email_marketing: false,
    push_new_message: true,
    push_new_notification: true,
    push_price_change: true,
    sms_promotion: false,
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    show_phone: true,
    show_email: false,
    show_online_status: true,
    allow_messages: true,
  });

  /**
   * Lưu hồ sơ THẬT qua PUT /api/v2/user/profile.
   *
   * Bản trước chỉ `setTimeout(1000)` rồi báo "Đã lưu cài đặt thành công!" — người dùng sửa tên,
   * thấy báo thành công, tải lại trang thì mất sạch. Cùng loại lỗi giả lập từng gặp ở trang quên
   * mật khẩu.
   *
   * Chỉ gửi các trường API thật sự nhận (name, phone). Email không đổi được ở đây, còn thông báo/
   * riêng tư chưa có cột trong DB nên tab đó không có nút lưu (xem ghi chú ở phần render).
   */
  const handleSave = async () => {
    if (!profile.name.trim()) {
      toast.error('Vui lòng nhập họ tên.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.put('/api/v2/user/profile', {
        name: profile.name.trim(),
        phone: profile.phone.trim() || null,
      });
      const updated = res.data?.data;
      if (updated) setAuthUser({ ...authUser, ...updated });
      toast.success('Đã lưu thông tin cá nhân.');
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
          ?.response?.data;
      const firstError = msg?.errors ? Object.values(msg.errors).flat()[0] : undefined;
      toast.error(firstError || msg?.message || 'Không lưu được. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Đóng tài khoản (POST /api/v2/user/account/close).
   *
   * KHÔNG xoá cứng: mọi khoá ngoại trỏ vào `users` đều `onDelete: Cascade` nên xoá user sẽ kéo
   * theo cả `transactions`/`subscriptions` — mất sạch lịch sử tiền. Server đặt `status = 'closed'`,
   * ẩn tin đang hiển thị, thu hồi token; ví còn tiền thì từ chối và báo lý do.
   */
  const handleDeleteAccount = async () => {
    setIsClosing(true);
    try {
      await api.post('/api/v2/user/account/close', { password: closePassword });
      setShowDeleteDialog(false);
      setClosePassword('');
      toast.success('Đã đóng tài khoản. Hẹn gặp lại bạn.');
      logout();
      router.push('/');
    } catch (err) {
      const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
        ?.response?.data;
      const firstError = data?.errors ? Object.values(data.errors).flat()[0] : undefined;
      toast.error(firstError || data?.message || 'Không đóng được tài khoản. Vui lòng thử lại.');
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cài đặt hệ thống</h1>
        <p className="text-gray-500 mt-1">Cấu hình cá nhân, thông báo và bảo mật tài khoản</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3">
          <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden sticky top-24">
            <div className="p-3">
              <PillTabs 
                tabs={[
                  { id: 'profile', label: 'Hồ sơ', icon: <User className="h-4 w-4" /> },
                  { id: 'notifications', label: 'Thông báo', icon: <Bell className="h-4 w-4" /> },
                  { id: 'privacy', label: 'Quyền riêng tư', icon: <Shield className="h-4 w-4" /> },
                  { id: 'security', label: 'Bảo mật', icon: <Lock className="h-4 w-4" /> },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
                orientation="vertical"
              />
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card className="rounded-2xl shadow-sm border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-5">
                <CardTitle className="text-xl">Thông tin hồ sơ</CardTitle>
                <CardDescription>Cập nhật thông tin cá nhân và liên hệ của bạn</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Avatar */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="relative shrink-0">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                      <AvatarImage src={profile.avatar || undefined} />
                      <AvatarFallback className="text-3xl bg-primary-light text-primary font-bold">
                        {profile.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-gray-900 hover:bg-black text-white border-2 border-white shadow-sm"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Ảnh đại diện</h3>
                    <p className="text-sm text-gray-500 mb-3">Định dạng JPG, PNG. Dung lượng tối đa 2MB.</p>
                    <div className="flex gap-2">
                      <Button variant="outline" className="h-9 font-medium">Tải ảnh lên</Button>
                      <Button variant="ghost" className="h-9 text-red-500 hover:text-red-600 font-medium">Xóa ảnh</Button>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-100" />

                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name" className="font-semibold text-gray-700">Họ và tên</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="h-11 bg-gray-50"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-semibold text-gray-700">Địa chỉ Email</Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="flex-1 h-11 bg-gray-50"
                      />
                      <Button variant="outline" className="h-11 px-4 font-medium">Xác thực</Button>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-semibold text-gray-700">Số điện thoại</Label>
                    <div className="flex gap-2">
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="flex-1 h-11 bg-gray-50"
                      />
                      <Button variant="outline" className="h-11 px-4 font-medium">Đổi số</Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <Button onClick={handleSave} disabled={isSubmitting} className="h-11 px-8 bg-gray-900 hover:bg-black font-bold">
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    <Save className="h-4 w-4 mr-2" />
                    Lưu thay đổi
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card className="rounded-2xl shadow-sm border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-5">
                <CardTitle className="text-xl">Cài đặt thông báo</CardTitle>
                <CardDescription>Quản lý cách bạn nhận các thông báo từ hệ thống</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Chưa có cột lưu trong DB — nói rõ thay vì để nút "Lưu thay đổi" báo thành công
                    rồi mất sạch sau khi tải lại trang. */}
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-amber-800">
                    Phần tuỳ chỉnh thông báo đang được hoàn thiện, các lựa chọn bên dưới chưa được lưu lại.
                    Hiện hệ thống vẫn gửi thông báo quan trọng về tin đăng và tin nhắn của bạn.
                  </p>
                </div>

                {/* Email Notifications */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#e8f4fb] flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-[#1075b1]" />
                    </div>
                    Thông báo qua Email
                  </h3>
                  <div className="space-y-4 ml-10">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-bold text-gray-900 text-[15px]">Tin nhắn mới</p>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">Nhận email khi có người gửi tin nhắn cho bạn</p>
                      </div>
                      <Switch
                        checked={notifications.email_new_message}
                        onCheckedChange={(v) => setNotifications({ ...notifications, email_new_message: v })}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-bold text-gray-900 text-[15px]">Thông báo hệ thống</p>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">Nhận cập nhật quan trọng về tài khoản và tin đăng</p>
                      </div>
                      <Switch
                        checked={notifications.email_new_notification}
                        onCheckedChange={(v) => setNotifications({ ...notifications, email_new_notification: v })}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-bold text-gray-900 text-[15px]">Email Marketing</p>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">Nhận tin khuyến mãi, ưu đãi và tin tức thị trường</p>
                      </div>
                      <Switch
                        checked={notifications.email_marketing}
                        onCheckedChange={(v) => setNotifications({ ...notifications, email_marketing: v })}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-100" />

                {/* Push Notifications */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#e8f4fb] flex items-center justify-center shrink-0">
                      <Smartphone className="h-4 w-4 text-[#1075b1]" />
                    </div>
                    Thông báo đẩy (Push)
                  </h3>
                  <div className="space-y-4 ml-10">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-bold text-gray-900 text-[15px]">Tin nhắn mới</p>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">Hiển thị thông báo ngay lập tức trên trình duyệt</p>
                      </div>
                      <Switch
                        checked={notifications.push_new_message}
                        onCheckedChange={(v) => setNotifications({ ...notifications, push_new_message: v })}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-bold text-gray-900 text-[15px]">Thông báo hệ thống</p>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">Hiển thị cảnh báo trực tiếp về tài khoản</p>
                      </div>
                      <Switch
                        checked={notifications.push_new_notification}
                        onCheckedChange={(v) => setNotifications({ ...notifications, push_new_notification: v })}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-bold text-gray-900 text-[15px]">Thay đổi giá</p>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">Thông báo khi tin đăng bạn quan tâm giảm giá</p>
                      </div>
                      <Switch
                        checked={notifications.push_price_change}
                        onCheckedChange={(v) => setNotifications({ ...notifications, push_price_change: v })}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Không có nút "Lưu thay đổi" ở tab này: chưa có cột lưu trong DB nên bấm cũng
                    không giữ được gì — xem banner cảnh báo ở đầu tab. */}
              </CardContent>
            </Card>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <Card className="rounded-2xl shadow-sm border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-5">
                <CardTitle className="text-xl">Quyền riêng tư</CardTitle>
                <CardDescription>Kiểm soát ai có thể xem thông tin và liên hệ với bạn</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Chưa có cột lưu trong DB — xem ghi chú ở tab Thông báo. */}
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-amber-800">
                    Tuỳ chỉnh quyền riêng tư đang được hoàn thiện, các lựa chọn bên dưới chưa được lưu lại.
                    Hiện số điện thoại của bạn vẫn hiển thị trên tin đăng để người mua liên hệ.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white">
                    <div className="pr-4">
                      <p className="font-bold text-gray-900 text-[15px]">Hiển thị số điện thoại</p>
                      <p className="text-sm text-gray-500 font-medium mt-0.5">Cho phép người khác xem số điện thoại trên tin đăng của bạn</p>
                    </div>
                    <Switch
                      checked={privacy.show_phone}
                      onCheckedChange={(v) => setPrivacy({ ...privacy, show_phone: v })}
                      className="data-[state=checked]:bg-primary shrink-0"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white">
                    <div className="pr-4">
                      <p className="font-bold text-gray-900 text-[15px]">Hiển thị Email</p>
                      <p className="text-sm text-gray-500 font-medium mt-0.5">Cho phép người khác xem địa chỉ email liên hệ</p>
                    </div>
                    <Switch
                      checked={privacy.show_email}
                      onCheckedChange={(v) => setPrivacy({ ...privacy, show_email: v })}
                      className="data-[state=checked]:bg-primary shrink-0"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white">
                    <div className="pr-4">
                      <p className="font-bold text-gray-900 text-[15px]">Trạng thái hoạt động</p>
                      <p className="text-sm text-gray-500 font-medium mt-0.5">Hiển thị nhãn "Đang Online" khi bạn truy cập hệ thống</p>
                    </div>
                    <Switch
                      checked={privacy.show_online_status}
                      onCheckedChange={(v) => setPrivacy({ ...privacy, show_online_status: v })}
                      className="data-[state=checked]:bg-primary shrink-0"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white">
                    <div className="pr-4">
                      <p className="font-bold text-gray-900 text-[15px]">Cho phép nhắn tin</p>
                      <p className="text-sm text-gray-500 font-medium mt-0.5">Người dùng khác có thể gửi tin nhắn chat trực tiếp cho bạn</p>
                    </div>
                    <Switch
                      checked={privacy.allow_messages}
                      onCheckedChange={(v) => setPrivacy({ ...privacy, allow_messages: v })}
                      className="data-[state=checked]:bg-primary shrink-0"
                    />
                  </div>
                </div>

                {/* Không có nút "Lưu thay đổi": chưa có cột lưu trong DB — xem banner ở trên. */}
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card className="rounded-2xl shadow-sm border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-5">
                <CardTitle className="text-xl">Bảo mật tài khoản</CardTitle>
                <CardDescription>Bảo vệ tài khoản của bạn bằng các lớp bảo mật nâng cao</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Change Password */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Lock className="h-4 w-4 text-gray-700" />
                    </div>
                    Đổi mật khẩu
                  </h3>
                  <div className="space-y-4 ml-10 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="current_password" className="font-semibold text-gray-700">Mật khẩu hiện tại</Label>
                      <Input id="current_password" type="password" className="h-11 bg-gray-50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new_password" className="font-semibold text-gray-700">Mật khẩu mới</Label>
                      <Input id="new_password" type="password" className="h-11 bg-gray-50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password" className="font-semibold text-gray-700">Xác nhận mật khẩu mới</Label>
                      <Input id="confirm_password" type="password" className="h-11 bg-gray-50" />
                    </div>
                    <Button className="font-bold">Đổi mật khẩu</Button>
                  </div>
                </div>

                <Separator className="bg-gray-100" />

                {/* Two Factor */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Xác thực 2 yếu tố (2FA)</h3>
                    <p className="text-sm text-gray-500 font-medium mt-1 max-w-md">Tăng cường bảo mật bằng cách yêu cầu mã xác nhận từ điện thoại mỗi khi đăng nhập.</p>
                  </div>
                  <Button variant="outline" className="h-10 px-6 font-bold shrink-0">Kích hoạt</Button>
                </div>

                <Separator className="bg-gray-100" />

                {/* Sessions */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">Thiết bị đã đăng nhập</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-4">
                        <Monitor className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-bold text-gray-900 text-[15px]">Mac OS • Chrome</p>
                          <p className="text-[13px] text-gray-500 font-medium mt-0.5">TP.HCM, Việt Nam • Đang hoạt động</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 font-bold">Hiện tại</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl">
                      <div className="flex items-center gap-4">
                        <Smartphone className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-bold text-gray-900 text-[15px]">iPhone 14 Pro Max • Safari</p>
                          <p className="text-[13px] text-gray-500 font-medium mt-0.5">Hà Nội, Việt Nam • 2 ngày trước</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="font-bold text-gray-500 hover:text-gray-900">Đăng xuất</Button>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-100" />

                {/* Đóng tài khoản — mô tả đúng việc hệ thống THỰC SỰ làm.
                    Bản trước hứa "xóa vĩnh viễn toàn bộ dữ liệu": vừa sai (nút chỉ console.log),
                    vừa không làm được — mọi khoá ngoại trỏ vào users đều onDelete: Cascade nên xoá
                    cứng sẽ kéo theo cả lịch sử giao dịch tiền. */}
                <div className="p-6 border border-red-200 rounded-xl bg-red-50/50">
                  <h3 className="font-bold text-red-600 text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Đóng tài khoản
                  </h3>
                  <p className="text-sm text-gray-600 mt-2 mb-4 font-medium leading-relaxed">
                    Tài khoản sẽ ngừng hoạt động: bạn không đăng nhập được nữa và toàn bộ tin đang
                    hiển thị sẽ bị ẩn khỏi trang web. Lịch sử giao dịch được giữ lại theo quy định
                    kế toán. Nếu ví còn tiền, vui lòng sử dụng hết hoặc liên hệ hỗ trợ để rút trước.
                    Muốn mở lại tài khoản, bạn cần liên hệ bộ phận hỗ trợ.
                  </p>
                  <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="gap-2 font-bold shadow-md shadow-red-500/20">
                    <Trash2 className="h-4 w-4" />
                    Đóng tài khoản
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl border-0 overflow-hidden p-0 sm:max-w-md">
          <div className="bg-red-600 p-6 flex flex-col items-center justify-center text-white text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-bold mb-1 text-white">Xác nhận đóng tài khoản</DialogTitle>
            <DialogDescription className="text-red-100 font-medium">
              Bạn sẽ không đăng nhập lại được nếu không liên hệ hỗ trợ.
            </DialogDescription>
          </div>
          <div className="p-6">
            {/* Xác nhận bằng MẬT KHẨU thật (server kiểm lại), thay cho ô "gõ DELETE" trước đây —
                ô đó không nối vào state nên gõ gì cũng bấm xác nhận được. */}
            <p className="text-[15px] text-gray-700 mb-4 font-medium">
              Nhập mật khẩu của bạn để xác nhận:
            </p>
            <Input
              type="password"
              value={closePassword}
              onChange={(e) => setClosePassword(e.target.value)}
              placeholder="Mật khẩu"
              autoComplete="current-password"
              className="h-12 mb-6 border-red-200 focus-visible:ring-red-500"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setShowDeleteDialog(false); setClosePassword(''); }}
                disabled={isClosing}
                className="flex-1 h-11 font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isClosing || closePassword.length === 0}
                className="flex-1 h-11 font-bold"
              >
                {isClosing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Đóng tài khoản
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
