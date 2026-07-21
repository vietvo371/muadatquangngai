'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
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
import {
  getPropertyGroup,
  isFieldVisible,
  directionLabel,
  stripFieldsNotInGroup,
  DIRECTION_OPTIONS,
  LEGAL_OPTIONS,
  FURNITURE_OPTIONS,
  PRICE_UNIT_OPTIONS,
} from '@/lib/property-form-config';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Home, 
  DollarSign,
  Loader2
} from 'lucide-react';

// Form data interface
interface PropertyFormData {
  // Step 1: Basic Info & Location
  type: 'sell' | 'rent';
  category_id: string;
  title: string;
  description: string;
  province_id?: number;
  district_id?: number;
  ward_id?: number;
  latitude?: number;
  longitude?: number;
  street: string;
  
  // Step 2: Media
  images: Array<{ url: string; thumbnail?: string; name: string; size: number; isPrimary?: boolean }>;
  
  // Step 3: Details & Pricing
  price: number;
  price_unit: 'total' | 'per_m2' | 'per_month' | 'negotiable';
  price_negotiable: boolean;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  toilets?: number;
  floors?: number;
  direction?: string;
  balcony_direction?: string;
  road_width?: number;
  facade?: number;
  furniture?: string;
  legal?: string;
  features: number[];

  // Step 4: Package
  package_id: string;
}

const STEPS = [
  { title: 'Cơ bản', description: 'Phân loại & Vị trí' },
  { title: 'Hình ảnh', description: 'Tải lên tối đa 10 ảnh' },
  { title: 'Chi tiết', description: 'Giá & Thông số' },
  { title: 'Thanh toán', description: 'Chọn gói đăng tin' },
];

const PACKAGES = [
  { id: 'normal', name: 'Tin Thường', price: 0, duration: 30, color: 'normal' as const, features: ['Hiển thị dưới các tin VIP', 'Tiếp cận người dùng cơ bản', 'Không có huy hiệu nổi bật'] },
  { id: 'vip', name: 'Gói VIP', price: 50000, duration: 30, color: 'vip' as const, features: ['Hiển thị trên tin thường', 'Có huy hiệu VIP vàng', 'Màu sắc khung thẻ nổi bật'] },
  { id: 'vip_plus', name: 'Gói VIP+', price: 100000, duration: 30, color: 'vip_plus' as const, isPopular: true, features: ['Hiển thị trên VIP và tin thường', 'Có huy hiệu VIP+ cam', 'Ảnh đại diện lớn hơn'] },
  { id: 'diamond', name: 'Gói Diamond', price: 200000, duration: 30, color: 'diamond' as const, features: ['Luôn nằm trên cùng trang chủ', 'Huy hiệu Diamond đỏ độc quyền', 'Hỗ trợ đẩy tin 2 lần/ngày', 'Thiết kế thẻ to nhất'] },
];

// Tiện ích được tải từ /api/v2/features theo nhóm BĐS. Trước đây danh sách này hardcode
// id 1-8 kèm tên tự đặt, lệch hẳn với bảng features trong DB (id 1 ghi "Hồ bơi" nhưng
// thực tế là "Có sân vườn") nên tiện ích lưu xuống sai so với thứ người dùng bấm chọn.

