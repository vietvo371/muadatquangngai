'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LocationSelect } from '@/components/shared/LocationSelect';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { PostStepper } from '@/components/dashboard/PostStepper';
import { PackageCard } from '@/components/dashboard/PackageCard';
import { toast } from 'sonner';
import api from '@/lib/axios';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Home,
  DollarSign,
  Loader2,
  ChevronLeft,
  Save,
  Eye,
} from 'lucide-react';

// Direction mapping: Vietnamese → API slug
const DIRECTION_MAP: Record<string, string> = {
  'Đông': 'dong',
  'Tây': 'tay',
  'Nam': 'nam',
  'Bắc': 'bac',
  'Đông Bắc': 'dong_bac',
  'Đông Nam': 'dong_nam',
  'Tây Bắc': 'tay_bac',
  'Tây Nam': 'tay_nam',
};

// Reverse direction mapping: API slug → Vietnamese
const REVERSE_DIRECTION_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(DIRECTION_MAP).map(([k, v]) => [v, k])
);

// Form data interface
interface PropertyFormData {
  type: 'sale' | 'rent';
  category_id: string;
  title: string;
  description: string;
  province_id?: number;
  district_id?: number;
  ward_id?: number;
  latitude?: number;
  longitude?: number;
  street: string;

  images: Array<{ url: string; name: string; size: number; isPrimary?: boolean }>;

  price: number;
  price_unit: 'total' | 'per_m2' | 'per_month';
  price_negotiable: boolean;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  direction?: string;
  furniture?: string;
  legal?: string;
  features: number[];

  package_id: string;
}

const STEPS = [
  { title: 'Cơ bản', description: 'Phân loại & Vị trí' },
  { title: 'Hình ảnh', description: 'Tải lên tối đa 10 ảnh' },
  { title: 'Chi tiết', description: 'Giá & Thông số' },
  { title: 'Gói tin', description: 'Cập nhật gói hiển thị' },
];

const PACKAGES = [
  { id: 'normal', name: 'Tin Thường', price: 0, duration: 30, features: ['Hiển thị dưới các tin VIP', 'Tiếp cận người dùng cơ bản', 'Không có huy hiệu nổi bật'] },
  { id: 'vip', name: 'Gói VIP', price: 50000, duration: 30, features: ['Hiển thị trên tin thường', 'Có huy hiệu VIP vàng', 'Màu sắc khung thẻ nổi bật'] },
  { id: 'vip_plus', name: 'Gói VIP+', price: 100000, duration: 30, isPopular: true, features: ['Hiển thị trên VIP và tin thường', 'Có huy hiệu VIP+ cam', 'Ảnh đại diện lớn hơn'] },
  { id: 'diamond', name: 'Gói Diamond', price: 200000, duration: 30, features: ['Luôn nằm trên cùng trang chủ', 'Huy hiệu Diamond đỏ độc quyền', 'Hỗ trợ đẩy tin 2 lần/ngày', 'Thiết kế thẻ to nhất'] },
];

const featuresList = [
  { id: 1, name: 'Hồ bơi' },
  { id: 2, name: 'Gym' },
  { id: 3, name: 'Bảo vệ 24/7' },
  { id: 4, name: 'Camera' },
  { id: 5, name: 'Thang máy' },
  { id: 6, name: 'Điều hòa' },
  { id: 7, name: 'Nội thất đầy đủ' },
  { id: 8, name: 'Chỗ để xe' },
];

