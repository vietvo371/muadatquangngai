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
  Upload,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { settingAdminApi, fileUploadApi, type AdminSetting } from '@/lib/admin-api';

// Component hỗ trợ tải ảnh lên cho các trường logo, favicon, og_image
function ImageUploadField({
  id,
  label,
  value,
  description,
  icon,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
  onChange: (val: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp tin hình ảnh (.jpg, .png, .gif, .webp)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 5MB');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Đang tải ảnh lên hệ thống...');
    try {
      const res = await fileUploadApi.upload(file);
      if (res && res.url) {
        onChange(res.url);
        toast.success('Tải ảnh lên thành công!', { id: toastId });
      } else {
        toast.error('Không nhận được đường dẫn ảnh từ hệ thống', { id: toastId });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh lên', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success('Đã sao chép đường dẫn ảnh');
    setTimeout(() => setCopied(false), 2000);
  };

  const isFavicon = id.includes('favicon');
  const isLogo = id.includes('logo');
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5">
          {icon && <span className="text-gray-400">{icon}</span>}
          {label}
        </Label>
        <span className="text-[9.5px] font-mono text-gray-300 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded select-none">
          {id}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/30">
        {/* Vùng xem trước ảnh (Preview) */}
        <div className={`relative flex items-center justify-center shrink-0 border border-gray-100 rounded-xl bg-white overflow-hidden ${
          isFavicon ? 'w-16 h-16' : isLogo ? 'w-36 h-16' : 'w-32 h-20'
        }`}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt={label}
              className={`object-contain max-w-full max-h-full ${isFavicon ? 'p-1' : 'p-2'}`}
            />
          ) : (
            <div className="text-gray-300 flex flex-col items-center gap-1">
              <ImageIcon className="h-5 w-5" />
              <span className="text-[10px]">Chưa có ảnh</span>
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Các nút hành động và ô nhập link */}
        <div className="flex-1 space-y-3 flex flex-col justify-center">
          <div className="flex flex-wrap gap-2">
            <label className={`cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl font-bold text-xs h-9 px-3.5 transition-all ${
              isUploading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'border border-primary text-primary hover:bg-primary-light bg-white shadow-sm'
            }`}>
              <Upload className="h-3.5 w-3.5" />
              Tải ảnh lên
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            
            {value && (
              <>
                <Button
                  type="button"
                  onClick={handleCopy}
                  variant="outline"
                  className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 text-xs h-9 px-3 gap-1.5 bg-white"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  Sao chép URL
                </Button>
                <Button
                  type="button"
                  onClick={() => onChange('')}
                  variant="outline"
                  className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 text-xs h-9 px-3 gap-1.5 bg-white"
                >
                  <X className="h-3.5 w-3.5" />
                  Xóa
                </Button>
              </>
            )}
          </div>

          <div className="relative">
            <Input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Hoặc nhập đường dẫn ảnh trực tiếp..."
              className="h-8.5 rounded-lg border-gray-200 bg-white text-xs pr-8 text-gray-500 focus-visible:ring-primary/20 focus-visible:border-primary"
            />
            {value && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-2 w-2 rounded-full bg-green-500" />
            )}
          </div>
        </div>
      </div>

      {description && (
        <p className="text-[11.5px] text-gray-400 leading-relaxed">{description}</p>
      )}
    </div>
  );
}

const TAB_LIST = [
  { id: 'general', label: 'Cài đặt chung', icon: Globe },
  { id: 'contact', label: 'Thông tin liên hệ', icon: Mail },
  { id: 'social', label: 'Mạng xã hội', icon: Share2 },
  { id: 'seo', label: 'Tối ưu SEO', icon: SearchIcon },
  { id: 'property', label: 'Nghiệp vụ', icon: Sliders },
];

export default function SettingsClient() {
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
    const isImage = meta.type === 'image' || key === 'site_logo' || key === 'site_favicon' || key === 'og_image';

    if (isImage) {
      return (
        <ImageUploadField
          key={key}
          id={key}
          label={meta.label}
          value={value}
          description={meta.description}
          icon={icon}
          onChange={(val) => handleInputChange(key, val)}
        />
      );
    }

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
