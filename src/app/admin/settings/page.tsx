'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Globe,
  Mail,
  Share2,
  Search as SearchIcon,
  Sliders,
  Save,
  Loader2,
  AlertTriangle,
  Settings,
  Phone,
  MapPin,
  Link as LinkIcon,
  Image as ImageIcon,
  Hash,
  FileText,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { settingAdminApi, type AdminSetting } from '@/lib/admin-api';

const TAB_LIST = [
  { id: 'general', label: 'Cài đặt chung', icon: Globe },
  { id: 'contact', label: 'Thông tin liên hệ', icon: Mail },
  { id: 'social', label: 'Mạng xã hội', icon: Share2 },
  { id: 'seo', label: 'Tối ưu SEO', icon: SearchIcon },
  { id: 'property', label: 'Nghiệp vụ', icon: Sliders },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settingsData, setSettingsData] = useState<Record<string, string>>({});
  const [settingsMetadata, setSettingsMetadata] = useState<Record<string, AdminSetting>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await settingAdminApi.getGrouped();
      if (response.success && response.data) {
        const values: Record<string, string> = {};
        const meta: Record<string, AdminSetting> = {};
        Object.values(response.data).forEach((groupItems) => {
          groupItems.forEach((item) => {
            values[item.key] = item.value || '';
            meta[item.key] = item;
          });
        });
        setSettingsData(values);
        setSettingsMetadata(meta);
      } else {
        toast.error('Không thể tải cấu hình hệ thống');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tải cấu hình');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setSettingsData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const response = await settingAdminApi.update(settingsData);
      if (response.success) {
        toast.success(response.message || 'Đã lưu cấu hình thành công!');
        fetchSettings();
      } else {
        toast.error('Lưu cấu hình thất bại');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi lưu cấu hình');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (key: string, icon?: React.ReactNode) => {
    const meta = settingsMetadata[key];
    if (!meta) return null;
    const value = settingsData[key] || '';
    const isTextarea = meta.type === 'textarea';
    const isNumber = meta.type === 'number';

    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={key} className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5">
            {icon && <span className="text-gray-400">{icon}</span>}
            {meta.label}
          </Label>
          <span className="text-[9.5px] font-mono text-gray-300 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded select-none">
            {key}
          </span>
        </div>
        {isTextarea ? (
          <Textarea
            id={key}
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            placeholder={`Nhập ${meta.label.toLowerCase()}...`}
            className="min-h-[96px] rounded-xl border-gray-200 bg-gray-50/50 text-sm focus-visible:ring-primary/20 focus-visible:border-primary resize-none"
          />
        ) : (
          <Input
            id={key}
            type={isNumber ? 'number' : 'text'}
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            placeholder={`Nhập ${meta.label.toLowerCase()}...`}
            className="h-10 rounded-xl border-gray-200 bg-gray-50/50 text-sm focus-visible:ring-primary/20 focus-visible:border-primary"
          />
        )}
        {meta.description && (
          <p className="text-[11.5px] text-gray-400 leading-relaxed">{meta.description}</p>
        )}
      </div>
    );
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-52 bg-gray-200" />
            <Skeleton className="h-4 w-80 bg-gray-100" />
          </div>
          <Skeleton className="h-9 w-32 bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full bg-gray-100 rounded-xl" />
            ))}
          </div>
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-52 w-full bg-gray-100 rounded-2xl" />
            <Skeleton className="h-40 w-full bg-gray-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cấu hình hệ thống</h1>
          <p className="text-sm text-gray-500 mt-1">
            Thiết lập thông số vận hành website BatDongSan Quảng Ngãi
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90 rounded-xl font-bold text-xs h-9.5 gap-1.5 shadow-sm text-white transition-all"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Lưu cấu hình
        </Button>
      </div>

      {/* Main Layout: sidebar tabs + content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Tab Sidebar */}
        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl bg-white overflow-hidden lg:sticky lg:top-4">
          <CardContent className="p-2">
            <nav className="space-y-0.5">
              {TAB_LIST.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all text-left ${
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Tab Content */}
        <div className="lg:col-span-3 space-y-4">

          {/* ── Tab: Cài đặt chung ──────────────────────────────────────── */}
          {activeTab === 'general' && (
            <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] rounded-2xl bg-white overflow-hidden">
              <CardHeader className="border-b border-gray-50 bg-gray-50/50 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary-light text-primary rounded-lg">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-[15px] font-bold text-gray-900">Cài đặt chung</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Thông tin cơ bản về giao diện và nhận diện thương hiệu website</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {renderField('site_name', <Settings className="h-3.5 w-3.5" />)}
                {renderField('site_tagline', <FileText className="h-3.5 w-3.5" />)}
                {renderField('site_logo', <ImageIcon className="h-3.5 w-3.5" />)}
                {renderField('site_favicon', <Camera className="h-3.5 w-3.5" />)}
                {renderField('default_province', <MapPin className="h-3.5 w-3.5" />)}
                <div className="pt-2 flex justify-end border-t border-gray-100">
                  <Button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90 rounded-xl font-bold text-xs h-9 gap-1.5 shadow-sm text-white"
                  >
                    {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <Save className="h-3.5 w-3.5" />
                    Lưu thay đổi
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Tab: Thông tin liên hệ ──────────────────────────────────── */}
          {activeTab === 'contact' && (
            <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] rounded-2xl bg-white overflow-hidden">
              <CardHeader className="border-b border-gray-50 bg-gray-50/50 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-[15px] font-bold text-gray-900">Thông tin liên hệ</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Hotline, email và địa chỉ hiển thị trên website cho khách hàng</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {renderField('contact_email', <Mail className="h-3.5 w-3.5" />)}
                {renderField('contact_phone', <Phone className="h-3.5 w-3.5" />)}
                {renderField('contact_address', <MapPin className="h-3.5 w-3.5" />)}
                {renderField('contact_zalo', <LinkIcon className="h-3.5 w-3.5" />)}
                {renderField('contact_facebook', <LinkIcon className="h-3.5 w-3.5" />)}
                <div className="pt-2 flex justify-end border-t border-gray-100">
                  <Button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90 rounded-xl font-bold text-xs h-9 gap-1.5 shadow-sm text-white"
                  >
                    {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <Save className="h-3.5 w-3.5" />
                    Lưu thay đổi
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Tab: Mạng xã hội ────────────────────────────────────────── */}
          {activeTab === 'social' && (
            <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] rounded-2xl bg-white overflow-hidden">
              <CardHeader className="border-b border-gray-50 bg-gray-50/50 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Share2 className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-[15px] font-bold text-gray-900">Mạng xã hội</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Liên kết đến các kênh truyền thông chính thức của hệ thống</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {renderField('social_facebook', <LinkIcon className="h-3.5 w-3.5" />)}
                {renderField('social_youtube', <LinkIcon className="h-3.5 w-3.5" />)}
                {renderField('social_zalo', <LinkIcon className="h-3.5 w-3.5" />)}
                <div className="pt-2 flex justify-end border-t border-gray-100">
                  <Button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90 rounded-xl font-bold text-xs h-9 gap-1.5 shadow-sm text-white"
                  >
                    {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <Save className="h-3.5 w-3.5" />
                    Lưu thay đổi
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Tab: SEO ────────────────────────────────────────────────── */}
          {activeTab === 'seo' && (
            <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] rounded-2xl bg-white overflow-hidden">
              <CardHeader className="border-b border-gray-50 bg-gray-50/50 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <SearchIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-[15px] font-bold text-gray-900">Tối ưu hóa SEO</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Thẻ meta cho trang chủ, hỗ trợ nâng cao xếp hạng tìm kiếm Google</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {renderField('seo_title', <Hash className="h-3.5 w-3.5" />)}
                {renderField('seo_description', <FileText className="h-3.5 w-3.5" />)}
                {renderField('seo_keywords', <Hash className="h-3.5 w-3.5" />)}
                {renderField('og_image', <ImageIcon className="h-3.5 w-3.5" />)}
                <div className="pt-2 flex justify-end border-t border-gray-100">
                  <Button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90 rounded-xl font-bold text-xs h-9 gap-1.5 shadow-sm text-white"
                  >
                    {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <Save className="h-3.5 w-3.5" />
                    Lưu thay đổi
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Tab: Nghiệp vụ ──────────────────────────────────────────── */}
          {activeTab === 'property' && (
            <>
              <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] rounded-2xl bg-white overflow-hidden">
                <CardHeader className="border-b border-gray-50 bg-gray-50/50 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                      <Sliders className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-[15px] font-bold text-gray-900">Cấu hình nghiệp vụ</CardTitle>
                      <CardDescription className="text-xs mt-0.5">Quy định giới hạn và kiểm soát hoạt động đăng tin bất động sản</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  {renderField('property_images_limit', <ImageIcon className="h-3.5 w-3.5" />)}
                  {renderField('property_description_min', <FileText className="h-3.5 w-3.5" />)}
                  {renderField('property_featured_limit', <Sliders className="h-3.5 w-3.5" />)}
                  <div className="pt-2 flex justify-end border-t border-gray-100">
                    <Button
                      onClick={handleSave}
                      disabled={isSubmitting}
                      className="bg-primary hover:bg-primary/90 rounded-xl font-bold text-xs h-9 gap-1.5 shadow-sm text-white"
                    >
                      {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <Save className="h-3.5 w-3.5" />
                      Lưu thay đổi
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Warning notice */}
              <div className="flex gap-3 items-start p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-sm text-yellow-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600" />
                <div>
                  <p className="font-bold text-yellow-900 text-[13px] mb-0.5">Lưu ý quan trọng</p>
                  <p className="text-[12.5px] leading-relaxed font-medium text-yellow-700">
                    Các thông số nghiệp vụ ảnh hưởng trực tiếp đến hiệu năng tải trang và trải nghiệm đăng tin. Admin cần cân nhắc kỹ trước khi chỉnh sửa.
                  </p>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
