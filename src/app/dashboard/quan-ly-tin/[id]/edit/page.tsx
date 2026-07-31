'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
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
  getPropertyGroup,
  isFieldVisible,
  directionLabel,
  directionText,
  legalText,
  stripFieldsNotInGroup,
  DIRECTION_OPTIONS,
  LEGAL_OPTIONS,
  LEGAL_NEEDS_NOTE,
  FURNITURE_OPTIONS,
  PRICE_UNIT_OPTIONS,
} from '@/lib/property-form-config';
import { derivePrices, formatMoneyShort } from '@/lib/formatters';
import { ListingPreview, type ListingPreviewData } from '@/components/property/detail/ListingPreview';
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
  Sparkles,
} from 'lucide-react';

// Bản đồ dùng MapLibre nên phải nạp phía client (giống trang đăng tin).
const MapPicker = dynamic(() => import('@/components/map/MapPicker').then((m) => m.MapPicker), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
      Đang tải bản đồ...
    </div>
  ),
});

/** Base UI Select.Value in ra value thô nếu không truyền children dạng hàm — dựng nhãn sẵn. */
const optionLabel =
  (options: readonly { value: string; label: string }[], emptyLabel: string) =>
  (v: string) =>
    options.find((o) => o.value === v)?.label ?? emptyLabel;

const countLabel =
  (zeroLabel: string) =>
  (v: string) =>
    !v || v === '0' ? zeroLabel : v;

/** Mốc giá bấm nhanh — đúng 5 mốc trong bản thiết kế feedback 28/07. */
const PRICE_PRESETS: readonly { label: string; value: number }[] = [
  { label: '20 triệu', value: 20_000_000 },
  { label: '200 triệu', value: 200_000_000 },
  { label: '2 tỷ', value: 2_000_000_000 },
  { label: '20 tỷ', value: 20_000_000_000 },
  { label: '200 tỷ', value: 200_000_000_000 },
];

interface PropertyFormData {
  type: 'sell' | 'rent';
  category_id: string;
  title: string;
  description: string;
  province_id?: number;
  district_id?: number;
  ward_id?: number;
  province_name?: string;
  district_name?: string;
  ward_name?: string;
  latitude?: number;
  longitude?: number;
  street: string;

  images: Array<{ url: string; name: string; size: number; isPrimary?: boolean }>;

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
  legal_note?: string;
  features: number[];

  package_id: string;
}

