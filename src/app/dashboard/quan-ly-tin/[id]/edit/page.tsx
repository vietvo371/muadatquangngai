'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PostStepper } from '@/components/dashboard/PostStepper';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { usePostForm } from '@/hooks/usePostForm';
import { BasicInfoFields, AddressMapFields } from '@/components/dashboard/post-form/BasicInfoFields';
import { TitleDescriptionFields } from '@/components/dashboard/post-form/TitleDescriptionFields';
import { PriceDetailsFields } from '@/components/dashboard/post-form/PriceDetailsFields';
import { MediaFields } from '@/components/dashboard/post-form/MediaFields';
import {
  isFieldVisible,
  directionText,
  legalText,
  LEGAL_NEEDS_NOTE,
  buildPropertyPayload,
  type PropertyFormData,
} from '@/lib/property-form-config';
import { ListingPreview, type ListingPreviewData } from '@/components/property/detail/ListingPreview';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  ChevronLeft,
  Save,
  Eye,
} from 'lucide-react';

const STEPS = [
  { title: 'Cơ bản', description: 'Phân loại & Vị trí' },
  { title: 'Hình ảnh', description: 'Tối thiểu 5, tối đa 50 ảnh' },
  { title: 'Chi tiết', description: 'Giá & Thông số' },
  { title: 'Gói tin', description: 'Cập nhật gói hiển thị' },
];

// Gói hiển thị (is_vip) — sửa tin chỉ đổi hạng, không nối thanh toán như trang đăng tin nên
// giữ danh sách theo is_vip. KHÔNG thuộc phạm vi feedback UI 28/07.
const PACKAGES = [
  { id: 'normal', name: 'Tin Thường', price: 0, duration: 30, features: ['Hiển thị dưới các tin VIP', 'Tiếp cận người dùng cơ bản', 'Không có huy hiệu nổi bật'] },
  { id: 'vip', name: 'Gói VIP', price: 50000, duration: 30, features: ['Hiển thị trên tin thường', 'Có huy hiệu VIP vàng', 'Màu sắc khung thẻ nổi bật'] },
  { id: 'vip_plus', name: 'Gói VIP+', price: 100000, duration: 30, isPopular: true, features: ['Hiển thị trên VIP và tin thường', 'Có huy hiệu VIP+ cam', 'Ảnh đại diện lớn hơn'] },
  { id: 'diamond', name: 'Gói Diamond', price: 200000, duration: 30, features: ['Luôn nằm trên cùng trang chủ', 'Huy hiệu Diamond đỏ độc quyền', 'Hỗ trợ đẩy tin 2 lần/ngày', 'Thiết kế thẻ to nhất'] },
];

