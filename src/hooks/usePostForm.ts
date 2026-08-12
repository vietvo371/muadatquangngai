'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import {
  getPropertyGroup,
  getCategoryFields,
  stripFieldsNotInList,
  type PropertyFormData,
  type GroupField,
} from '@/lib/property-form-config';

interface ApiCategory {
  id: number;
  name: string;
  type: string;
  detail_fields?: string | null;
}

/**
 * Phần logic GIỐNG HỆT NHAU giữa form đăng tin (dang-tin) và form sửa tin (edit):
 * danh mục, tiện ích theo nhóm, đổi danh mục xoá field không còn phù hợp, sinh nội
 * dung bằng AI, ghim bản đồ + geocode (thuận và ngược). Tách ra đây để 2 trang không
 * còn phải sửa lặp lại y hệt nhau mỗi khi các phần này cần thay đổi.
 *
 * `skipAutoGeocode`: trang sửa tin truyền `isLoading` vào đây để không tự geocode
 * trong lúc đang nạp dữ liệu tin cũ (nếu không sẽ đè lên toạ độ đã lưu).
 */
export function usePostForm({
  formData,
  updateFormData,
  skipAutoGeocode = false,
}: {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
  skipAutoGeocode?: boolean;
}) {
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [features, setFeatures] = useState<Array<{ id: number; name: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeNote, setGeocodeNote] = useState<{ type: 'ok' | 'warn'; text: string } | null>(null);

  // Đánh dấu ô "Địa chỉ cụ thể" đang chứa giá trị TỰ ĐIỀN (từ ghim bản đồ), khác với giá trị
  // người dùng tự gõ. Chỉ khi đang tự điền mới cho phép lần ghim tiếp theo ghi đè tiếp.
  const streetAutoFilledRef = useRef(false);
  // Ghim hiện tại do hệ thống tự đặt hay do người dùng chủ động click/kéo.
  const pinIsAutoRef = useRef(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/api/v2/categories');
        setApiCategories(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
        toast.error('Không thể tải danh mục');
      }
    };
    loadCategories();
  }, []);

  // Nhóm BĐS suy ra từ danh mục — dùng cho nhãn "Hướng đất/nhà" + fetch tiện ích + fallback.
  const group = getPropertyGroup(formData.category_id);

  // Field hiển thị cho danh mục đang chọn (feedback #4): ưu tiên detail_fields admin cấu hình,
  // rỗng thì fallback theo nhóm BĐS. Là nguồn sự thật cho việc ẩn/hiện field ở form.
  const currentCategory = apiCategories.find((c) => String(c.id) === String(formData.category_id));
  const visibleFields: GroupField[] = getCategoryFields(currentCategory?.detail_fields, formData.category_id);

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

  /**
   * Đổi danh mục có thể đổi luôn nhóm BĐS — dữ liệu của trường không còn phù hợp phải bị
   * xoá, không được gửi lên backend (vd. chuyển từ nhà riêng sang đất nền thì số phòng ngủ
   * / số tầng / nội thất đã nhập phải biến mất).
   */
  const handleCategoryChange = (categoryId: string) => {
    const nextCategory = apiCategories.find((c) => String(c.id) === String(categoryId));
    const nextFields = getCategoryFields(nextCategory?.detail_fields, categoryId);
    const has = (f: GroupField) => nextFields.includes(f);
    updateFormData(
      (() => {
        const cleaned = stripFieldsNotInList(nextFields, { ...formData, category_id: categoryId });
        return {
          ...cleaned,
          category_id: categoryId,
          bedrooms: has('bedrooms') ? formData.bedrooms : undefined,
          bathrooms: has('bathrooms') ? formData.bathrooms : undefined,
          toilets: has('toilets') ? formData.toilets : undefined,
          floors: has('floors') ? formData.floors : undefined,
          direction: has('direction') ? formData.direction : '',
          balcony_direction: has('balcony_direction') ? formData.balcony_direction : '',
          road_width: has('road_width') ? formData.road_width : undefined,
          facade: has('facade') ? formData.facade : undefined,
          legal: has('legal') ? formData.legal : '',
          legal_note: has('legal') ? formData.legal_note : '',
          furniture: has('furniture') ? formData.furniture : 'none',
          features: has('utilities') ? formData.features : [],
        } as Partial<PropertyFormData>;
      })()
    );
  };

  /**
   * Gọi AI viết CẢ tiêu đề lẫn mô tả trong một lượt. "Không tự động ghi đè nội dung đã
   * nhập mà không có xác nhận" — nên nếu đã có chữ thì hỏi trước.
   */
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
        // Gửi TÊN tiện ích thay vì id để AI hiểu được nội dung.
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

  /**
   * Người dùng ghim một điểm trên bản đồ. Toạ độ luôn được lưu ngay. Địa chỉ và xã/phường
   * chỉ điền khi tra ngược ra kết quả chắc chắn — không đoán bừa.
   */
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
          : {
              type: 'warn',
              text: 'Chưa xác định được xã/phường từ vị trí này — vui lòng chọn thủ công ở ô phía trên.',
            }
      );
    } catch {
      setGeocodeNote({
        type: 'warn',
        text: 'Không tra được địa chỉ từ vị trí này. Vị trí vẫn được lưu, bạn nhập địa chỉ thủ công nhé.',
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  /**
   * Tự động ghim vị trí trên bản đồ khi người dùng đã nhập đủ địa chỉ. Chỉ chạy khi có đủ
   * tỉnh + xã/phường + địa chỉ cụ thể do NGƯỜI DÙNG gõ, và người dùng CHƯA tự đặt ghim.
   * Lùi dần khi không tra được địa chỉ chi tiết: [số nhà + khu vực] → [chỉ khu vực].
   */
  useEffect(() => {
    if (skipAutoGeocode) return;
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
        // Geocode hỏng thì im lặng — người dùng vẫn tự ghim tay được, không chặn luồng.
      } finally {
        if (!cancelled) setIsGeocoding(false);
      }
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy lại khi địa chỉ thật đổi
  }, [formData.street, formData.province_name, formData.district_name, formData.ward_name, skipAutoGeocode]);

  return {
    apiCategories,
    features,
    group,
    visibleFields,
    aiLoading,
    generateContent,
    handleCategoryChange,
    isGeocoding,
    geocodeNote,
    handleMapPick,
    // Trả ra để trang gắn vào ô "Địa chỉ cụ thể": người dùng gõ tay phải tắt cờ tự điền,
    // nếu không lần ghim bản đồ tiếp theo sẽ ghi đè chữ họ vừa gõ.
    streetAutoFilledRef,
    // Trả ra để trang tự đặt lại khi khôi phục bản nháp/dữ liệu tin cũ đã có toạ độ sẵn —
    // nếu không, auto-geocode có thể tưởng đây là ghim tự động và đè lên toạ độ đã lưu.
    pinIsAutoRef,
  };
}
