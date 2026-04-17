'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LocationSelect } from '@/components/shared/LocationSelect';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Home, 
  MapPin, 
  Image, 
  DollarSign,
  Loader2
} from 'lucide-react';

// Form data interface
interface PropertyFormData {
  // Step 1: Basic Info
  type: 'sale' | 'rent';
  category_id: string;
  title: string;
  description: string;
  
  // Step 2: Location
  province_id?: number;
  district_id?: number;
  ward_id?: number;
  street: string;
  
  // Step 3: Media
  images: Array<{ url: string; name: string; size: number; isPrimary?: boolean }>;
  
  // Step 4: Pricing & Details
  price: number;
  price_unit: 'total' | 'per_m2' | 'per_month';
  price_negotiable: boolean;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  direction?: string;
  furniture?: string;
  legal?: string;
  features: number[];
}

const steps = [
  { id: 1, name: 'Thông tin cơ bản', icon: Home },
  { id: 2, name: 'Địa điểm', icon: MapPin },
  { id: 3, name: 'Hình ảnh', icon: Image },
  { id: 4, name: 'Giá & Chi tiết', icon: DollarSign },
];

const categories = [
  { id: 'nha-dat', name: 'Nhà đất', type: 'sale' },
  { id: 'can-ho', name: 'Căn hộ', type: 'sale' },
  { id: 'dat-nen', name: 'Đất nền', type: 'sale' },
  { id: 'nha-cho-thue', name: 'Nhà cho thuê', type: 'rent' },
  { id: 'can-ho-cho-thue', name: 'Căn hộ cho thuê', type: 'rent' },
  { id: 'van-phong', name: 'Văn phòng', type: 'rent' },
];

const features = [
  { id: 1, name: 'Hồ bơi' },
  { id: 2, name: 'Gym' },
  { id: 3, name: 'Bảo vệ 24/7' },
  { id: 4, name: 'Camera' },
  { id: 5, name: 'Thang máy' },
  { id: 6, name: 'Điều hòa' },
  { id: 7, name: 'Nội thất đầy đủ' },
  { id: 8, name: 'Chỗ để xe' },
];

