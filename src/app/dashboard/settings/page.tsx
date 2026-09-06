'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { fileUploadApi } from '@/lib/admin-api';
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
  // Cho phép link thẳng vào một tab (vd /dashboard/settings?tab=security từ trang Hồ sơ).
  // CỐ Ý không dùng useSearchParams: nó biến trang thành dynamic và làm hỏng prerender lúc
  // build (đã thử, build đứt ở bước Export /dashboard/settings). Đọc từ window sau khi mount
  // là đủ cho một trang chỉ hiện sau khi đăng nhập.
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const TABS = ['profile', 'notifications', 'privacy', 'security'];
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab && TABS.includes(tab)) setActiveTab(tab);
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [closePassword, setClosePassword] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  /** Phiên đăng nhập thật của tài khoản (GET /api/v2/user/sessions). */
  interface LoginSession {
    id: number;
    name: string;
    created_at: string | null;
    last_used_at: string | null;
    is_current: boolean;
  }
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  /**
   * Ảnh đại diện — trước đây nút máy ảnh, "Tải ảnh lên" và "Xóa ảnh" đều không có onClick.
   * Ảnh đi thẳng lên Cloudinary từ trình duyệt (giống ảnh tin đăng), rồi lưu đường dẫn qua
   * PUT /api/v2/user/profile — route đó nay nhận thêm trường `avatar`.
   */
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const saveAvatar = async (value: string | null, doneMessage: string) => {
    const res = await api.put('/api/v2/user/profile', { avatar: value });
    const updated = res.data?.data;
    setProfile((p) => ({ ...p, avatar: value }));
    if (updated) setAuthUser(updated);
    toast.success(doneMessage);
  };

  const onPickAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Cho chọn lại đúng file vừa chọn (nếu không, input giữ nguyên value và không bắn change).
    event.target.value = '';
    if (!file) return;

    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast.error('Chỉ nhận ảnh JPG, PNG hoặc WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ảnh vượt quá 2MB. Vui lòng chọn ảnh nhẹ hơn.');
      return;
    }

    setAvatarBusy(true);
    try {
      const uploaded = await fileUploadApi.upload(file);
      await saveAvatar(uploaded.url, 'Đã cập nhật ảnh đại diện.');
    } catch (error) {
      toast.error((error as Error)?.message || 'Không tải được ảnh lên. Vui lòng thử lại.');
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarBusy(true);
    try {
      await saveAvatar(null, 'Đã xoá ảnh đại diện.');
    } catch {
      toast.error('Không xoá được ảnh đại diện. Vui lòng thử lại.');
    } finally {
      setAvatarBusy(false);
    }
  };

  /**
   * Xác thực email — nút "Xác thực" trước đây cũng chết, dù hai endpoint gửi mã và xác nhận mã
   * đã có sẵn. Luồng: gửi mã 6 số về email -> nhập mã -> đánh dấu đã xác thực.
   */
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const apiMessage = (error: unknown, fallback: string) => {
    const res = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
    return (res?.errors ? Object.values(res.errors)[0]?.[0] : undefined) || res?.message || fallback;
  };

  const sendVerifyCode = async () => {
    setSendingCode(true);
    try {
      const res = await api.post('/api/v2/auth/email-verification/send');
      toast.success(res.data?.message || 'Đã gửi mã xác thực tới email của bạn.');
      setShowVerifyEmail(true);
    } catch (error) {
      const message = apiMessage(error, 'Không gửi được mã xác thực. Vui lòng thử lại.');
      // Email đã xác thực từ trước thì đây là tin tốt, không phải lỗi — đừng báo đỏ.
      if (/đã được xác thực/i.test(message)) toast.success(message);
      else toast.error(message);
    } finally {
      setSendingCode(false);
    }
  };

  const confirmVerifyCode = async () => {
    if (!verifyCode.trim()) {
      toast.error('Vui lòng nhập mã xác thực.');
      return;
    }
    setVerifyingCode(true);
    try {
      const res = await api.post('/api/v2/auth/email-verification/verify', { code: verifyCode.trim() });
      toast.success(res.data?.message || 'Xác thực email thành công.');
      setShowVerifyEmail(false);
      setVerifyCode('');
      // Nạp lại hồ sơ để cờ đã-xác-thực hiện ngay, khỏi phải tải lại trang.
      const me = await api.get('/api/v2/user/me').catch(() => null);
      if (me?.data?.data) setAuthUser(me.data.data);
    } catch (error) {
      toast.error(apiMessage(error, 'Mã xác thực không đúng hoặc đã hết hạn.'));
    } finally {
      setVerifyingCode(false);
    }
  };

  /**
   * Đổi mật khẩu — trước đây 3 ô này KHÔNG nối state (không value, không onChange) và nút
   * cũng không có onClick: người dùng gõ mật khẩu mới, bấm nút, không có gì xảy ra, nhưng lại
   * tin là đã đổi xong. Nguy hiểm nhất khi ai đó nghi tài khoản bị lộ và vào đây để đổi.
   * `PUT /api/v2/user/password` đã tồn tại và chạy thật từ trước, chỉ là chưa ai nối vào.
   */
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const changePassword = async () => {
    // Chặn sớm ở client cho đỡ phải chờ mạng; server vẫn kiểm lại đầy đủ.
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Vui lòng nhập đủ ba ô mật khẩu.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await api.put('/api/v2/user/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      toast.success(res.data?.message || 'Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      // Server trả lỗi theo từng field (vd mật khẩu hiện tại sai) — ưu tiên hiện đúng câu đó.
      toast.error(apiMessage(error, 'Không đổi được mật khẩu. Vui lòng thử lại.'));
    } finally {
      setChangingPassword(false);
    }
  };

  const loadSessions = () => {
    setSessionsLoading(true);
    api
      .get('/api/v2/user/sessions')
      .then((res) => {
        setSessions(Array.isArray(res.data?.data) ? res.data.data : []);
        setSessionsError(false);
      })
      .catch(() => setSessionsError(true))
      .finally(() => setSessionsLoading(false));
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revokeSession = async (id: number) => {
    setRevokingId(id);
    try {
      await api.delete(`/api/v2/user/sessions/${id}`);
      toast.success('Đã đăng xuất phiên đó.');
      loadSessions();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không đăng xuất được phiên này. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setRevokingId(null);
    }
  };

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
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarBusy}
                      aria-label="Đổi ảnh đại diện"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-gray-900 hover:bg-black text-white border-2 border-white shadow-sm"
                    >
                      {avatarBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Ảnh đại diện</h3>
                    <p className="text-sm text-gray-500 mb-3">Định dạng JPG, PNG hoặc WEBP. Dung lượng tối đa 2MB.</p>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={onPickAvatar}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarBusy}
                        className="h-9 font-medium"
                      >
                        {avatarBusy ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          'Tải ảnh lên'
                        )}
                      </Button>
                      {profile.avatar && (
                        <Button
                          variant="ghost"
                          onClick={removeAvatar}
                          disabled={avatarBusy}
                          className="h-9 text-cta hover:text-cta font-medium"
                        >
                          Xóa ảnh
                        </Button>
                      )}
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
                      {/* Ô email trước đây gõ sửa được nhưng PUT /api/v2/user/profile KHÔNG nhận
                          trường email — sửa xong bấm Lưu là mất, không ai báo gì. Để chỉ đọc cho
                          đúng thực tế. */}
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        readOnly
                        className="flex-1 h-11 bg-gray-100 text-gray-600 cursor-not-allowed"
                      />
                      <Button
                        variant="outline"
                        onClick={sendVerifyCode}
                        disabled={sendingCode}
                        className="h-11 px-4 font-medium"
                      >
                        {sendingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Xác thực'}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      Email dùng để đăng nhập nên không đổi được ở đây.
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-semibold text-gray-700">Số điện thoại</Label>
                    {/* Bỏ nút "Đổi số": nó không có onClick, mà ô số điện thoại vốn đã sửa trực
                        tiếp được và nút Lưu thay đổi bên dưới đã gửi lên API thật. */}
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="h-11 bg-gray-50"
                    />
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
                      <p className="text-sm text-gray-500 font-medium mt-0.5">Hiển thị nhãn &quot;Đang Online&quot; khi bạn truy cập hệ thống</p>
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
                      <Input
                        id="current_password"
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-11 bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new_password" className="font-semibold text-gray-700">Mật khẩu mới</Label>
                      <Input
                        id="new_password"
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-11 bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 font-medium">Tối thiểu 8 ký tự.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password" className="font-semibold text-gray-700">Xác nhận mật khẩu mới</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 bg-gray-50"
                      />
                    </div>
                    <Button className="font-bold" onClick={changePassword} disabled={changingPassword}>
                      {changingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang đổi...
                        </>
                      ) : (
                        'Đổi mật khẩu'
                      )}
                    </Button>
                  </div>
                </div>

                <Separator className="bg-gray-100" />

                {/* Sessions */}
                {/* Phiên đăng nhập THẬT (từ bảng personal_access_tokens). Trước đây chỗ này
                    hardcode "Mac OS • Chrome — TP.HCM" và "iPhone 14 Pro Max • Safari — Hà Nội,
                    2 ngày trước" cho mọi người dùng, kèm nút Đăng xuất không làm gì. Bảng token
                    không lưu user agent/IP nên KHÔNG hiển thị thiết bị hay thành phố. */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 text-lg">Phiên đăng nhập</h3>
                  <p className="text-[13px] text-gray-500 font-medium mb-4">
                    Các phiên đang đăng nhập vào tài khoản của bạn. Thấy phiên lạ thì đăng xuất phiên đó.
                  </p>
                  <div className="space-y-3">
                    {sessionsLoading && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải phiên đăng nhập...
                      </div>
                    )}
                    {!sessionsLoading && sessionsError && (
                      <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-xl">
                        Không tải được danh sách phiên đăng nhập.
                      </p>
                    )}
                    {!sessionsLoading && !sessionsError && sessions.length === 0 && (
                      <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-xl">
                        Chưa có phiên đăng nhập nào được ghi nhận.
                      </p>
                    )}
                    {sessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl gap-3"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <Monitor className="h-8 w-8 text-gray-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-[15px] truncate">
                              {sess.is_current ? 'Phiên hiện tại' : 'Phiên đăng nhập'}
                            </p>
                            <p className="text-[13px] text-gray-500 font-medium mt-0.5">
                              {sess.last_used_at
                                ? `Dùng gần nhất: ${new Date(sess.last_used_at).toLocaleString('vi-VN')}`
                                : sess.created_at
                                  ? `Tạo lúc: ${new Date(sess.created_at).toLocaleString('vi-VN')}`
                                  : ''}
                            </p>
                          </div>
                        </div>
                        {sess.is_current ? (
                          <Badge className="bg-primary-light text-primary hover:bg-primary-light border-0 font-bold shrink-0">
                            Hiện tại
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={revokingId === sess.id}
                            onClick={() => revokeSession(sess.id)}
                            className="font-bold text-gray-500 hover:text-gray-900 shrink-0"
                          >
                            {revokingId === sess.id ? 'Đang xử lý...' : 'Đăng xuất'}
                          </Button>
                        )}
                      </div>
                    ))}
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
      {/* Nhập mã xác thực email */}
      <Dialog open={showVerifyEmail} onOpenChange={setShowVerifyEmail}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác thực email</DialogTitle>
            <DialogDescription>
              Chúng tôi đã gửi mã xác thực tới {profile.email}. Nhập mã để hoàn tất.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            placeholder="Nhập mã xác thực"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="h-11 text-center tracking-widest font-bold"
          />

          <button
            type="button"
            onClick={sendVerifyCode}
            disabled={sendingCode}
            className="text-xs text-primary font-semibold hover:underline disabled:opacity-50"
          >
            Chưa nhận được mã? Gửi lại
          </button>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyEmail(false)}>
              Hủy
            </Button>
            <Button onClick={confirmVerifyCode} disabled={verifyingCode} className="font-bold">
              {verifyingCode ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                'Xác nhận'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
