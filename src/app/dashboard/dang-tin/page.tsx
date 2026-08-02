'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { usePostDraft, useDraftAutosave } from '@/hooks/usePostDraft';
import { usePostForm } from '@/hooks/usePostForm';
import { PostStepper } from '@/components/dashboard/PostStepper';
import { PackageCard } from '@/components/dashboard/PackageCard';
import { BasicInfoFields, AddressMapFields } from '@/components/dashboard/post-form/BasicInfoFields';
import { TitleDescriptionFields } from '@/components/dashboard/post-form/TitleDescriptionFields';
import { PriceDetailsFields } from '@/components/dashboard/post-form/PriceDetailsFields';
import { MediaFields } from '@/components/dashboard/post-form/MediaFields';
import { ContactFields } from '@/components/dashboard/post-form/ContactFields';
import {
  isFieldVisible,
  LEGAL_NEEDS_NOTE,
  isValidPhone,
  isValidEmail,
  directionText,
  legalText,
  buildPropertyPayload,
  type PropertyFormData,
} from '@/lib/property-form-config';
import { FORMER_UNITS } from '@/lib/former-admin-units';
import { ListingPreview, type ListingPreviewData } from '@/components/property/detail/ListingPreview';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Eye
} from 'lucide-react';

// 3 bước theo spec mục 2. Trước đây tách làm 4 (cơ bản / ảnh / chi tiết / thanh toán),
// giờ gộp toàn bộ thông tin BĐS vào bước 1.
const STEPS = [
  { title: 'Thông tin BĐS', description: 'Vị trí, giá, thông số' },
  { title: 'Hình ảnh & Video', description: 'Ảnh thật của bất động sản' },
  { title: 'Gói đăng tin', description: 'Chọn gói & hoàn tất' },
];
const LAST_STEP = STEPS.length;

// Gói đăng tin tải từ /api/v2/packages. Trước đây danh sách này hardcode giá 0/50k/100k/
// 200k trong khi bảng packages thật là 0/150k/350k/800k — người dùng nhìn một đằng, hệ
// thống tính tiền một nẻo.
interface PackageOption {
  id: number;
  name: string;
  type: 'normal' | 'vip' | 'vip_plus' | 'diamond';
  price: number;
  duration_days: number;
  features: string[];
}

// Tiện ích được tải từ /api/v2/features theo nhóm BĐS. Trước đây danh sách này hardcode
// id 1-8 kèm tên tự đặt, lệch hẳn với bảng features trong DB (id 1 ghi "Hồ bơi" nhưng
// thực tế là "Có sân vườn") nên tiện ích lưu xuống sai so với thứ người dùng bấm chọn.

