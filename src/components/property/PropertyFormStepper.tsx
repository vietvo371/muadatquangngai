'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Check, MapPin, Image, Info, DollarSign } from 'lucide-react';

interface PropertyFormStepperProps {
  initialData?: Partial<PropertyFormData>;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  onCancel?: () => void;
}

export interface PropertyFormData {
  title: string;
  category_id: number;
  type: 'sell' | 'rent';
  price: number;
  price_unit: string;
  area: number;
  address: string;
  province_id: number;
  district_id: number;
  ward_id: number;
  latitude: number | null;
  longitude: number | null;
  description: string;
  features: number[];
  images: string[];
  video_url: string;
  legal_status: string;
  facing_direction: string;
  floors: number;
  rooms: number;
  bathrooms: number;
  width: number;
  length: number;
}

interface Step {
  id: number;
  title: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  { id: 1, title: 'Loại tin', icon: <Info className="w-5 h-5" /> },
  { id: 2, title: 'Vị trí', icon: <MapPin className="w-5 h-5" /> },
  { id: 3, title: 'Hình ảnh', icon: <Image className="w-5 h-5" /> },
  { id: 4, title: 'Thông tin', icon: <Info className="w-5 h-5" /> },
  { id: 5, title: 'Giá & đăng', icon: <DollarSign className="w-5 h-5" /> },
];