const emptyFormData: PropertyFormData = {
  type: 'sell',
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
  videos: [],
  tour360Url: undefined,
  floorPlans: [],
  price: 0,
  price_unit: 'total',
  price_negotiable: false,
  price_display_format: 'short',
  area: 0,
  bedrooms: 0,
  bathrooms: 0,
  direction: '',
  furniture: 'none',
  legal: '',
  legal_note: '',
  features: [],
  // Không dùng ở trang sửa tin — trang này không có bước liên hệ / chọn gói qua thanh toán.
  // Giữ giá trị rỗng chỉ để khớp kiểu PropertyFormData dùng chung với trang đăng tin.
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  contact_address: '',
  package_id: null,
};

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams?.id;
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  /** Hạn hiển thị VIP của tin — chỉ để xem ở bước 4, không sửa được từ trang này. */
  const [vipExpiredAt, setVipExpiredAt] = useState<string | null>(null);
  /** Hạng hiển thị hiện tại (is_vip) — CHỈ XEM ở bước 4, không đi qua formData.package_id vì
   * trường đó (superset dùng chung với trang đăng tin) mang nghĩa "id gói thật từ
   * /api/v2/packages", trong khi ở đây cần hiển thị hạng VIP dạng chuỗi. */
  const [vipTier, setVipTier] = useState<'normal' | 'vip' | 'vip_plus' | 'diamond'>('normal');
  const [formData, setFormData] = useState<PropertyFormData>(emptyFormData);

  // Giới hạn ảnh do quản trị viên cấu hình (feedback I.4) — trước đây trang này hardcode
  // 10/10, không đồng bộ với trang đăng tin.
  const [limits, setLimits] = useState({ images_min: 5, images_limit: 50, image_max_size_mb: 10, image_min_width: 1280 });
  useEffect(() => {
    api
      .get('/api/v2/settings/property')
      .then((res) => res.data?.data && setLimits((prev) => ({ ...prev, ...res.data.data })))
      .catch(() => { /* giữ mặc định */ });
  }, []);

  const updateFormData = (updates: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const toggleFeature = (featureId: number) => {
    const newFeatures = formData.features.includes(featureId)
      ? formData.features.filter((fid) => fid !== featureId)
      : [...formData.features, featureId];
    updateFormData({ features: newFeatures });
  };

  // Phần logic dùng chung với trang đăng tin: danh mục, tiện ích, đổi danh mục, AI, bản đồ.
  // `skipAutoGeocode: isLoading` — không tự geocode trong lúc đang nạp dữ liệu tin cũ, nếu
  // không sẽ đè lên toạ độ đã lưu.
  const {
    apiCategories,
    features,
    group,
    aiLoading,
    generateContent,
    handleCategoryChange,
    isGeocoding,
    geocodeNote,
    handleMapPick,
    streetAutoFilledRef,
    pinIsAutoRef,
  } = usePostForm({ formData, updateFormData, skipAutoGeocode: isLoading });

  // Fetch property data
  useEffect(() => {
    const propertyId = id;
    if (!propertyId) return;

    setIsLoading(true);
    api.get(`/api/v2/my/properties/${propertyId}`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        if (!data) throw new Error('Không có dữ liệu');

        setFormData({
          type: data.type || 'sell',
          category_id: String(data.category?.id ?? ''),
          title: data.title || '',
          description: data.description || '',
          province_id: data.location?.province?.id,
          district_id: data.location?.district?.id,
          ward_id: data.location?.ward?.id,
          province_name: data.location?.province?.name,
          district_name: data.location?.district?.name,
          ward_name: data.location?.ward?.name,
          latitude: data.location?.latitude ?? undefined,
          longitude: data.location?.longitude ?? undefined,
          street: data.street || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          images: (data.media ?? [])
            .filter((m: any) => m.type === 'image')
            .map((m: any) => ({
              id: m.id,
              url: m.url || m.thumbnail || '',
              name: m.name || 'image',
              size: m.size || 0,
              isPrimary: m.is_primary ?? false,
              imageType: m.image_type ?? undefined,
            })),
          // Trang sửa tin không có bước video (quyết định có chủ đích từ đợt refactor, showVideo=false
          // ở MediaFields bên dưới) — không nạp lại videos vào state vì không có UI nào đọc tới.
          videos: [],
          // Tour 360/mặt bằng: trước đây route PUT không xử lý nên tin cũ có sẵn 2 loại này
          // (nếu có) chưa từng nạp lại được lên form sửa — sửa cùng lúc với việc PUT đã lưu được.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tour360Url: (data.media ?? []).find((m: any) => m.type === 'virtual_tour')?.url ?? undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          floorPlans: (data.media ?? [])
            .filter((m: any) => m.type === 'floor_plan')
            .map((m: any) => ({ url: m.url || '', thumbnail: m.thumbnail ?? undefined, name: 'floor-plan', size: 0 })),
          price: data.price ?? 0,
          price_unit: data.price_unit || 'total',
          price_negotiable: data.price_negotiable ?? false,
          price_display_format: data.price_display_format || 'short',
          area: data.area ?? 0,
          bedrooms: data.bedrooms ?? 0,
          bathrooms: data.bathrooms ?? 0,
          toilets: data.toilets ?? 0,
          floors: data.floors ?? 0,
          // direction lưu dưới dạng slug (dong/tay...) — dùng trực tiếp, không map qua tiếng Việt nữa.
          direction: data.direction || '',
          balcony_direction: data.balcony_direction || '',
          road_width: data.road_width ?? undefined,
          facade: data.facade ?? undefined,
          furniture: data.furniture || 'none',
          legal: data.legal || '',
          legal_note: data.legal_note || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          features: (data.features ?? []).map((f: any) => f.id ?? f),
          contact_name: '',
          contact_phone: '',
          contact_email: '',
          contact_address: '',
          package_id: null,
        });

        setVipTier(
          data.is_vip === 'diamond' ? 'diamond'
            : data.is_vip === 'vip_plus' ? 'vip_plus'
            : data.is_vip === 'vip' ? 'vip'
            : 'normal'
        );

        // Hạn VIP để hiển thị ở bước 4 (chỉ xem, không đổi được — xem ghi chú ở bước 4).
        setVipExpiredAt(data.vip_expired_at ?? null);

        // Tin đã có toạ độ nghĩa là người dùng đã ghim trước đó — coi như ghim của người dùng
        // để auto-geocode KHÔNG tự đè khi mở lại tin để sửa. Chỉ auto-ghim khi tin chưa có toạ độ.
        pinIsAutoRef.current = data.location?.latitude == null;
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || 'Không thể tải thông tin tin đăng';
        toast.error(msg);
        router.push('/dashboard/quan-ly-tin');
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pinIsAutoRef là ref, không cần vào deps
  }, [id, router]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!(formData.type && formData.category_id && formData.title.length >= 10 && formData.description.length >= 50 && formData.province_id && formData.district_id);
      case 2:
        return formData.images.length >= limits.images_min;
      case 3:
        return formData.price > 0 && formData.area > 0;
      case 4:
        return !!vipTier;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const buildPayload = () => ({
    ...buildPropertyPayload(formData, group, { legalNoteWhenEmpty: null, featureIdsWhenEmpty: [] }),
    // Ảnh: PUT trước đây không xử lý field này nên ảnh sửa/thêm/xoá ở bước 2 không lưu được
    // xuống DB — server sync toàn bộ (xoá hết ảnh cũ rồi tạo lại đúng thứ tự/bìa/phân loại).
    images: formData.images.map((img, i) => ({
      url: img.url,
      thumbnail: img.thumbnail,
      is_primary: img.isPrimary ?? i === 0,
      sort_order: i,
      image_type: img.imageType,
    })),
    // Tour 360/mặt bằng: cũng bị bỏ sót y hệt ảnh trước đây — sửa cùng lúc.
    tour360_url: formData.tour360Url,
    floor_plans: formData.floorPlans.map((fp, i) => ({
      url: fp.url,
      thumbnail: fp.thumbnail,
      sort_order: i,
    })),
    // KHÔNG gửi `videos`: trang sửa tin không có UI video (showVideo=false, quyết định có chủ
    // đích) — không đụng tới video hiện có nếu không có gì để sửa.
  });
  // KHÔNG gửi `is_vip`: PUT không xử lý trường này (và không nên — nâng gói phải qua luồng có
  // thanh toán). buildPropertyPayload không đưa is_vip vào payload nên không cần lọc thêm.

  const saveChanges = async (successMsg: string, redirect: boolean) => {
    setIsSubmitting(true);
    try {
      await api.put(`/api/v2/my/properties/${id}`, buildPayload());
      toast.success(successMsg);
      if (redirect) router.push('/dashboard/quan-ly-tin');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errData = error?.response?.data;
      if (errData?.errors) {
        toast.error(Object.values(errData.errors).flat().join('\n'));
      } else {
        toast.error(errData?.message || 'Lỗi khi cập nhật tin đăng');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => saveChanges('Cập nhật tin đăng thành công!', true);
  const handleSaveDraft = () => saveChanges('Đã lưu thay đổi thành công!', false);

  // --- Xem trước bài đăng (feedback mục 6) ---
  const [showPreview, setShowPreview] = useState(false);
  const buildPreviewData = (): ListingPreviewData => {
    const address =
      [formData.street, formData.ward_name, formData.district_name, formData.province_name]
        .filter(Boolean)
        .join(', ') || formData.street;
    return {
      title: formData.title,
      type: formData.type,
      price: formData.price,
      priceUnit: formData.price_unit,
      priceNegotiable: formData.price_negotiable || formData.price_unit === 'negotiable',
      area: formData.area,
      bedrooms: isFieldVisible(group, 'bedrooms') ? formData.bedrooms : undefined,
      bathrooms: isFieldVisible(group, 'bathrooms') ? formData.bathrooms : undefined,
      direction: isFieldVisible(group, 'direction') && formData.direction ? directionText(formData.direction) : undefined,
      legalLabel: isFieldVisible(group, 'legal') && formData.legal ? legalText(formData.legal) : undefined,
      legalNote: isFieldVisible(group, 'legal') && formData.legal === LEGAL_NEEDS_NOTE ? formData.legal_note : undefined,
      description: formData.description,
      media: formData.images.map((img) => img.url),
      address,
      categoryName: apiCategories.find((c) => String(c.id) === formData.category_id)?.name ?? 'Bất động sản',
      features: features.filter((f) => formData.features.includes(f.id)).map((f) => f.name),
      user: { name: 'Người đăng', avatar: null, phone: '' },
    };
  };
  const canPreview = !!(formData.category_id && formData.title && formData.area > 0 && formData.images.length > 0);

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
          {canPreview && (
            <Button variant="outline" onClick={() => setShowPreview(true)} className="h-10 px-4 border-primary text-primary hover:bg-primary-light font-semibold rounded-xl">
              <Eye className="h-4 w-4 mr-2" />
              Xem trước
            </Button>
          )}
        </div>
      </div>

      <PostStepper currentStep={currentStep} steps={STEPS} />

      <Card className="border-0 shadow-xl shadow-gray-200/40 rounded-2xl overflow-hidden mt-6 bg-white">
        <CardContent className="p-6 sm:p-8">

          {/* Step 1: Basic Info & Location */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <BasicInfoFields
                type={formData.type}
                categoryId={formData.category_id}
                apiCategories={apiCategories}
                onTypeChange={(type) => updateFormData({ type, category_id: '' })}
                onCategoryChange={handleCategoryChange}
                categoriesEmpty={apiCategories.length === 0}
                emptyStateAsSelectItem
              >
                <TitleDescriptionFields
                  variant="inline"
                  title={formData.title}
                  description={formData.description}
                  onTitleChange={(title) => updateFormData({ title })}
                  onDescriptionChange={(description) => updateFormData({ description })}
                  categoryId={formData.category_id}
                  aiLoading={aiLoading}
                  onGenerateAI={generateContent}
                  descriptionMin={50}
                />
              </BasicInfoFields>

              <AddressMapFields
                location={{
                  province_id: formData.province_id,
                  district_id: formData.district_id,
                  ward_id: formData.ward_id,
                  province_name: formData.province_name,
                  district_name: formData.district_name,
                  ward_name: formData.ward_name,
                  latitude: formData.latitude,
                  longitude: formData.longitude,
                }}
                onLocationChange={(location) => updateFormData(location)}
                street={formData.street}
                onStreetChange={(value) => {
                  streetAutoFilledRef.current = false;
                  updateFormData({ street: value });
                }}
                onMapPick={handleMapPick}
                isGeocoding={isGeocoding}
                geocodeNote={geocodeNote}
                geocodingMessage="Đang tra địa chỉ..."
              />
            </div>
          )}

          {/* Step 2: Images */}
          {currentStep === 2 && (
            <MediaFields
              title="Hình ảnh"
              images={formData.images}
              onImagesChange={(images) => updateFormData({ images })}
              minFiles={limits.images_min}
              maxFiles={limits.images_limit}
              maxSize={limits.image_max_size_mb}
              minWidth={limits.image_min_width}
              showVideo={false}
              noteBoxClassName="bg-[#e8f4fb] border border-primary/20 rounded-xl p-4 mb-6"
              noteTextClassName="text-[13px] text-primary space-y-1.5 list-disc list-inside"
              tour360Url={formData.tour360Url}
              onTour360UrlChange={(tour360Url) => updateFormData({ tour360Url })}
              floorPlans={formData.floorPlans}
              onFloorPlansChange={(floorPlans) => updateFormData({ floorPlans })}
            />
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <PriceDetailsFields
                data={formData}
                onChange={updateFormData}
                group={group}
                features={features}
                selectedFeatureIds={formData.features}
                onToggleFeature={toggleFeature}
              />
            </div>
          )}

          {/* Bước 4: Gói hiển thị — CHỈ XEM.
              Trước đây bước này cho chọn lại gói nhưng PUT /api/v2/my/properties/[id] không hề
              xử lý `is_vip`, nên bấm gì cũng không có tác dụng: người dùng tưởng đã nâng cấp.
              Nâng cấp gói phải đi qua luồng có thanh toán (trừ users.balance, ghi transactions +
              subscriptions trong một transaction có idempotency_key) như trang đăng tin — nhân
              bản logic tiền sang đây là chỗ dễ trừ nhầm/trừ hai lần nhất. Nên ở đây chỉ hiển thị
              đúng tình trạng thật. */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold text-gray-900 mb-2 pb-2 border-b text-center">Gói hiển thị tin đăng</h3>

              {(() => {
                const current = PACKAGES.find((p) => p.id === vipTier) ?? PACKAGES[0];
                const isVip = vipTier !== 'normal';
                const expired = vipExpiredAt ? new Date(vipExpiredAt) : null;
                const stillValid = expired ? expired.getTime() > Date.now() : false;

                return (
                  <div className="max-w-xl mx-auto">
                    <div className="rounded-2xl border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                        <h4 className="font-bold text-gray-900">Gói đang áp dụng</h4>
                      </div>
                      <div className="p-5 space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Gói hiển thị</span>
                          <span className={`font-bold ${isVip ? 'text-cta' : 'text-gray-900'}`}>{current.name}</span>
                        </div>
                        {isVip && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Hạn hiển thị</span>
                            <span className={`font-semibold ${stillValid ? 'text-gray-800' : 'text-red-600'}`}>
                              {expired
                                ? `${expired.toLocaleDateString('vi-VN')}${stillValid ? '' : ' (đã hết hạn)'}`
                                : 'Không giới hạn'}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {current.features.map((f) => (
                            <span key={f} className="text-[12px] bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <p className="text-[13px] text-gray-500 mt-4 text-center">
                      Gói hiển thị không thay đổi được ở trang sửa tin. Để nâng cấp, vui lòng dùng
                      chức năng đẩy tin trong <Link href="/dashboard/quan-ly-tin" className="text-primary font-semibold hover:underline">Quản lý tin</Link>.
                    </p>
                  </div>
                );
              })()}
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

        <div className="flex items-center gap-2">
          {canPreview && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="gap-2 h-11 px-5 border-primary text-primary hover:bg-primary-light font-semibold rounded-xl"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Xem trước</span>
            </Button>
          )}

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
                <><Loader2 className="h-4 w-4 animate-spin" />Đang xử lý...</>
              ) : (
                <><Check className="h-5 w-5" />Cập nhật tin ngay</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Overlay xem trước bài đăng (feedback mục 6) */}
      {showPreview && (
        <ListingPreview
          data={buildPreviewData()}
          onClose={() => setShowPreview(false)}
          onSubmit={handleSubmit}
          submitting={isSubmitting}
          submitLabel="Cập nhật tin"
        />
      )}
    </div>
  );
}