const emptyFormData: PropertyFormData = {
  type: 'sale',
  category_id: '',
  title: '',
  description: '',
  province_id: undefined,
  district_id: undefined,
  ward_id: undefined,
  latitude: undefined,
  longitude: undefined,
  street: '',
  images: [],
  price: 0,
  price_unit: 'total',
  price_negotiable: false,
  area: 0,
  bedrooms: 0,
  bathrooms: 0,
  direction: '',
  furniture: 'none',
  legal: '',
  features: [],
  package_id: 'normal',
};

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams?.id;
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiCategories, setApiCategories] = useState<Array<{ id: number; name: string; type: string }>>([]);
  const [formData, setFormData] = useState<PropertyFormData>(emptyFormData);
  const [propertySlug, setPropertySlug] = useState<string>('');

  const updateFormData = (updates: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const toggleFeature = (featureId: number) => {
    const newFeatures = formData.features.includes(featureId)
      ? formData.features.filter(id => id !== featureId)
      : [...formData.features, featureId];
    updateFormData({ features: newFeatures });
  };

  // Fetch categories
  useEffect(() => {
    api.get('/categories')
      .then(res => {
        const data = res.data?.data ?? res.data ?? [];
        setApiCategories(data);
      })
      .catch(() => toast.error('Không thể tải danh mục'));
  }, []);

  // Fetch property data
  useEffect(() => {
    const propertyId = id;
    if (!propertyId) return;

    setIsLoading(true);
    api.get(`/my/properties/${propertyId}`)
      .then(res => {
        const data = res.data?.data ?? res.data;
        if (!data) throw new Error('Không có dữ liệu');

        setPropertySlug(data.slug || '');

        setFormData({
          type: data.type || 'sale',
          category_id: String(data.category?.id ?? ''),
          title: data.title || '',
          description: data.description || '',
          province_id: data.location?.province?.id,
          district_id: data.location?.district?.id,
          ward_id: data.location?.ward?.id,
          latitude: data.location?.latitude ?? undefined,
          longitude: data.location?.longitude ?? undefined,
          street: data.street || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          images: (data.media ?? []).map((m: any) => ({
            url: m.url || m.thumbnail || '',
            name: m.name || 'image',
            size: m.size || 0,
            isPrimary: m.is_primary ?? false,
          })),
          price: data.price ?? 0,
          price_unit: data.price_unit || 'total',
          price_negotiable: data.price_negotiable ?? false,
          area: data.area ?? 0,
          bedrooms: data.bedrooms ?? 0,
          bathrooms: data.bathrooms ?? 0,
          direction: REVERSE_DIRECTION_MAP[data.direction] || data.direction || '',
          furniture: data.furniture || 'none',
          legal: data.legal || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          features: (data.features ?? []).map((f: any) => f.id ?? f),
          package_id: data.is_vip === 'diamond' ? 'diamond'
            : data.is_vip === 'vip_plus' ? 'vip_plus'
            : data.is_vip === 'vip' ? 'vip'
            : 'normal',
        });
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || 'Không thể tải thông tin tin đăng';
        toast.error(msg);
        router.push('/dashboard/quan-ly-tin');
      })
      .finally(() => setIsLoading(false));
  }, [id, router]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.type && formData.category_id && formData.title.length >= 10 && formData.description.length >= 50 && formData.province_id && formData.district_id;
      case 2:
        return formData.images.length > 0;
      case 3:
        return formData.price > 0 && formData.area > 0;
      case 4:
        return !!formData.package_id;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const buildPayload = () => {
    const address = [
      formData.street,
      formData.district_id ? 'Quảng Ngãi' : '',
    ].filter(Boolean).join(', ');

    return {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      category_id: parseInt(formData.category_id, 10),
      price: formData.price,
      price_unit: formData.price_unit,
      price_negotiable: formData.price_negotiable,
      area: formData.area,
      bedrooms: formData.bedrooms || 0,
      bathrooms: formData.bathrooms || 0,
      direction: DIRECTION_MAP[formData.direction || ''] || formData.direction || undefined,
      furniture: formData.furniture || 'none',
      legal: formData.legal || undefined,
      province_id: formData.province_id,
      district_id: formData.district_id,
      ward_id: formData.ward_id || undefined,
      street: formData.street || undefined,
      address: address || formData.street || 'Việt Nam',
      latitude: formData.latitude ?? undefined,
      longitude: formData.longitude ?? undefined,
      feature_ids: formData.features.length > 0 ? formData.features : undefined,
      is_vip: formData.package_id === 'normal' ? undefined : formData.package_id,
    };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      await api.put(`/properties/${id}`, payload);
      toast.success('Cập nhật tin đăng thành công!');
      router.push('/dashboard/quan-ly-tin');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errData = error?.response?.data;
      if (errData?.errors) {
        const messages = Object.values(errData.errors).flat().join('\n');
        toast.error(messages);
      } else {
        toast.error(errData?.message || 'Lỗi khi cập nhật tin đăng');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      await api.put(`/properties/${id}`, payload);
      toast.success('Đã lưu thay đổi thành công!');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errData = error?.response?.data;
      if (errData?.errors) {
        const messages = Object.values(errData.errors).flat().join('\n');
        toast.error(messages);
      } else {
        toast.error(errData?.message || 'Lỗi khi lưu thay đổi');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-gray-500 font-medium">Đang tải thông tin tin đăng...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/quan-ly-tin">
            <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 border-gray-200 text-gray-500 hover:bg-gray-50">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Sửa tin đăng</h1>
            <p className="text-gray-500 text-[13px] mt-0.5">Cập nhật thông tin chi tiết của bất động sản</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting} className="h-10 px-4 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">
            <Save className="h-4 w-4 mr-2" />
            Lưu thay đổi
          </Button>
          {propertySlug && (
            <Link href={`/mua-ban/${propertySlug}`} target="_blank">
              <Button variant="outline" className="h-10 px-4 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">
                <Eye className="h-4 w-4 mr-2" />
                Xem trước
              </Button>
            </Link>
          )}
        </div>
      </div>

      <PostStepper currentStep={currentStep} steps={STEPS} />

      <Card className="border-0 shadow-xl shadow-gray-200/40 rounded-2xl overflow-hidden mt-6 bg-white">
        <CardContent className="p-6 sm:p-8">

          {/* Step 1: Basic Info & Location */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b">Thông tin cơ bản</h3>

                <div className="mb-6">
                  <Label className="mb-3 block font-semibold text-gray-700">Loại tin đăng</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => updateFormData({ type: 'sale', category_id: '' })}
                      className={`flex flex-col items-center justify-center p-5 border-2 rounded-xl transition-all duration-300 ${
                        formData.type === 'sale'
                          ? 'border-primary bg-primary-light text-primary shadow-sm scale-[1.02]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Home className="h-7 w-7 mb-2" />
                      <p className="font-bold">Mua bán</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFormData({ type: 'rent', category_id: '' })}
                      className={`flex flex-col items-center justify-center p-5 border-2 rounded-xl transition-all duration-300 ${
                        formData.type === 'rent'
                          ? 'border-[#e03131] bg-red-50 text-[#e03131] shadow-sm scale-[1.02]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <DollarSign className="h-7 w-7 mb-2" />
                      <p className="font-bold">Cho thuê</p>
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <Label className="font-semibold text-gray-700">Danh mục <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => updateFormData({ category_id: value || '' })}
                  >
                    <SelectTrigger className="mt-2 h-12 bg-gray-50 border-gray-200 focus:ring-primary focus:border-primary">
                      <SelectValue placeholder="-- Chọn phân khúc --" />
                    </SelectTrigger>
                    <SelectContent>
                      {apiCategories.length === 0 ? (
                        <SelectItem value="loading" disabled>Đang tải danh mục...</SelectItem>
                      ) : (
                        apiCategories
                          .filter(c => c.type === formData.type)
                          .map(cat => (
                            <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mb-6">
                  <Label className="font-semibold text-gray-700">Tiêu đề tin đăng <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="VD: Căn hộ chung cư mini cho thuê 35m2 đầy đủ nội thất..."
                    className="mt-2 h-12 bg-gray-50 border-gray-200 focus:ring-primary focus:border-primary"
                  />
                  <div className="flex justify-between mt-2">
                    <p className="text-xs text-gray-500">Tối thiểu 10 ký tự</p>
                    <p className="text-xs font-medium text-gray-500">{formData.title.length}/99</p>
                  </div>
                </div>

                <div>
                  <Label className="font-semibold text-gray-700">Mô tả chi tiết <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    placeholder="Giới thiệu chi tiết về diện tích, tiện ích, vị trí, tình trạng pháp lý..."
                    rows={7}
                    className="mt-2 bg-gray-50 border-gray-200 focus:ring-primary focus:border-primary resize-none"
                  />
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b">Địa chỉ bất động sản</h3>
                <LocationSelect
                  value={{
                    province_id: formData.province_id,
                    district_id: formData.district_id,
                    ward_id: formData.ward_id,
                  }}
                  onChange={(location) => updateFormData({
                    province_id: location.province_id,
                    district_id: location.district_id,
                    ward_id: location.ward_id,
                    latitude: location.latitude,
                    longitude: location.longitude,
                  })}
                  required
                />
                <div className="mt-5">
                  <Label className="font-semibold text-gray-700">Địa chỉ cụ thể (Số nhà, đường)</Label>
                  <Input
                    value={formData.street}
                    onChange={(e) => updateFormData({ street: e.target.value })}
                    placeholder="VD: 123 Đường Trần Phú..."
                    className="mt-2 h-12 bg-gray-50 border-gray-200 focus:ring-primary focus:border-primary"
                  />
                </div>
              </section>
            </div>
          )}

          {/* Step 2: Images */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold text-gray-900 mb-2 pb-2 border-b">Hình ảnh & Video</h3>

              <div className="bg-[#e8f4fb] border border-primary/20 rounded-xl p-4 mb-6">
                <ul className="text-[13px] text-primary space-y-1.5 list-disc list-inside">
                  <li>Tải lên tối thiểu <strong>1 ảnh</strong>, tối đa <strong>10 ảnh</strong>.</li>
                  <li>Kéo thả ảnh để thay đổi thứ tự. Ảnh đầu tiên sẽ là ảnh bìa.</li>
                  <li>Hạn chế ảnh có chứa logo, watermark của các nền tảng khác.</li>
                </ul>
              </div>

              <ImageUploader
                files={formData.images}
                onChange={(images) => updateFormData({ images })}
                maxFiles={10}
                maxSize={10}
              />
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b">Mức giá & Diện tích</h3>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label className="font-semibold text-gray-700">Mức giá <span className="text-red-500">*</span></Label>
                    <div className="flex mt-2 shadow-sm rounded-lg overflow-hidden">
                      <Input
                        type="number"
                        value={formData.price || ''}
                        onChange={(e) => updateFormData({ price: parseInt(e.target.value) || 0 })}
                        placeholder="VD: 2000000000"
                        className="flex-1 rounded-r-none border-r-0 h-12 bg-gray-50 focus:bg-white"
                      />
                      <Select
                        value={formData.price_unit}
                        onValueChange={(value) => updateFormData({ price_unit: value as 'total' | 'per_m2' | 'per_month' })}
                      >
                        <SelectTrigger className="w-32 rounded-l-none h-12 bg-gray-100 border-l-0 font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="total">Tổng giá</SelectItem>
                          <SelectItem value="per_m2">/ m²</SelectItem>
                          <SelectItem value="per_month">/ tháng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="mt-3 flex items-center">
                      <Checkbox
                        id="negotiable"
                        checked={formData.price_negotiable}
                        onCheckedChange={(checked) => updateFormData({ price_negotiable: !!checked })}
                      />
                      <Label htmlFor="negotiable" className="ml-2 cursor-pointer text-sm font-medium text-gray-700">
                        Giá có thể thương lượng
                      </Label>
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold text-gray-700">Diện tích <span className="text-red-500">*</span></Label>
                    <div className="relative mt-2 shadow-sm rounded-lg overflow-hidden">
                      <Input
                        type="number"
                        value={formData.area || ''}
                        onChange={(e) => updateFormData({ area: parseInt(e.target.value) || 0 })}
                        placeholder="VD: 75"
                        className="h-12 bg-gray-50 focus:bg-white pr-12"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">m²</span>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b">Thông tin chi tiết</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phòng ngủ</Label>
                    <Select
                      value={String(formData.bedrooms || 0)}
                      onValueChange={(value) => updateFormData({ bedrooms: parseInt(value || '0') })}
                    >
                      <SelectTrigger className="mt-2 h-11 bg-gray-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Không có</SelectItem>
                        {[1,2,3,4,5,6].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phòng tắm</Label>
                    <Select
                      value={String(formData.bathrooms || 0)}
                      onValueChange={(value) => updateFormData({ bathrooms: parseInt(value || '0') })}
                    >
                      <SelectTrigger className="mt-2 h-11 bg-gray-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Không có</SelectItem>
                        {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Hướng nhà</Label>
                    <Select
                      value={formData.direction || ''}
                      onValueChange={(value) => updateFormData({ direction: value || '' })}
                    >
                      <SelectTrigger className="mt-2 h-11 bg-gray-50">
                        <SelectValue placeholder="Tùy chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Bắc', 'Đông Nam', 'Tây Bắc', 'Tây Nam'].map(dir => (
                          <SelectItem key={dir} value={dir}>{dir}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Pháp lý</Label>
                    <Select
                      value={formData.legal || ''}
                      onValueChange={(value) => updateFormData({ legal: value || '' })}
                    >
                      <SelectTrigger className="mt-2 h-11 bg-gray-50">
                        <SelectValue placeholder="Tùy chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="so_do">Sổ đỏ</SelectItem>
                        <SelectItem value="so_hong">Sổ hồng</SelectItem>
                        <SelectItem value="contract">Hợp đồng mua bán</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mb-6">
                  <Label className="font-semibold text-gray-700">Tình trạng nội thất</Label>
                  <Select
                    value={formData.furniture || 'none'}
                    onValueChange={(value) => updateFormData({ furniture: value || '' })}
                  >
                    <SelectTrigger className="mt-2 h-11 bg-gray-50 w-full md:w-1/2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không nội thất (Nhà trống)</SelectItem>
                      <SelectItem value="basic">Nội thất cơ bản (Liền tường)</SelectItem>
                      <SelectItem value="full">Nội thất đầy đủ (Full option)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b">Tiện ích kèm theo</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-2">
                  {featuresList.map((feature) => (
                    <div key={feature.id} className="flex items-center gap-2.5">
                      <Checkbox
                        id={`feature-${feature.id}`}
                        checked={formData.features.includes(feature.id)}
                        onCheckedChange={() => toggleFeature(feature.id)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Label htmlFor={`feature-${feature.id}`} className="cursor-pointer text-[14px] text-gray-700">
                        {feature.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Step 4: Packages */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold text-gray-900 mb-2 pb-2 border-b text-center">Gói hiển thị tin đăng</h3>
              <p className="text-center text-gray-500 text-sm mb-8">Tin đăng sẽ được cập nhật hiển thị ngay lập tức sau khi bạn xác nhận.</p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PACKAGES.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    id={pkg.id}
                    name={pkg.name}
                    price={pkg.price}
                    duration={pkg.duration}
                    features={pkg.features}
                    isPopular={pkg.isPopular}
                    color={pkg.id as 'normal' | 'vip' | 'vip_plus' | 'diamond'}
                    selected={formData.package_id === pkg.id}
                    onSelect={(id) => updateFormData({ package_id: id })}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1 || isSubmitting}
          className="gap-2 h-11 px-6 border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>

        {currentStep < 4 ? (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="gap-2 h-11 px-6 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl transition-all"
          >
            Tiếp tục
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
            className="gap-2 h-11 px-8 bg-cta hover:bg-cta-dark text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Cập nhật tin ngay
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