export default function DangTinPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [apiCategories, setApiCategories] = useState<Array<{id: number; name: string; type: string}>>([]);
  const [features, setFeatures] = useState<Array<{ id: number; name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PropertyFormData>({
    type: 'sell',
    category_id: '',
    title: '',
    description: '',
    street: '',
    latitude: undefined,
    longitude: undefined,
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
  });

  // Fetch categories from API on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/api/v2/categories');
        const data = res.data?.data || [];
        setApiCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
        toast.error('Không thể tải danh mục');
      }
    };
    loadCategories();
  }, []);

  // Nhóm BĐS suy ra từ danh mục — quyết định trường nào hiển thị (spec mục 11).
  const group = getPropertyGroup(formData.category_id);

  // Tải tiện ích đúng nhóm mỗi khi đổi danh mục.
  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const res = await api.get(`/api/v2/features?group=${group}`);
        setFeatures(res.data?.data || []);
      } catch {
        setFeatures([]);
      }
    };
    loadFeatures();
  }, [group]);

  const updateFormData = (updates: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  /**
   * Đổi danh mục có thể đổi luôn nhóm BĐS. Spec yêu cầu dữ liệu của trường không còn
   * phù hợp phải bị xoá, không được gửi lên backend — vd. chuyển từ nhà riêng sang đất
   * nền thì số phòng ngủ / số tầng / nội thất đã nhập phải biến mất.
   */
  const handleCategoryChange = (categoryId: string) => {
    const nextGroup = getPropertyGroup(categoryId);
    setFormData((prev) => {
      const cleaned = stripFieldsNotInGroup(nextGroup, { ...prev, category_id: categoryId });
      return {
        ...cleaned,
        category_id: categoryId,
        // stripFieldsNotInGroup xoá hẳn key; đưa về giá trị rỗng để input vẫn controlled.
        bedrooms: isFieldVisible(nextGroup, 'bedrooms') ? prev.bedrooms : undefined,
        bathrooms: isFieldVisible(nextGroup, 'bathrooms') ? prev.bathrooms : undefined,
        toilets: isFieldVisible(nextGroup, 'toilets') ? prev.toilets : undefined,
        floors: isFieldVisible(nextGroup, 'floors') ? prev.floors : undefined,
        direction: isFieldVisible(nextGroup, 'direction') ? prev.direction : '',
        balcony_direction: isFieldVisible(nextGroup, 'balcony_direction') ? prev.balcony_direction : '',
        road_width: isFieldVisible(nextGroup, 'road_width') ? prev.road_width : undefined,
        facade: isFieldVisible(nextGroup, 'facade') ? prev.facade : undefined,
        legal: isFieldVisible(nextGroup, 'legal') ? prev.legal : '',
        furniture: isFieldVisible(nextGroup, 'furniture') ? prev.furniture : 'none',
        features: isFieldVisible(nextGroup, 'utilities') ? prev.features : [],
      } as PropertyFormData;
    });
  };

  const toggleFeature = (featureId: number) => {
    const newFeatures = formData.features.includes(featureId)
      ? formData.features.filter(id => id !== featureId)
      : [...formData.features, featureId];
    updateFormData({ features: newFeatures });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // Mô tả tối thiểu 50 ký tự — khớp đúng validate của POST /api/v2/my/properties,
        // nếu để 20 thì user đi hết 4 bước rồi mới bị server từ chối ở bước cuối.
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Build address from available data
      const address = [
        formData.street,
        formData.district_id ? 'Quảng Ngãi' : '',
      ].filter(Boolean).join(', ');

      // Chỉ gửi trường thuộc nhóm BĐS đang chọn — spec yêu cầu không lưu phòng ngủ /
      // số tầng / nội thất cho danh mục đất. Lọc ở cả client lẫn server cho chắc.
      const groupFields = stripFieldsNotInGroup(group, {
        bedrooms: formData.bedrooms || 0,
        bathrooms: formData.bathrooms || 0,
        toilets: formData.toilets,
        floors: formData.floors || undefined,
        direction: formData.direction || undefined,
        balcony_direction: formData.balcony_direction || undefined,
        road_width: formData.road_width,
        facade: formData.facade,
        furniture: formData.furniture || 'none',
        legal: formData.legal || undefined,
        utilities: undefined, // chỉ là cờ hiển thị, gửi qua feature_ids bên dưới
      });
      delete groupFields.utilities;

      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category_id: parseInt(formData.category_id, 10),
        price: formData.price,
        price_unit: formData.price_unit,
        price_negotiable: formData.price_negotiable || formData.price_unit === 'negotiable',
        area: formData.area,
        ...groupFields,
        province_id: formData.province_id,
        district_id: formData.district_id,
        ward_id: formData.ward_id || undefined,
        latitude: formData.latitude ?? undefined,
        longitude: formData.longitude ?? undefined,
        street: formData.street || undefined,
        address: address || formData.street || 'Việt Nam',
        feature_ids:
          isFieldVisible(group, 'utilities') && formData.features.length > 0
            ? formData.features
            : undefined,
        // Ảnh đã upload sẵn lên Cloudinary ở bước 2 — chỉ gửi URL để API ghi vào
        // property_media. Thiếu mảng này thì ảnh người dùng tải lên bị mất trắng.
        images: formData.images.map((img, i) => ({
          url: img.url,
          thumbnail: img.thumbnail,
          is_primary: img.isPrimary ?? i === 0,
          sort_order: i,
        })),
      };

      const response = await api.post('/api/v2/my/properties', payload);

      if (response.data?.success || response.status === 201) {
        toast.success('Đăng tin thành công!', {
          description: 'Tin của bạn đã được gửi và đang chờ phê duyệt.',
        });
        router.push('/dashboard/quan-ly-tin');
      } else {
        throw new Error(response.data?.message || 'Đăng tin thất bại');
      }
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const message = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi đăng tin';
      
      if (errors) {
        // Join all validation error messages
        const errorMessages = Object.values(errors).flat() as string[];
        toast.error('Vui lòng kiểm tra lại thông tin', {
          description: errorMessages.join(', '),
        });
      } else {
        toast.error('Đăng tin thất bại', {
          description: message,
        });
      }
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-2">
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Đăng tin bất động sản</h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">Điền đầy đủ thông tin để thu hút khách hàng tốt nhất</p>
      </div>

      <PostStepper currentStep={currentStep} steps={STEPS} />

      <Card className="border-0 shadow-xl shadow-gray-200/40 rounded-2xl overflow-hidden">
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
                      onClick={() => updateFormData({ type: 'sell', category_id: '' })}
                      className={`flex flex-col items-center justify-center p-5 border-2 rounded-xl transition-all duration-300 ${
                        formData.type === 'sell'
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
                    onValueChange={(value) => handleCategoryChange(value || '')}
                  >
                    <SelectTrigger className="mt-2 h-12 bg-gray-50 border-gray-200 focus:ring-primary focus:border-primary">
                      <SelectValue placeholder="-- Chọn phân khúc --" />
                    </SelectTrigger>
                    <SelectContent>
                      {apiCategories
                        .filter(c => c.type === formData.type)
                        .map(cat => (
                          <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                        ))
                      }
                      {apiCategories.filter(c => c.type === formData.type).length === 0 && (
                        <div className="px-3 py-6 text-center text-sm text-gray-400">
                          Đang tải danh mục...
                        </div>
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
                  <div className="flex justify-between items-center mt-1.5">
                    <p className="text-xs text-gray-500">Tối thiểu 50 ký tự</p>
                    <p className={`text-xs font-medium ${formData.description.length < 50 ? 'text-gray-400' : 'text-green-600'}`}>
                      {formData.description.length}/50
                    </p>
                  </div>
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
              
              <div className="bg-[#e8f4fb]/50 border border-[#1075b1]/15 rounded-xl p-4 mb-6">
                <ul className="text-[13px] text-[#1075b1] space-y-1.5 list-disc list-inside">
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
                        onValueChange={(value) => updateFormData({ price_unit: value as any })}
                      >
                        <SelectTrigger className="w-32 rounded-l-none h-12 bg-gray-100 border-l-0 font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRICE_UNIT_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
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

              {/* Thông tin chi tiết — trường hiển thị phụ thuộc nhóm BĐS (spec mục 11.2).
                  Nhóm đất không có phòng ngủ/phòng tắm/số tầng/hướng ban công/nội thất. */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b">Thông tin chi tiết</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
                  {isFieldVisible(group, 'bedrooms') && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phòng ngủ</Label>
                      <Select
                        value={String(formData.bedrooms ?? 0)}
                        onValueChange={(value) => updateFormData({ bedrooms: parseInt(value || '0') })}
                      >
                        <SelectTrigger className="mt-2 h-11 bg-gray-50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Không có</SelectItem>
                          {[1,2,3,4,5,6,7,8,9,10].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {isFieldVisible(group, 'bathrooms') && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phòng tắm</Label>
                      <Select
                        value={String(formData.bathrooms ?? 0)}
                        onValueChange={(value) => updateFormData({ bathrooms: parseInt(value || '0') })}
                      >
                        <SelectTrigger className="mt-2 h-11 bg-gray-50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Không có</SelectItem>
                          {[1,2,3,4,5,6,7,8].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {isFieldVisible(group, 'toilets') && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nhà vệ sinh</Label>
                      <Select
                        value={String(formData.toilets ?? 0)}
                        onValueChange={(value) => updateFormData({ toilets: parseInt(value || '0') })}
                      >
                        <SelectTrigger className="mt-2 h-11 bg-gray-50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Không có</SelectItem>
                          {[1,2,3,4,5,6,7,8].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {isFieldVisible(group, 'floors') && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Số tầng</Label>
                      <Select
                        value={String(formData.floors ?? 0)}
                        onValueChange={(value) => updateFormData({ floors: parseInt(value || '0') })}
                      >
                        <SelectTrigger className="mt-2 h-11 bg-gray-50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Không xác định</SelectItem>
                          {[1,2,3,4,5,6,7,8,9,10].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {isFieldVisible(group, 'direction') && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">{directionLabel(group)}</Label>
                      <Select
                        value={formData.direction || ''}
                        onValueChange={(value) => updateFormData({ direction: value || '' })}
                      >
                        <SelectTrigger className="mt-2 h-11 bg-gray-50">
                          <SelectValue placeholder="Tùy chọn">
                            {(v: string) => DIRECTION_OPTIONS.find(o => o.value === v)?.label ?? 'Tùy chọn'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {DIRECTION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {isFieldVisible(group, 'balcony_direction') && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Hướng ban công</Label>
                      <Select
                        value={formData.balcony_direction || ''}
                        onValueChange={(value) => updateFormData({ balcony_direction: value || '' })}
                      >
                        <SelectTrigger className="mt-2 h-11 bg-gray-50">
                          <SelectValue placeholder="Tùy chọn">
                            {(v: string) => DIRECTION_OPTIONS.find(o => o.value === v)?.label ?? 'Tùy chọn'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {DIRECTION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {isFieldVisible(group, 'road_width') && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Đường vào (m)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        value={formData.road_width ?? ''}
                        onChange={(e) => updateFormData({ road_width: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                        placeholder="VD: 5"
                        className="mt-2 h-11 bg-gray-50"
                      />
                    </div>
                  )}

                  {isFieldVisible(group, 'facade') && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Mặt tiền (m)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        value={formData.facade ?? ''}
                        onChange={(e) => updateFormData({ facade: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                        placeholder="VD: 4.5"
                        className="mt-2 h-11 bg-gray-50"
                      />
                    </div>
                  )}

                  {isFieldVisible(group, 'legal') && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Pháp lý</Label>
                      <Select
                        value={formData.legal || ''}
                        onValueChange={(value) => updateFormData({ legal: value || '' })}
                      >
                        <SelectTrigger className="mt-2 h-11 bg-gray-50">
                          <SelectValue placeholder="Tùy chọn">
                            {(v: string) => LEGAL_OPTIONS.find(o => o.value === v)?.label ?? 'Tùy chọn'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {LEGAL_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {isFieldVisible(group, 'furniture') && (
                  <div className="mb-6">
                    <Label className="font-semibold text-gray-700">Tình trạng nội thất</Label>
                    <Select
                      value={formData.furniture || 'none'}
                      onValueChange={(value) => updateFormData({ furniture: value || '' })}
                    >
                      <SelectTrigger className="mt-2 h-11 bg-gray-50 w-full md:w-1/2">
                        <SelectValue>
                          {(v: string) => FURNITURE_OPTIONS.find(o => o.value === v)?.label ?? 'Chọn tình trạng'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {FURNITURE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </section>

              {isFieldVisible(group, 'utilities') && (
                <section>
                  <h3 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b">Tiện ích kèm theo</h3>
                  {features.length === 0 ? (
                    <p className="text-sm text-gray-400">Đang tải tiện ích...</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-2">
                      {features.map((feature) => (
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
                  )}
                </section>
              )}
            </div>
          )}

          {/* Step 4: Packages */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold text-gray-900 mb-2 pb-2 border-b text-center">Chọn gói đăng tin</h3>
              <p className="text-center text-gray-500 text-sm mb-2">Tin đăng sẽ được kiểm duyệt trong vòng 24h.</p>
              <p className="text-center text-gray-400 text-[13px] mb-8">
                Các gói trả phí đang được hoàn thiện — hiện tại tin đăng miễn phí với gói Tin Thường.
              </p>
              
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
                    color={pkg.color}
                    comingSoon={pkg.price > 0}
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
                Đăng tin ngay
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
