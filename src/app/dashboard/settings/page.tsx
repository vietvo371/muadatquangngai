'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Profile settings
  const [profile, setProfile] = useState({
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@email.com',
    phone: '0901234567',
    avatar: null as string | null,
  });

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

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Đã lưu cài đặt thành công!');
    } catch {
      toast.error('Lỗi khi lưu cài đặt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = () => {
    console.log('Delete account');
    setShowDeleteDialog(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt tài khoản</h1>
        <p className="text-gray-500">Quản lý cài đặt và tùy chọn tài khoản của bạn</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Hồ sơ
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Thông báo
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="h-4 w-4" />
            Quyền riêng tư
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            Bảo mật
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin hồ sơ</CardTitle>
              <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatar || undefined} />
                    <AvatarFallback className="text-2xl">
                      {profile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="font-medium">Ảnh đại diện</h3>
                  <p className="text-sm text-gray-500">JPG, PNG. Tối đa 2MB</p>
                </div>
              </div>

              <Separator />

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="flex-1"
                  />
                  <Button variant="outline">Xác thực</Button>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <div className="flex gap-2">
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="flex-1"
                  />
                  <Button variant="outline">Đổi số</Button>
                </div>
              </div>

              <Separator />

              <Button onClick={handleSave} disabled={isSubmitting} className="gap-2">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                Lưu thay đổi
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Thông báo</CardTitle>
              <CardDescription>Quản lý cách bạn nhận thông báo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Tin nhắn mới</p>
                      <p className="text-sm text-gray-500">Nhận email khi có tin nhắn mới</p>
                    </div>
                    <Switch
                      checked={notifications.email_new_message}
                      onCheckedChange={(v) => setNotifications({ ...notifications, email_new_message: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Thông báo hệ thống</p>
                      <p className="text-sm text-gray-500">Nhận thông báo về tài khoản</p>
                    </div>
                    <Switch
                      checked={notifications.email_new_notification}
                      onCheckedChange={(v) => setNotifications({ ...notifications, email_new_notification: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email marketing</p>
                      <p className="text-sm text-gray-500">Nhận tin khuyến mãi, ưu đãi</p>
                    </div>
                    <Switch
                      checked={notifications.email_marketing}
                      onCheckedChange={(v) => setNotifications({ ...notifications, email_marketing: v })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Push Notifications */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Push Notification
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Tin nhắn mới</p>
                      <p className="text-sm text-gray-500">Thông báo khi có tin nhắn</p>
                    </div>
                    <Switch
                      checked={notifications.push_new_message}
                      onCheckedChange={(v) => setNotifications({ ...notifications, push_new_message: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Thông báo</p>
                      <p className="text-sm text-gray-500">Thông báo hệ thống</p>
                    </div>
                    <Switch
                      checked={notifications.push_new_notification}
                      onCheckedChange={(v) => setNotifications({ ...notifications, push_new_notification: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Thay đổi giá</p>
                      <p className="text-sm text-gray-500">Thông báo khi tin đăng bạn quan tâm thay đổi giá</p>
                    </div>
                    <Switch
                      checked={notifications.push_price_change}
                      onCheckedChange={(v) => setNotifications({ ...notifications, push_price_change: v })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <Button onClick={handleSave} disabled={isSubmitting} className="gap-2">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                Lưu thay đổi
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Quyền riêng tư</CardTitle>
              <CardDescription>Kiểm soát ai có thể xem thông tin của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Hiển thị số điện thoại</p>
                    <p className="text-sm text-gray-500">Cho phép người khác xem số điện thoại</p>
                  </div>
                  <Switch
                    checked={privacy.show_phone}
                    onCheckedChange={(v) => setPrivacy({ ...privacy, show_phone: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Hiển thị email</p>
                    <p className="text-sm text-gray-500">Cho phép người khác xem email</p>
                  </div>
                  <Switch
                    checked={privacy.show_email}
                    onCheckedChange={(v) => setPrivacy({ ...privacy, show_email: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Trạng thái online</p>
                    <p className="text-sm text-gray-500">Hiển thị khi bạn đang online</p>
                  </div>
                  <Switch
                    checked={privacy.show_online_status}
                    onCheckedChange={(v) => setPrivacy({ ...privacy, show_online_status: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Cho phép nhắn tin</p>
                    <p className="text-sm text-gray-500">Người khác có thể gửi tin nhắn cho bạn</p>
                  </div>
                  <Switch
                    checked={privacy.allow_messages}
                    onCheckedChange={(v) => setPrivacy({ ...privacy, allow_messages: v })}
                  />
                </div>
              </div>

              <Separator />

              <Button onClick={handleSave} disabled={isSubmitting} className="gap-2">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                Lưu thay đổi
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Bảo mật</CardTitle>
              <CardDescription>Quản lý mật khẩu và bảo mật tài khoản</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Change Password */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Đổi mật khẩu
                </h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Mật khẩu hiện tại</Label>
                    <Input id="current_password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password">Mật khẩu mới</Label>
                    <Input id="new_password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Xác nhận mật khẩu mới</Label>
                    <Input id="confirm_password" type="password" />
                  </div>
                  <Button>Đổi mật khẩu</Button>
                </div>
              </div>

              <Separator />

              {/* Two Factor */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Xác thực 2 yếu tố (2FA)</h3>
                  <p className="text-sm text-gray-500">Thêm lớp bảo mật cho tài khoản</p>
                </div>
                <Button variant="outline">Kích hoạt</Button>
              </div>

              <Separator />

              {/* Sessions */}
              <div>
                <h3 className="font-medium mb-4">Phiên đăng nhập</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Chrome trên MacOS</p>
                      <p className="text-sm text-gray-500">TP.HCM, Việt Nam • Hoạt động gần đây</p>
                    </div>
                    <Badge>Hiện tại</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Safari trên iPhone</p>
                      <p className="text-sm text-gray-500">TP.HCM, Việt Nam • 2 ngày trước</p>
                    </div>
                    <Button variant="ghost" size="sm">Đăng xuất</Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Delete Account */}
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <h3 className="font-medium text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Xóa tài khoản
                </h3>
                <p className="text-sm text-gray-600 mt-2 mb-4">
                  Khi xóa tài khoản, tất cả dữ liệu sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
                </p>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Xóa tài khoản
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Xóa tài khoản
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Nhập <strong>DELETE</strong> để xác nhận:
            </p>
            <Input placeholder="Nhập DELETE" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Xóa tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