const STEPS = [
  { title: 'Cơ bản', description: 'Phân loại & Vị trí' },
  { title: 'Hình ảnh', description: 'Tải lên tối đa 10 ảnh' },
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
  const [features, setFeatures] = useState<Array<{ id: number; name: string }>>([]);
  const [formData, setFormData] = useState<PropertyFormData>(emptyFormData);

  const updateFormData = (updates: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const toggleFeature = (featureId: number) => {
    const newFeatures = formData.features.includes(featureId)
      ? formData.features.filter((fid) => fid !== featureId)
      : [...formData.features, featureId];
    updateFormData({ features: newFeatures });
  };

  // Nhóm BĐS suy ra từ danh mục — quyết định trường nào hiển thị (giống trang đăng tin).
  const group = getPropertyGroup(formData.category_id);

  // Fetch categories
  useEffect(() => {
    api.get('/api/v2/categories')
      .then((res) => setApiCategories(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error('Không thể tải danh mục'));
  }, []);

  // Tải tiện ích ĐÚNG NHÓM từ API — trước đây danh sách này hardcode id 1-8, lệch bảng
  // features thật nên sửa tin lưu sai tiện ích so với thứ người dùng bấm.
  useEffect(() => {
    api.get(`/api/v2/features?group=${group}`)
      .then((res) => setFeatures(res.data?.data ?? []))
      .catch(() => setFeatures([]));
  }, [group]);

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
          package_id: data.is_vip === 'diamond' ? 'diamond'
            : data.is_vip === 'vip_plus' ? 'vip_plus'
            : data.is_vip === 'vip' ? 'vip'
            : 'normal',
        });

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
  }, [id, router]);

  /** Đổi danh mục có thể đổi nhóm BĐS — xoá các trường không còn phù hợp (giống trang đăng tin). */
  const handleCategoryChange = (categoryId: string) => {
    const nextGroup = getPropertyGroup(categoryId);
    setFormData((prev) => {
      const cleaned = stripFieldsNotInGroup(nextGroup, { ...prev, category_id: categoryId });
      return {
        ...cleaned,
        category_id: categoryId,
        bedrooms: isFieldVisible(nextGroup, 'bedrooms') ? prev.bedrooms : undefined,
        bathrooms: isFieldVisible(nextGroup, 'bathrooms') ? prev.bathrooms : undefined,
        toilets: isFieldVisible(nextGroup, 'toilets') ? prev.toilets : undefined,
        floors: isFieldVisible(nextGroup, 'floors') ? prev.floors : undefined,
        direction: isFieldVisible(nextGroup, 'direction') ? prev.direction : '',
        balcony_direction: isFieldVisible(nextGroup, 'balcony_direction') ? prev.balcony_direction : '',
        road_width: isFieldVisible(nextGroup, 'road_width') ? prev.road_width : undefined,
        facade: isFieldVisible(nextGroup, 'facade') ? prev.facade : undefined,
        legal: isFieldVisible(nextGroup, 'legal') ? prev.legal : '',
        legal_note: isFieldVisible(nextGroup, 'legal') ? prev.legal_note : '',
        furniture: isFieldVisible(nextGroup, 'furniture') ? prev.furniture : 'none',
        features: isFieldVisible(nextGroup, 'utilities') ? prev.features : [],
      } as PropertyFormData;
    });
  };

  // --- Trợ lý AI (feedback mục 5: một nút duy nhất) ---
  const [aiLoading, setAiLoading] = useState(false);
  const generateContent = async () => {
    const willOverwrite = formData.title.trim() || formData.description.trim();
    if (willOverwrite && !window.confirm('Nội dung hiện tại sẽ được thay bằng nội dung AI vừa tạo. Bạn có chắc không?')) {
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.post('/api/v2/ai/generate-listing', {
        mode: 'both',
        category_id: formData.category_id,
        street: formData.street,
        district_name: formData.district_name,
        province_name: formData.province_name,
        price: formData.price,
        price_unit: formData.price_unit,
        area: formData.area,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        toilets: formData.toilets,
        floors: formData.floors,
        direction: formData.direction,
        balcony_direction: formData.balcony_direction,
        road_width: formData.road_width,
        facade: formData.facade,
        legal: formData.legal,
        furniture: formData.furniture,
        feature_names: features.filter((f) => formData.features.includes(f.id)).map((f) => f.name),
      });
      const data = res.data?.data;
      if (!data?.title && !data?.description) throw new Error('Không nhận được nội dung');
      updateFormData({
        ...(data.title ? { title: data.title } : {}),
        ...(data.description ? { description: data.description } : {}),
      });
      toast.success('Đã tạo nội dung. Bạn có thể chỉnh sửa lại tuỳ ý.');
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Không tạo được nội dung. Vui lòng thử lại.');
    } finally {
      setAiLoading(false);
    }
  };

  // --- Ghim bản đồ + geocode (feedback mục 2) ---
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeNote, setGeocodeNote] = useState<{ type: 'ok' | 'warn'; text: string } | null>(null);
  const streetAutoFilledRef = useRef(false);
  const pinIsAutoRef = useRef(true);

  const handleMapPick = async ({ lat, lng }: { lat: number; lng: number }) => {
    pinIsAutoRef.current = false;
    updateFormData({ latitude: lat, longitude: lng });
    setIsGeocoding(true);
    setGeocodeNote(null);
    try {
      const res = await api.get(`/api/v2/geocode/reverse?lat=${lat}&lng=${lng}`);
      const d = res.data?.data ?? {};
      if (d.outside_coverage) {
        setGeocodeNote({
          type: 'warn',
          text: `Vị trí bạn ghim nằm ở ${d.province_name ?? 'ngoài tỉnh'}, không thuộc khu vực trang này phục vụ. Vui lòng ghim lại trong Quảng Ngãi.`,
        });
        return;
      }
      const patch: Partial<PropertyFormData> = {};
      if (d.address && (!formData.street.trim() || streetAutoFilledRef.current)) {
        patch.street = d.address;
        streetAutoFilledRef.current = true;
      }
      if (d.matched && d.district_id) {
        patch.province_id = d.province_id ?? formData.province_id;
        patch.district_id = d.district_id;
        patch.district_name = d.district_name;
        patch.province_name = d.province_name;
      }
      if (Object.keys(patch).length > 0) updateFormData(patch);
      setGeocodeNote(
        d.matched
          ? { type: 'ok', text: `Đã nhận diện: ${d.district_name}. Bạn có thể sửa lại nếu chưa đúng.` }
          : { type: 'warn', text: 'Chưa xác định được xã/phường từ vị trí này — vui lòng chọn thủ công ở ô phía trên.' }
      );
    } catch {
      setGeocodeNote({ type: 'warn', text: 'Không tra được địa chỉ từ vị trí này. Vị trí vẫn được lưu, bạn nhập địa chỉ thủ công nhé.' });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Tự động ghim khi nhập đủ địa chỉ (feedback mục 2). Không chạy khi đang tải dữ liệu ban đầu,
  // street do reverse tự điền, hoặc người dùng đã tự ghim.
  useEffect(() => {
    if (isLoading) return;
    const street = formData.street.trim();
    const area = [formData.ward_name, formData.district_name, formData.province_name].filter(Boolean).join(', ');
    if (!formData.province_name || !formData.district_name || !street || streetAutoFilledRef.current) return;
    if (formData.latitude != null && !pinIsAutoRef.current) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const queries = [[street, area].filter(Boolean).join(', '), area].filter(Boolean);
      setIsGeocoding(true);
      try {
        for (let i = 0; i < queries.length; i++) {
          const res = await api.get(`/api/v2/geocode/search?q=${encodeURIComponent(queries[i])}`);
          const hits: Array<{ lat: number; lng: number; in_coverage: boolean }> = res.data?.data ?? [];
          const hit = hits.find((h) => h.in_coverage) ?? hits[0];
          if (cancelled) return;
          if (hit) {
            pinIsAutoRef.current = true;
            updateFormData({ latitude: hit.lat, longitude: hit.lng });
            setGeocodeNote(
              i === 0
                ? { type: 'ok', text: 'Đã tự động ghim theo địa chỉ. Kéo ghim để chỉnh nếu chưa đúng.' }
                : { type: 'warn', text: `Chưa tra được số nhà — đã ghim tương đối theo ${formData.district_name}. Kéo ghim để chỉnh cho đúng.` }
            );
            return;
          }
        }
      } catch {
        // Geocode hỏng thì im lặng — người dùng vẫn tự ghim tay được.
      } finally {
        if (!cancelled) setIsGeocoding(false);
      }
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy lại khi địa chỉ thật đổi
  }, [formData.street, formData.province_name, formData.district_name, formData.ward_name, isLoading]);

  // Quy đổi giá real-time (feedback mục 3.3).
  const derived = derivePrices(formData.price, formData.price_unit, formData.area);
  const priceBreakdown = derived.total !== null ? { total: derived.total, perM2: derived.perM2 } : null;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!(formData.type && formData.category_id && formData.title.length >= 10 && formData.description.length >= 50 && formData.province_id && formData.district_id);
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

  const buildPayload = () => {
    const address =
      [formData.street, formData.ward_name, formData.district_name, formData.province_name]
        .filter(Boolean)
        .join(', ') || formData.street || 'Việt Nam';

    // Chỉ gửi trường thuộc nhóm BĐS đang chọn — không lưu phòng ngủ/số tầng cho đất.
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
      utilities: undefined,
    });
    delete groupFields.utilities;

    return {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      category_id: parseInt(formData.category_id, 10),
      price: formData.price,
      price_unit: formData.price_unit,
      price_negotiable: formData.price_negotiable || formData.price_unit === 'negotiable',
      area: formData.area,
      ...groupFields,
      legal_note:
        isFieldVisible(group, 'legal') && formData.legal === LEGAL_NEEDS_NOTE && formData.legal_note?.trim()
          ? formData.legal_note.trim()
          : null,
      province_id: formData.province_id,
      district_id: formData.district_id,
      ward_id: formData.ward_id || undefined,
      street: formData.street || undefined,
      address,
      latitude: formData.latitude ?? undefined,
      longitude: formData.longitude ?? undefined,
      feature_ids: isFieldVisible(group, 'utilities') && formData.features.length > 0 ? formData.features : [],
      is_vip: formData.package_id === 'normal' ? undefined : formData.package_id,
    };
  };

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
                  <Select value={formData.category_id} onValueChange={(value) => handleCategoryChange(value || '')}>
                    <SelectTrigger className="mt-2 h-12 bg-gray-50 border-gray-200 focus:ring-primary focus:border-primary">
                      <SelectValue>
                        {(v: string) => apiCategories.find((c) => String(c.id) === v)?.name ?? '-- Chọn phân khúc --'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {apiCategories.length === 0 ? (
                        <SelectItem value="loading" disabled>Đang tải danh mục...</SelectItem>
                      ) : (
                        apiCategories
                          .filter((c) => c.type === formData.type)
                          .map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <Label className="font-semibold text-gray-700">Tiêu đề tin đăng <span className="text-red-500">*</span></Label>
                    <Button
                      type="button"
                      size="sm"
                      disabled={aiLoading || !formData.category_id}
                      onClick={generateContent}
                      className="h-8 bg-primary hover:bg-primary/90 text-white"
                    >
                      {aiLoading ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Đang viết...</> : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Tạo bằng AI</>}
                    </Button>
                  </div>
                  <Input
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="VD: Nhà riêng 3 tầng mặt tiền đường Hùng Vương, sổ hồng riêng"
                    className="h-12 bg-gray-50 border-gray-200 focus:ring-primary focus:border-primary"
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
                  <p className="text-xs text-gray-500 mt-1.5">Tối thiểu 50 ký tự — {formData.description.length} ký tự</p>
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
                    // Giữ ghim chính xác nếu đã có; chỉ lấy tâm khu vực khi chưa ghim.
                    latitude: formData.latitude ?? location.latitude,
                    longitude: formData.longitude ?? location.longitude,
                    province_name: location.province_name,
                    district_name: location.district_name,
                    ward_name: location.ward_name,
                  })}
                  required
                />
                <div className="mt-5">
                  <Label className="font-semibold text-gray-700">Địa chỉ cụ thể (Số nhà, đường)</Label>
                  <Input
                    value={formData.street}
                    onChange={(e) => {
                      streetAutoFilledRef.current = false;
                      updateFormData({ street: e.target.value });
                    }}
                    placeholder="VD: 123 Đường Trần Phú..."
                    className="mt-2 h-12 bg-gray-50 border-gray-200 focus:ring-primary focus:border-primary"
                  />
                </div>

                {/* Ghim vị trí trên bản đồ (feedback mục 2) */}
                <div className="mt-5">
                  <Label className="font-semibold text-gray-700">Ghim vị trí trên bản đồ</Label>
                  <p className="text-[13px] text-gray-500 mt-1 mb-2">
                    Chọn đúng vị trí giúp người mua tìm thấy bất động sản của bạn trên bản đồ.
                  </p>
                  <MapPicker
                    value={
                      formData.latitude != null && formData.longitude != null
                        ? { lat: formData.latitude, lng: formData.longitude }
                        : undefined
                    }
                    onChange={handleMapPick}
                  />
                  {isGeocoding && (
                    <p className="text-[13px] text-gray-500 mt-2 flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Đang tra địa chỉ...
                    </p>
                  )}
                  {geocodeNote && !isGeocoding && (
                    <p className={`text-[13px] mt-2 ${geocodeNote.type === 'warn' ? 'text-red-600' : 'text-green-700'}`}>
                      {geocodeNote.text}
                    </p>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* Step 2: Images */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold text-gray-900 mb-2 pb-2 border-b">Hình ảnh</h3>

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
                <h3 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b">Diện tích & Mức giá</h3>

                {/* Diện tích trước Mức giá (feedback mục 3.1). */}
                <div className="mb-6">
                  <Label className="font-semibold text-gray-700">Diện tích <span className="text-red-500">*</span></Label>
                  <div className="relative mt-2 shadow-sm rounded-lg overflow-hidden md:w-1/2">
                    <Input
                      type="number"
                      min={0}
                      value={formData.area || ''}
                      onChange={(e) => updateFormData({ area: parseFloat(e.target.value) || 0 })}
                      placeholder="VD: 120"
                      className="h-12 bg-gray-50 focus:bg-white pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">m²</span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label className="font-semibold text-gray-700">Mức giá <span className="text-red-500">*</span></Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formData.price ? formData.price.toLocaleString('vi-VN') : ''}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          updateFormData({ price: digits ? parseInt(digits, 10) : 0 });
                        }}
                        placeholder="VD: 2.000.000.000"
                        className="mt-2 h-12 bg-gray-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-gray-700">Đơn vị</Label>
                      <Select
                        value={formData.price_unit}
                        onValueChange={(value) => updateFormData({ price_unit: (value || 'total') as PropertyFormData['price_unit'] })}
                      >
                        <SelectTrigger className="mt-2 h-12 w-full bg-gray-50 font-medium">
                          <SelectValue>{optionLabel(PRICE_UNIT_OPTIONS, 'VND')}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {PRICE_UNIT_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {PRICE_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => updateFormData({ price: preset.value, price_unit: 'total' })}
                        className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                          formData.price === preset.value && formData.price_unit === 'total'
                            ? 'border-primary bg-primary-light text-primary'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {priceBreakdown && (
                    <p className="mt-2.5 text-[13px] text-gray-600">
                      Tổng trị giá <strong className="text-gray-900">{formatMoneyShort(priceBreakdown.total)}</strong>
                      {priceBreakdown.perM2 !== null && <> (~{formatMoneyShort(priceBreakdown.perM2)}/m²)</>}
                    </p>
                  )}
                  {formData.price > 0 && formData.area <= 0 && (
                    <p className="mt-2.5 text-[13px] text-amber-700">Nhập diện tích ở trên để hệ thống tự quy đổi giá mỗi m².</p>
                  )}

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
              </section>

              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b">Thông tin chi tiết</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
                  {isFieldVisible(group, 'bedrooms') && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phòng ngủ</Label>
                      <Select value={String(formData.bedrooms ?? 0)} onValueChange={(value) => updateFormData({ bedrooms: parseInt(value || '0') })}>
                        <SelectTrigger className="mt-2 h-11 bg-gray-50"><SelectValue>{countLabel('Không có')}</SelectValue></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Không có</SelectItem>
                          {[1,2,3,4,5,6,7,8,9,10].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {isFieldVisible(group, 'bathrooms') && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phòng tắm</Label>
                      <Select value={String(formData.bathrooms ?? 0)} onValueChange={(value) => updateFormData({ bathrooms: parseInt(value || '0') })}>
                        <SelectTrigger className="mt-2 h-11 bg-gray-50"><SelectValue>{countLabel('Không có')}</SelectValue></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Không có</SelectItem>
                          {[1,2,3,4,5,6,7,8].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {isFieldVisible(group, 'toilets') && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nhà vệ sinh</Label>
                      <Select value={String(formData.toilets ?? 0)} onValueChange={(value) => updateFormData({ toilets: parseInt(value || '0') })}>
                        <SelectTrigger className="mt-2 h-11 bg-gray-50"><SelectValue>{countLabel('Không có')}</SelectValue></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Không có</SelectItem>
                          {[1,2,3,4,5,6,7,8].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {isFieldVisible(group, 'floors') && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Số tầng</Label>
                      <Select value={String(formData.floors ?? 0)} onValueChange={(value) => updateFormData({ floors: parseInt(value || '0') })}>
                        <SelectTrigger className="mt-2 h-11 bg-gray-50"><SelectValue>{countLabel('Không xác định')}</SelectValue></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Không xác định</SelectItem>
                          {[1,2,3,4,5,6,7,8,9,10].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {isFieldVisible(group, 'direction') && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">{directionLabel(group)}</Label>
                      <Select value={formData.direction || ''} onValueChange={(value) => updateFormData({ direction: value || '' })}>
                        <SelectTrigger className="mt-2 h-11 bg-gray-50"><SelectValue>{optionLabel(DIRECTION_OPTIONS, 'Tùy chọn')}</SelectValue></SelectTrigger>
                        <SelectContent>
                          {DIRECTION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {isFieldVisible(group, 'balcony_direction') && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Hướng ban công</Label>
                      <Select value={formData.balcony_direction || ''} onValueChange={(value) => updateFormData({ balcony_direction: value || '' })}>
                        <SelectTrigger className="mt-2 h-11 bg-gray-50"><SelectValue>{optionLabel(DIRECTION_OPTIONS, 'Tùy chọn')}</SelectValue></SelectTrigger>
                        <SelectContent>
                          {DIRECTION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
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
                        onValueChange={(value) => updateFormData({ legal: value || '', ...(value === LEGAL_NEEDS_NOTE ? {} : { legal_note: '' }) })}
                      >
                        <SelectTrigger className="mt-2 h-11 bg-gray-50"><SelectValue>{optionLabel(LEGAL_OPTIONS, 'Tùy chọn')}</SelectValue></SelectTrigger>
                        <SelectContent>
                          {LEGAL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {isFieldVisible(group, 'legal') && formData.legal === LEGAL_NEEDS_NOTE && (
                  <div className="mb-6">
                    <Label className="font-semibold text-gray-700">Mô tả tình trạng pháp lý</Label>
                    <Input
                      value={formData.legal_note ?? ''}
                      onChange={(e) => updateFormData({ legal_note: e.target.value })}
                      placeholder="VD: Đất đã có quyết định giao đất, đang hoàn thiện thủ tục cấp sổ"
                      maxLength={500}
                      className="mt-2 h-11 bg-gray-50"
                    />
                    <p className="mt-1.5 text-xs text-gray-500">Ghi rõ giúp người mua yên tâm hơn. Tối đa 500 ký tự.</p>
                  </div>
                )}

                {isFieldVisible(group, 'furniture') && (
                  <div className="mb-6">
                    <Label className="font-semibold text-gray-700">Tình trạng nội thất</Label>
                    <Select value={formData.furniture || 'none'} onValueChange={(value) => updateFormData({ furniture: value || '' })}>
                      <SelectTrigger className="mt-2 h-11 bg-gray-50 w-full md:w-1/2"><SelectValue>{optionLabel(FURNITURE_OPTIONS, 'Chọn tình trạng')}</SelectValue></SelectTrigger>
                      <SelectContent>
                        {FURNITURE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
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
                    onSelect={(pid) => updateFormData({ package_id: pid })}
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
