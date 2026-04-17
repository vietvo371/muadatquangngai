'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin,
  Home,
  Camera,
  X,
  Save,
  Eye,
  Loader2,
} from 'lucide-react';
import { LocationSelect } from '@/components/forms/LocationSelect';
import { PriceInput } from '@/components/forms/PriceInput';
import { ImageUploader } from '@/components/forms/ImageUploader';
import { toast } from 'sonner';

// Mock property data
const propertyData = {
  id: 1,
  title: 'Căn hộ cao cấp 2PN view biển Mỹ Khê',
  type: 'apartment',
  category_id: 1,
  province_id: 1,
  district_id: 1,
  ward_id: 1,
  address: 'Đường Võ Nguyên Giáp',
  price: 3500000000,
  price_unit: 'total',
  area: 75,
  bedrooms: 2,
  bathrooms: 1,
  floors: null,
  direction: 'east',
  legal_doc: 'so_hong_dong',
  description: 'Căn hộ cao cấp 2 phòng ngủ view biển Mỹ Khê, nội thất đầy đủ, tiện nghi hiện đại.',
  images: [
    { id: 1, url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400', is_primary: true },
    { id: 2, url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400', is_primary: false },
    { id: 3, url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', is_primary: false },
  ],
  features: [1, 3, 5, 8],
  videos: [],
  status: 'draft',
};

const steps = [
  { id: 1, name: 'Thông tin cơ bản', fields: ['title', 'type', 'category', 'province'] },
  { id: 2, name: 'Vị trí', fields: ['address', 'location'] },
  { id: 3, name: 'Giá & Diện tích', fields: ['price', 'area'] },
  { id: 4, name: 'Chi tiết', fields: ['bedrooms', 'bathrooms', 'direction', 'legal'] },
  { id: 5, name: 'Hình ảnh', fields: ['images'] },
  { id: 6, name: 'Mô tả', fields: ['description'] },
];

const featureOptions = [
  { id: 1, name: 'Có gác lửng' },
  { id: 2, name: 'Có thang máy' },
  { id: 3, name: 'Có ban công' },
  { id: 4, name: 'Hướng biển' },
  { id: 5, name: 'Có nội thất' },
  { id: 6, name: 'An ninh 24/7' },
  { id: 7, name: 'Gần trường học' },
  { id: 8, name: 'Gần siêu thị' },
  { id: 9, name: 'Có bãi đỗ xe' },
  { id: 10, name: 'Có hồ bơi' },
];

export default function EditPropertyPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(propertyData);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Đã lưu nháp thành công!');
    } catch {
      toast.error('Lỗi khi lưu nháp');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Cập nhật tin thành công!');
      router.push('/dashboard/quan-ly-tin');
    } catch {
      toast.error('Lỗi khi cập nhật tin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Tiêu đề tin đăng *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="VD: Căn hộ 2PN view biển, nội thất đẹp"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Loại tin *</Label>
                <Select value={formData.type} onValueChange={(v) => v && updateField('type', v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Mua bán</SelectItem>
                    <SelectItem value="rent">Cho thuê</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Danh mục *</Label>
                <Select value={String(formData.category_id)} onValueChange={(v) => v && updateField('category_id', v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Căn hộ</SelectItem>
                    <SelectItem value="2">Nhà phố</SelectItem>
                    <SelectItem value="3">Đất nền</SelectItem>
                    <SelectItem value="4">Villa</SelectItem>
                    <SelectItem value="5">Mặt bằng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label>Tỉnh/Thành phố *</Label>
              <LocationSelect
                value={{
                  province_id: formData.province_id,
                  district_id: formData.district_id,
                  ward_id: formData.ward_id,
                }}
                onChange={(location) => {
                  updateField('province_id', location.province_id);
                  updateField('district_id', location.district_id);
                  updateField('ward_id', location.ward_id);
                }}
              />
            </div>

            <div>
              <Label htmlFor="address">Địa chỉ cụ thể *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="VD: Tầng 15, Chung cư ABC"
                className="mt-1"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label>Giá *</Label>
              <PriceInput
                value={formData.price}
                onChange={(value) => updateField('price', value)}
                unit={formData.price_unit}
                onUnitChange={(unit) => updateField('price_unit', unit)}
              />
            </div>

            <div>
              <Label htmlFor="area">Diện tích (m²) *</Label>
              <Input
                id="area"
                type="number"
                value={formData.area}
                onChange={(e) => updateField('area', parseInt(e.target.value))}
                placeholder="VD: 75"
                className="mt-1"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedrooms">Số phòng ngủ</Label>
                <Select value={String(formData.bedrooms)} onValueChange={(v) => v && updateField('bedrooms', parseInt(v))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map(n => (
                      <SelectItem key={n} value={String(n)}>{n === 0 ? 'Không' : `${n} phòng`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bathrooms">Số phòng tắm</Label>
                <Select value={String(formData.bathrooms)} onValueChange={(v) => v && updateField('bathrooms', parseInt(v))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} phòng</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hướng nhà</Label>
                <Select value={formData.direction || ''} onValueChange={(v) => updateField('direction', v || '')}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn hướng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="north">Bắc</SelectItem>
                    <SelectItem value="south">Nam</SelectItem>
                    <SelectItem value="east">Đông</SelectItem>
                    <SelectItem value="west">Tây</SelectItem>
                    <SelectItem value="northeast">Đông Bắc</SelectItem>
                    <SelectItem value="northwest">Tây Bắc</SelectItem>
                    <SelectItem value="southeast">Đông Nam</SelectItem>
                    <SelectItem value="southwest">Tây Nam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Giấy tờ pháp lý</Label>
                <Select value={formData.legal_doc || ''} onValueChange={(v) => updateField('legal_doc', v || '')}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn loại giấy tờ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="so_hong_dong">Sổ đỏ / Sổ hồng</SelectItem>
                    <SelectItem value="so_chuyen_dong">Sổ chuyển nhượng</SelectItem>
                    <SelectItem value="hop_dong_mua_ban">Hợp đồng mua bán</SelectItem>
                    <SelectItem value="giay_to_khac">Giấy tờ khác</SelectItem>
                    <SelectItem value="dang_xu_ly">Đang xử lý</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Tiện ích</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {featureOptions.map((feature) => (
                  <div key={feature.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`feature-${feature.id}`}
                      checked={formData.features.includes(feature.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateField('features', [...formData.features, feature.id]);
                        } else {
                          updateField('features', formData.features.filter(f => f !== feature.id));
                        }
                      }}
                    />
                    <Label htmlFor={`feature-${feature.id}`} className="text-sm cursor-pointer">
                      {feature.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label>Hình ảnh ({formData.images.length}/20)</Label>
              <p className="text-sm text-gray-500 mb-4">
                Hình đầu tiên sẽ là ảnh đại diện. Kéo thả để sắp xếp thứ tự.
              </p>
              <ImageUploader
                images={formData.images}
                onChange={(images) => updateField('images', images)}
                maxImages={20}
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="description">Mô tả chi tiết *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Mô tả chi tiết về bất động sản: vị trí, tiện ích xung quanh, tình trạng nội thất..."
                rows={10}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-2">
                {formData.description.length} / 3000 ký tự
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/quan-ly-tin">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sửa tin đăng</h1>
            <p className="text-gray-500">Cập nhật thông tin bất động sản</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Lưu nháp
          </Button>
          <Link href={`/mua-ban/${propertyData.id}`} target="_blank">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Xem trước
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentStep > step.id
                      ? 'bg-green-600 text-white'
                      : currentStep === step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`ml-2 text-sm hidden md:inline ${
                    currentStep >= step.id ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}
                >
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 md:w-16 h-0.5 mx-2 ${
                      currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].name}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Bước {currentStep} / {steps.length}
          </span>
        </div>

        {currentStep < steps.length ? (
          <Button onClick={nextStep}>
            Tiếp tục
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Cập nhật tin
          </Button>
        )}
      </div>
    </div>
  );
}