export function PropertyFormStepper({ initialData, onSubmit, onCancel }: PropertyFormStepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    category_id: 0,
    type: 'sell',
    price: 0,
    price_unit: 'trieu',
    area: 0,
    address: '',
    province_id: 64, // Quang Ngai
    district_id: 0,
    ward_id: 0,
    latitude: null,
    longitude: null,
    description: '',
    features: [],
    images: [],
    video_url: '',
    legal_status: '',
    facing_direction: '',
    floors: 0,
    rooms: 0,
    bathrooms: 0,
    width: 0,
    length: 0,
    ...initialData,
  });

  const updateField = <K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.category_id > 0;
      case 2:
        return formData.district_id > 0 && formData.address.length > 0;
      case 3:
        return formData.images.length > 0;
      case 4:
        return formData.description.length >= 100;
      case 5:
        return formData.price > 0 && formData.area > 0 && formData.title.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      toast.success('Đăng tin thành công!');
    } catch (error) {
      toast.error('Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {STEPS.map((step) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  currentStep >= step.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.icon
                )}
              </div>
              <span
                className={`text-xs mt-2 text-center ${
                  currentStep >= step.id ? 'text-primary font-medium' : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
            </div>
          ))}
          <div className="absolute left-0 w-full h-1 bg-gray-200 -z-10 top-5" />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 min-h-[400px]">
        {currentStep === 1 && <StepType formData={formData} updateField={updateField} />}
        {currentStep === 2 && <StepLocation formData={formData} updateField={updateField} />}
        {currentStep === 3 && <StepImages formData={formData} updateField={updateField} />}
        {currentStep === 4 && <StepDetails formData={formData} updateField={updateField} />}
        {currentStep === 5 && <StepPrice formData={formData} updateField={updateField} />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handlePrev}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {currentStep === 1 ? 'Hủy' : 'Quay lại'}
        </Button>

        {currentStep < 5 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Tiếp tục
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading || !canProceed()}>
            {loading ? 'Đang đăng...' : 'Đăng tin'}
          </Button>
        )}
      </div>
    </div>
  );
}

// Step 1: Type Selection
function StepType({
  formData,
  updateField,
}: {
  formData: PropertyFormData;
  updateField: <K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) => void;
}) {
  const categories = {
    sell: [
      { id: 1, name: 'Căn hộ chung cư' },
      { id: 2, name: 'Nhà riêng' },
      { id: 3, name: 'Nhà phố' },
      { id: 4, name: 'Biệt thự' },
      { id: 5, name: 'Đất nền' },
      { id: 6, name: 'Đất thổ cư' },
      { id: 7, name: 'Shophouse' },
    ],
    rent: [
      { id: 21, name: 'Căn hộ cho thuê' },
      { id: 22, name: 'Nhà cho thuê' },
      { id: 23, name: 'Phòng trọ' },
      { id: 24, name: 'Mặt bằng' },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Chọn loại tin đăng</h2>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => updateField('type', 'sell')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              formData.type === 'sell'
                ? 'border-primary bg-primary-light'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="font-semibold">Bán</p>
            <p className="text-sm text-gray-500">Đăng tin bán BĐS</p>
          </button>
          <button
            onClick={() => updateField('type', 'rent')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              formData.type === 'rent'
                ? 'border-primary bg-primary-light'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="font-semibold">Cho thuê</p>
            <p className="text-sm text-gray-500">Đăng tin cho thuê</p>
          </button>
        </div>
      </div>

      <div>
        <Label className="text-base font-medium">Danh mục</Label>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {(categories[formData.type] || []).map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateField('category_id', cat.id)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                formData.category_id === cat.id
                  ? 'border-primary bg-primary-light'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-medium">{cat.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 2: Location
function StepLocation({
  formData,
  updateField,
}: {
  formData: PropertyFormData;
  updateField: <K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Vị trí bất động sản</h2>

      <div>
        <Label>Địa chỉ chi tiết</Label>
        <Input
          value={formData.address}
          onChange={(e) => updateField('address', e.target.value)}
          placeholder="VD: 123 Nguyen Trai, P. Nguyen Van Cu"
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tỉnh/Thành phố</Label>
          <Input value="Quảng Ngãi" disabled className="mt-2" />
        </div>
        <div>
          <Label>Quận/Huyện</Label>
          <select
            className="w-full h-10 px-3 border rounded-md mt-2"
            value={formData.district_id}
            onChange={(e) => updateField('district_id', parseInt(e.target.value))}
          >
            <option value={0}>Chọn quận/huyện</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Phường/Xã</Label>
          <select
            className="w-full h-10 px-3 border rounded-md mt-2"
            value={formData.ward_id}
            onChange={(e) => updateField('ward_id', parseInt(e.target.value))}
            disabled={formData.district_id === 0}
          >
            <option value={0}>Chọn phường/xã</option>
          </select>
        </div>
        <div>
          <Label>Đường rộng (m)</Label>
          <Input
            type="number"
            value={formData.width || ''}
            onChange={(e) => updateField('width', parseFloat(e.target.value) || 0)}
            placeholder="VD: 5"
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}

// Step 3: Images
function StepImages({
  formData,
  updateField,
}: {
  formData: PropertyFormData;
  updateField: <K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) => void;
}) {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          newImages.push(reader.result as string);
          if (newImages.length === files.length) {
            updateField('images', [...formData.images, ...newImages]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    updateField(
      'images',
      formData.images.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Hình ảnh & Video</h2>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <Image className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="font-medium">Click để tải lên hình ảnh</p>
          <p className="text-sm text-gray-500 mt-1">
            PNG, JPG tối đa 5MB mỗi ảnh (tối thiểu 3 ảnh)
          </p>
        </label>
      </div>

      {formData.images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {formData.images.map((img, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
              <img src={img} alt="" className="w-full h-full object-cover" />
              {index === 0 && (
                <Badge className="absolute top-2 left-2 bg-primary">Ảnh bìa</Badge>
              )}
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <Label>Link video (Youtube/Vimeo)</Label>
        <Input
          value={formData.video_url}
          onChange={(e) => updateField('video_url', e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="mt-2"
        />
      </div>
    </div>
  );
}

// Step 4: Details
function StepDetails({
  formData,
  updateField,
}: {
  formData: PropertyFormData;
  updateField: <K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Thông tin chi tiết</h2>

      <div>
        <Label>Mô tả *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Mô tả chi tiết về bất động sản (tối thiểu 100 ký tự)"
          className="mt-2 min-h-[150px]"
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.description.length}/100 ký tự
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Số tầng</Label>
          <Input
            type="number"
            value={formData.floors || ''}
            onChange={(e) => updateField('floors', parseInt(e.target.value) || 0)}
            className="mt-2"
          />
        </div>
        <div>
          <Label>Số phòng</Label>
          <Input
            type="number"
            value={formData.rooms || ''}
            onChange={(e) => updateField('rooms', parseInt(e.target.value) || 0)}
            className="mt-2"
          />
        </div>
        <div>
          <Label>Số WC</Label>
          <Input
            type="number"
            value={formData.bathrooms || ''}
            onChange={(e) => updateField('bathrooms', parseInt(e.target.value) || 0)}
            className="mt-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Hướng nhà</Label>
          <select
            className="w-full h-10 px-3 border rounded-md mt-2"
            value={formData.facing_direction}
            onChange={(e) => updateField('facing_direction', e.target.value)}
          >
            <option value="">Chọn hướng</option>
            <option value="north">Bắc</option>
            <option value="south">Nam</option>
            <option value="east">Đông</option>
            <option value="west">Tây</option>
            <option value="northeast">Đông Bắc</option>
            <option value="northwest">Tây Bắc</option>
            <option value="southeast">Đông Nam</option>
            <option value="southwest">Tây Nam</option>
          </select>
        </div>
        <div>
          <Label>Pháp lý</Label>
          <select
            className="w-full h-10 px-3 border rounded-md mt-2"
            value={formData.legal_status}
            onChange={(e) => updateField('legal_status', e.target.value)}
          >
            <option value="">Chọn pháp lý</option>
            <option value="so_do">Sổ đỏ</option>
            <option value="so_hong">Sổ hồng</option>
            <option value="hop_dong">Hợp đồng</option>
            <option value="dang_cho_so">Đang chờ sổ</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Step 5: Price & Submit
function StepPrice({
  formData,
  updateField,
}: {
  formData: PropertyFormData;
  updateField: <K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Giá & Tiêu đề</h2>

      <div>
        <Label>Tiêu đề tin đăng *</Label>
        <Input
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="VD: Căn hộ 2PN view biển, full nội thất"
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Giá *</Label>
          <div className="flex mt-2">
            <Input
              type="number"
              value={formData.price || ''}
              onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
              placeholder="VD: 1.5"
              className="flex-1 rounded-r-none"
            />
            <select
              className="w-24 px-3 border rounded-l-none border-l-0"
              value={formData.price_unit}
              onChange={(e) => updateField('price_unit', e.target.value)}
            >
              <option value="trieu">Triệu</option>
              <option value="ty">Tỷ</option>
              <option value="m2">/m²</option>
            </select>
          </div>
        </div>
        <div>
          <Label>Diện tích (m²) *</Label>
          <Input
            type="number"
            value={formData.area || ''}
            onChange={(e) => updateField('area', parseFloat(e.target.value) || 0)}
            placeholder="VD: 80"
            className="mt-2"
          />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-medium mb-2">Tổng kết</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Loại:</span>
            <span className="font-medium">{formData.type === 'sell' ? 'Bán' : 'Cho thuê'}</span>
          </div>
          <div className="flex justify-between">
            <span>Diện tích:</span>
            <span className="font-medium">{formData.area} m²</span>
          </div>
          <div className="flex justify-between">
            <span>Giá:</span>
            <span className="font-medium text-primary">
              {formData.price > 0
                ? `${formData.price} ${formData.price_unit}`
                : 'Chưa nhập'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Hình ảnh:</span>
            <span className="font-medium">{formData.images.length} ảnh</span>
          </div>
        </div>
      </div>
    </div>
  );
}