export default function DangTinPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PropertyFormData>({
    type: 'sale',
    category_id: '',
    title: '',
    description: '',
    street: '',
    images: [],
    price: 0,
    price_unit: 'total',
    price_negotiable: false,
    area: 0,
    bedrooms: 0,
    bathrooms: 0,
    floors: 1,
    direction: '',
    furniture: 'none',
    legal: '',
    features: [],
  });

  const updateFormData = (updates: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.type && formData.category_id && formData.title.length >= 10 && formData.description.length >= 20;
      case 2:
        return formData.province_id && formData.district_id && formData.street;
      case 3:
        return formData.images.length > 0;
      case 4:
        return formData.price > 0 && formData.area > 0;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // TODO: Call API to create property
      // const response = await createProperty(formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to manage page
      router.push('/dashboard/quan-ly-tin');
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFeature = (featureId: number) => {
    const newFeatures = formData.features.includes(featureId)
      ? formData.features.filter(id => id !== featureId)
      : [...formData.features, featureId];
    updateFormData({ features: newFeatures });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Đăng tin mới</h1>
        <p className="text-gray-500">Điền thông tin để đăng tin bất động sản của bạn</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${
                    isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-full h-1 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                    style={{ minWidth: '60px', maxWidth: '120px' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Steps */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
                
                {/* Type */}
                <div className="mb-6">
                  <Label className="mb-2 block">Loại tin đăng</Label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => updateFormData({ type: 'sale', category_id: '' })}
                      className={`flex-1 p-4 border-2 rounded-lg text-center transition-colors ${
                        formData.type === 'sale'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Home className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-semibold">Mua bán</p>
                      <p className="text-sm text-gray-500">Bán nhà, đất, căn hộ</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFormData({ type: 'rent', category_id: '' })}
                      className={`flex-1 p-4 border-2 rounded-lg text-center transition-colors ${
                        formData.type === 'rent'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <DollarSign className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-semibold">Cho thuê</p>
                      <p className="text-sm text-gray-500">Thuê nhà, căn hộ</p>
                    </button>
                  </div>
                </div>

                {/* Category */}
                <div className="mb-6">
                  <Label>Danh mục</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => updateFormData({ category_id: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter(c => c.type === formData.type)
                        .map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="mb-6">
                  <Label>Tiêu đề</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="VD: Căn hộ cao cấp 2PN view biển Mỹ Khê"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Tối thiểu 10 ký tự ({formData.title.length}/10)
                  </p>
                </div>

                {/* Description */}
                <div>
                  <Label>Mô tả chi tiết</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    placeholder="Mô tả chi tiết về bất động sản của bạn..."
                    rows={6}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Tối thiểu 20 ký tự ({formData.description.length}/20)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Địa điểm</h3>
                
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
                  })}
                  required
                />

                <div className="mt-4">
                  <Label>Địa chỉ cụ thể</Label>
                  <Input
                    value={formData.street}
                    onChange={(e) => updateFormData({ street: e.target.value })}
                    placeholder="VD: 123 Đường Võ Nguyên Giáp"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Images */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh</h3>
                
                <ImageUploader
                  files={formData.images}
                  onChange={(images) => updateFormData({ images })}
                  maxFiles={10}
                  maxSize={10}
                />

                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Lưu ý:</strong>
                    <ul className="list-disc list-inside mt-1">
                      <li>Tải lên tối thiểu 1 ảnh</li>
                      <li>Ảnh đầu tiên sẽ là ảnh bìa</li>
                      <li>Đăng ảnh chất lượng cao để thu hút khách hàng</li>
                    </ul>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Pricing & Details */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Giá & Chi tiết</h3>
                
                {/* Price */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label>Giá bán/cho thuê</Label>
                    <div className="flex mt-1">
                      <Input
                        type="number"
                        value={formData.price || ''}
                        onChange={(e) => updateFormData({ price: parseInt(e.target.value) || 0 })}
                        placeholder="VD: 2000000000"
                        className="flex-1 rounded-r-none"
                      />
                      <Select
                        value={formData.price_unit}
                        onValueChange={(value) => updateFormData({ price_unit: value as any })}
                      >
                        <SelectTrigger className="w-32 rounded-l-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="total">Tổng</SelectItem>
                          <SelectItem value="per_m2">/m²</SelectItem>
                          <SelectItem value="per_month">/tháng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-end pb-1">
                    <Checkbox
                      id="negotiable"
                      checked={formData.price_negotiable}
                      onCheckedChange={(checked) => updateFormData({ price_negotiable: !!checked })}
                    />
                    <Label htmlFor="negotiable" className="ml-2 cursor-pointer">
                      Giá có thể thương lượng
                    </Label>
                  </div>
                </div>

                {/* Area */}
                <div className="mb-6">
                  <Label>Diện tích (m²)</Label>
                  <Input
                    type="number"
                    value={formData.area || ''}
                    onChange={(e) => updateFormData({ area: parseInt(e.target.value) || 0 })}
                    placeholder="VD: 75"
                    className="mt-1"
                    style={{ maxWidth: '200px' }}
                  />
                </div>

                {/* Details */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <Label>Số phòng ngủ</Label>
                    <Select
                      value={String(formData.bedrooms || 0)}
                      onValueChange={(value) => updateFormData({ bedrooms: parseInt(value) })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Không có</SelectItem>
                        <SelectItem value="1">1 PN</SelectItem>
                        <SelectItem value="2">2 PN</SelectItem>
                        <SelectItem value="3">3 PN</SelectItem>
                        <SelectItem value="4">4 PN</SelectItem>
                        <SelectItem value="5">5+ PN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Số phòng tắm</Label>
                    <Select
                      value={String(formData.bathrooms || 0)}
                      onValueChange={(value) => updateFormData({ bathrooms: parseInt(value) })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Không có</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Hướng nhà</Label>
                    <Select
                      value={formData.direction || ''}
                      onValueChange={(value) => updateFormData({ direction: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Chọn hướng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dong">Đông</SelectItem>
                        <SelectItem value="tay">Tây</SelectItem>
                        <SelectItem value="nam">Nam</SelectItem>
                        <SelectItem value="bac">Bắc</SelectItem>
                        <SelectItem value="dong_bac">Đông Bắc</SelectItem>
                        <SelectItem value="dong_nam">Đông Nam</SelectItem>
                        <SelectItem value="tay_bac">Tây Bắc</SelectItem>
                        <SelectItem value="tay_nam">Tây Nam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Furniture */}
                <div className="mb-6">
                  <Label>Tình trạng nội thất</Label>
                  <Select
                    value={formData.furniture || 'none'}
                    onValueChange={(value) => updateFormData({ furniture: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không nội thất</SelectItem>
                      <SelectItem value="basic">Nội thất cơ bản</SelectItem>
                      <SelectItem value="full">Nội thất đầy đủ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Features */}
                <div>
                  <Label className="mb-2 block">Tiện ích</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {features.map((feature) => (
                      <div key={feature.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`feature-${feature.id}`}
                          checked={formData.features.includes(feature.id)}
                          onCheckedChange={() => toggleFeature(feature.id)}
                        />
                        <Label htmlFor={`feature-${feature.id}`} className="cursor-pointer">
                          {feature.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>

        {currentStep < 4 ? (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="gap-2"
          >
            Tiếp theo
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
            className="gap-2 bg-orange-500 hover:bg-orange-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang đăng tin...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Đăng tin
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