export default function DangTinPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const authUser = useAuthStore((s) => s.user);

  // Giới hạn media/nội dung do quản trị viên cấu hình (spec mục 7.1). Có giá trị mặc định
  // để form vẫn dùng được nếu API lỗi.
  const [limits, setLimits] = useState({
    images_limit: 10,
    image_max_size_mb: 10,
    video_limit: 2,
    video_max_size_mb: 100,
    description_min: 50,
  });
  useEffect(() => {
    api
      .get('/api/v2/settings/property')
      .then((res) => res.data?.data && setLimits((prev) => ({ ...prev, ...res.data.data })))
      .catch(() => { /* giữ mặc định */ });
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [balance, setBalance] = useState<number>(0);
  useEffect(() => {
    api.get('/api/v2/packages').then((res) => {
      const list: PackageOption[] = res.data?.data ?? [];
      setPackages(list);
      // Mặc định chọn gói rẻ nhất để người dùng luôn đăng được mà không phải chọn gì.
      if (list.length > 0) {
        setFormData((prev) => (prev.package_id ? prev : { ...prev, package_id: list[0].id }));
      }
    }).catch(() => setPackages([]));
  }, []);

  // Số dư ví để hiển thị ở màn thanh toán và cảnh báo sớm nếu không đủ.
  useEffect(() => {
    if (!authUser) return;
    api.get('/api/v2/auth/me')
      .then((res) => setBalance(Number(res.data?.data?.balance ?? 0)))
      .catch(() => setBalance(Number((authUser as { balance?: number }).balance ?? 0)));
  }, [authUser]);
  const [formData, setFormData] = useState<PropertyFormData>({
    type: 'sell',
    category_id: '',
    title: '',
    description: '',
    street: '',
    latitude: undefined,
    longitude: undefined,
    images: [],
    videos: [],
    price: 0,
    price_unit: 'total',
    price_negotiable: false,
    area: 0,
    bedrooms: 0,
    bathrooms: 0,
    direction: '',
    furniture: 'none',
    legal: '',
    legal_note: '',
    features: [],
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    contact_address: '',
    package_id: null,
  });

  const updateFormData = (updates: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Phần logic dùng chung với trang sửa tin: danh mục, tiện ích, đổi danh mục, AI, bản đồ.
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
  } = usePostForm({ formData, updateFormData });

  // Bản nháp (spec mục 13). Chỉ bật autosave sau khi người dùng đã xử lý xong bản nháp
  // cũ (tiếp tục hoặc bỏ), nếu không form rỗng lúc mới mở sẽ ghi đè ngay lên nháp cũ.
  const draft = usePostDraft<PropertyFormData>();
  const [draftHandled, setDraftHandled] = useState(false);

  // Chỉ lưu khi người dùng đã nhập gì đó thật sự. Không tính các ô liên hệ vì chúng được
  // điền sẵn từ tài khoản — nếu tính, form vừa mở đã bị coi là "có nội dung" và lần sau
  // vào lại sẽ hiện thông báo khôi phục một bản nháp trống rỗng.
  const hasContent = !!(
    formData.category_id ||
    formData.title ||
    formData.description ||
    formData.street ||
    formData.price > 0 ||
    formData.area > 0 ||
    formData.images.length > 0
  );

  useDraftAutosave(formData, currentStep, draft.saveNow, draftHandled && hasContent && !isSubmitting);

  const resumeDraft = () => {
    if (!draft.found) return;
    setFormData(draft.found.data);
    setCurrentStep(draft.found.step || 1);
    // Bản nháp có sẵn toạ độ nghĩa là người dùng đã ghim trước đó — giữ nguyên, đừng để
    // auto-geocode ghi đè khi họ mở lại tin dở dang.
    if (draft.found.data.latitude != null) pinIsAutoRef.current = false;
    if (draft.found.data.street?.trim()) streetAutoFilledRef.current = false;
    draft.dismiss();
    setDraftHandled(true);
    toast.success('Đã khôi phục bản nháp gần nhất.');
  };

  const discardDraft = () => {
    draft.clear();
    setDraftHandled(true);
  };

  // Đọc xong mà không có nháp thì cho autosave chạy ngay. Phải đợi `checked` chứ không
  // chỉ dựa vào `found`, vì lượt render đầu `found` luôn null.
  useEffect(() => {
    if (draft.checked && !draft.found) setDraftHandled(true);
  }, [draft.checked, draft.found]);

  // Điền sẵn thông tin liên hệ từ tài khoản, nhưng chỉ khi người dùng chưa tự nhập —
  // tránh ghi đè thứ họ vừa sửa nếu store cập nhật lại sau đó.
  useEffect(() => {
    if (!authUser) return;
    setFormData((prev) => ({
      ...prev,
      contact_name: prev.contact_name || authUser.name || '',
      contact_phone: prev.contact_phone || authUser.phone || '',
      contact_email: prev.contact_email || authUser.email || '',
      contact_address: prev.contact_address || authUser.address || '',
    }));
  }, [authUser]);

  const toggleFeature = (featureId: number) => {
    const newFeatures = formData.features.includes(featureId)
      ? formData.features.filter(id => id !== featureId)
      : [...formData.features, featureId];
    updateFormData({ features: newFeatures });
  };

  /**
   * Quy đổi giá hiển thị ngay dưới ô nhập (feedback mục 3.3). Chỉ trả về khi có tổng giá
   * thật — thiếu diện tích thì `perM2` là null và phần đó tự ẩn, không hiện "0/m²".
   */
  const formerUnits = formData.district_id ? (FORMER_UNITS[formData.district_id] ?? []) : [];

  const selectedPackage = packages.find((p) => p.id === formData.package_id) ?? null;

  // Xem trước bài đăng (feedback 28/07 mục 6).
  const [showPreview, setShowPreview] = useState(false);

  /** Dựng dữ liệu xem trước từ formData đang soạn — cùng hình dạng object trang chi tiết render. */
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
      legalNote:
        isFieldVisible(group, 'legal') && formData.legal === LEGAL_NEEDS_NOTE ? formData.legal_note : undefined,
      description: formData.description,
      media: formData.images.map((img) => img.url),
      address,
      categoryName: apiCategories.find((c) => String(c.id) === formData.category_id)?.name ?? 'Bất động sản',
      features: features.filter((f) => formData.features.includes(f.id)).map((f) => f.name),
      user: {
        name: formData.contact_name || authUser?.name || 'Người đăng',
        avatar: authUser?.avatar ?? null,
        phone: formData.contact_phone,
      },
    };
  };

  // Đủ điều kiện xem trước khi đã có thông tin cơ bản của bước 1 + ít nhất một ảnh (bước 2).
  const canPreview = !!(formData.category_id && formData.title && formData.area > 0 && formData.images.length > 0);

  const canProceed = () => {
    switch (currentStep) {
      // Bước 1 gộp toàn bộ thông tin BĐS nên kiểm luôn cả trường bắt buộc của spec
      // mục 10.1. Mô tả tối thiểu 50 ký tự khớp đúng validate của API, nếu để thấp hơn
      // thì người dùng đi hết các bước rồi mới bị server từ chối ở bước cuối.
      case 1:
        return !!(
          formData.type &&
          formData.category_id &&
          formData.province_id &&
          formData.district_id &&
          // "Thoả thuận" không bắt buộc nhập số tiền (spec mục 4.2).
          (formData.price_unit === 'negotiable' || formData.price > 0) &&
          formData.area > 0 &&
          formData.contact_name.trim() &&
          isValidPhone(formData.contact_phone) &&
          (!formData.contact_email || isValidEmail(formData.contact_email)) &&
          formData.title.length >= 10 &&
          formData.description.length >= limits.description_min
        );
      case 2:
        return formData.images.length > 0;
      case 3:
        // Không cho bấm thanh toán khi số dư không đủ — thà chặn ở đây còn hơn để người
        // dùng bấm rồi nhận lỗi 402 từ server.
        return !!selectedPackage && (selectedPackage.price === 0 || balance >= selectedPackage.price);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < LAST_STEP) {
      const next = currentStep + 1;
      setCurrentStep(next);
      // Spec: lưu nháp tại thời điểm chuyển bước, không đợi hết debounce.
      if (draftHandled) draft.saveNow(formData, next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Khoá chống trùng giữ nguyên qua các lần thử lại của CÙNG một lượt đăng, nên bấm nhiều
   * lần hoặc thử lại sau lỗi mạng cũng chỉ trừ tiền một lần (spec mục 8.3). Chỉ đổi khoá
   * khi đăng thành công, tức là bắt đầu một lượt đăng mới.
   */
  const idempotencyKeyRef = useRef<string>('');
  if (!idempotencyKeyRef.current) {
    idempotencyKeyRef.current = `post-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const shared = buildPropertyPayload(formData, group);

      const payload = {
        ...shared,
        contact_name: formData.contact_name || undefined,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email || undefined,
        contact_address: formData.contact_address || undefined,
        package_id: formData.package_id,
        idempotency_key: idempotencyKeyRef.current,
        // Ảnh đã upload sẵn lên Cloudinary ở bước 2 — chỉ gửi URL để API ghi vào
        // property_media. Thiếu mảng này thì ảnh người dùng tải lên bị mất trắng.
        images: formData.images.map((img, i) => ({
          url: img.url,
          thumbnail: img.thumbnail,
          is_primary: img.isPrimary ?? i === 0,
          sort_order: i,
        })),
        // Video lưu chung bảng property_media, phân biệt bằng cột type.
        videos: formData.videos.map((v, i) => ({
          url: v.url,
          thumbnail: v.thumbnail,
          sort_order: i,
        })),
      };

      const response = await api.post('/api/v2/my/properties', payload);

      if (response.data?.success || response.status === 201) {
        // Đăng thành công thì bản nháp không còn ý nghĩa — xoá để lần sau vào form trống.
        draft.clear();
        idempotencyKeyRef.current = ''; // lượt đăng sau dùng khoá mới
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

      {/* Thông báo có bản nháp chưa hoàn thành (spec mục 13) — không tự khôi phục mà
          để người dùng chọn, tránh bất ngờ khi họ muốn đăng một tin hoàn toàn mới. */}
      {draft.found && !draftHandled && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Bạn có một tin đăng chưa hoàn thành</p>
            <p className="text-[13px] text-amber-700 mt-0.5">
              Lưu lúc {new Date(draft.found.savedAt).toLocaleString('vi-VN')} — ở bước {draft.found.step}/{LAST_STEP}.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button type="button" onClick={resumeDraft} className="h-9 bg-primary hover:bg-primary/90 text-white">
              Tiếp tục
            </Button>
            <Button type="button" variant="outline" onClick={discardDraft} className="h-9">
              Bỏ và tạo mới
            </Button>
          </div>
        </div>
      )}

      <PostStepper currentStep={currentStep} steps={STEPS} />

      <Card className="border-0 shadow-xl shadow-gray-200/40 rounded-2xl overflow-hidden">
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
                categoriesEmpty={apiCategories.filter((c) => c.type === formData.type).length === 0}
              />

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
                  // Người dùng tự gõ — từ giờ không tự động ghi đè ô này khi ghim lại nữa.
                  streetAutoFilledRef.current = false;
                  updateFormData({ street: value });
                }}
                formerUnits={formerUnits}
                onMapPick={handleMapPick}
                isGeocoding={isGeocoding}
                geocodeNote={geocodeNote}
              />
            </div>
          )}

          {/* Step 2: Images */}
          {currentStep === 2 && (
            <MediaFields
              title="Hình ảnh & Video"
              images={formData.images}
              onImagesChange={(images) => updateFormData({ images })}
              maxFiles={limits.images_limit}
              maxSize={limits.image_max_size_mb}
              showVideo
              videos={formData.videos}
              onVideosChange={(videos) => updateFormData({ videos })}
              maxVideos={limits.video_limit}
              maxVideoSize={limits.video_max_size_mb}
            />
          )}

          {/* Bước 1 (phần 2): Giá, thông số, tiện ích, liên hệ, nội dung tin đăng.
              Spec gộp toàn bộ thông tin BĐS vào 1 bước, thứ tự theo mục 4.1→4.6 —
              tiêu đề/mô tả đặt cuối vì AI cần dữ liệu các mục trên để sinh nội dung. */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <PriceDetailsFields
                data={formData}
                onChange={updateFormData}
                group={group}
                features={features}
                selectedFeatureIds={formData.features}
                onToggleFeature={toggleFeature}
              />

              {/* Thông tin liên hệ (spec mục 4.5) — điền sẵn từ tài khoản, cho sửa. */}
              <ContactFields data={formData} onChange={updateFormData} />

              {/* Nội dung tin đăng — đặt cuối cùng (spec mục 4.6) để nút AI có sẵn toàn bộ
                  dữ liệu người dùng vừa nhập làm đầu vào. */}
              <TitleDescriptionFields
                variant="callout"
                title={formData.title}
                description={formData.description}
                onTitleChange={(title) => updateFormData({ title })}
                onDescriptionChange={(description) => updateFormData({ description })}
                categoryId={formData.category_id}
                aiLoading={aiLoading}
                onGenerateAI={generateContent}
                descriptionMin={limits.description_min}
              />
            </div>
          )}

          {/* Bước 3: Gói đăng tin */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold text-gray-900 mb-2 pb-2 border-b text-center">Chọn gói đăng tin</h3>
              <p className="text-center text-gray-500 text-sm mb-8">Tin đăng sẽ được kiểm duyệt trong vòng 24h.</p>

              {packages.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">Đang tải gói đăng tin...</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {packages.map((pkg) => (
                    <PackageCard
                      key={pkg.id}
                      id={String(pkg.id)}
                      name={pkg.name}
                      price={pkg.price}
                      duration={pkg.duration_days}
                      features={pkg.features}
                      color={pkg.type}
                      selected={formData.package_id === pkg.id}
                      onSelect={(id) => updateFormData({ package_id: Number(id) })}
                    />
                  ))}
                </div>
              )}

              {/* Bảng kê thanh toán (spec mục 8.2) */}
              {selectedPackage && (
                <div className="mt-8 rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-gray-900">Thông tin thanh toán</h4>
                  </div>
                  <div className="p-5 space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gói đã chọn</span>
                      <span className="font-semibold text-gray-900">{selectedPackage.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Đơn giá</span>
                      <span className="font-medium text-gray-800">
                        {selectedPackage.price === 0 ? 'Miễn phí' : `${selectedPackage.price.toLocaleString('vi-VN')} đ`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Thời gian hiển thị</span>
                      <span className="font-medium text-gray-800">{selectedPackage.duration_days} ngày</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ngày dự kiến hết hạn</span>
                      <span className="font-medium text-gray-800">
                        {new Date(Date.now() + selectedPackage.duration_days * 86400000).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-baseline">
                      <span className="font-semibold text-gray-900">Tổng thanh toán</span>
                      <span className="text-xl font-extrabold text-cta">
                        {selectedPackage.price === 0 ? 'Miễn phí' : `${selectedPackage.price.toLocaleString('vi-VN')} đ`}
                      </span>
                    </div>

                    {selectedPackage.price > 0 && (
                      <>
                        <div className="flex justify-between pt-1">
                          <span className="text-gray-500">Phương thức</span>
                          <span className="font-medium text-gray-800">Trừ vào số dư tài khoản</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Số dư hiện có</span>
                          <span className={`font-semibold ${balance < selectedPackage.price ? 'text-red-600' : 'text-green-600'}`}>
                            {balance.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                        {balance < selectedPackage.price && (
                          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3.5 py-3 flex flex-col sm:flex-row sm:items-center gap-2.5">
                            <p className="text-[13px] text-red-700 flex-1">
                              Số dư không đủ, còn thiếu{' '}
                              <strong>{(selectedPackage.price - balance).toLocaleString('vi-VN')} đ</strong>.
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => router.push('/dashboard/nap-tien')}
                              className="h-8 shrink-0 border-red-300 text-red-700 hover:bg-red-100"
                            >
                              Nạp tiền
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
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
          {/* Xem trước bài đăng (feedback 28/07 mục 6) — hiện khi đã đủ thông tin cơ bản + ảnh. */}
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

          {currentStep < LAST_STEP ? (
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

      {/* Overlay xem trước bài đăng — đóng lại là quay về đúng chỗ đang soạn. */}
      {showPreview && (
        <ListingPreview
          data={buildPreviewData()}
          onClose={() => setShowPreview(false)}
          onSubmit={handleSubmit}
          submitting={isSubmitting}
          submitLabel={currentStep === LAST_STEP ? 'Đăng tin ngay' : 'Đăng tin'}
        />
      )}
    </div>
  );
}
