'use client';

import { useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Home, DollarSign, Loader2, MapPin } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationSelect } from '@/components/shared/LocationSelect';
import api from '@/lib/axios';
import { toast } from 'sonner';

// Bản đồ dùng Leaflet/MapLibre nên phải nạp phía client, không dựng sẵn trên server được.
// Dùng chung 1 import động cho cả 2 trang thay vì mỗi trang tự khai báo lại y hệt nhau.
const MapPicker = dynamic(() => import('@/components/map/MapPicker').then((m) => m.MapPicker), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
      Đang tải bản đồ...
    </div>
  ),
});

interface BasicInfoFieldsProps {
  type: 'sell' | 'rent';
  categoryId: string;
  apiCategories: Array<{ id: number; name: string; type: string }>;
  onTypeChange: (type: 'sell' | 'rent') => void;
  onCategoryChange: (categoryId: string) => void;
  /**
   * Trạng thái "đang tải danh mục" khác nhau nhẹ giữa 2 trang — giữ nguyên logic gốc của
   * từng trang thay vì gộp: trang đăng tin kiểm tra rỗng theo TYPE đã lọc (hiện dòng chữ
   * bên dưới danh sách), trang sửa tin kiểm tra rỗng TOÀN BỘ danh mục (hiện 1 SelectItem
   * disabled). Gộp làm một sẽ đổi hành vi một trong hai trang.
   */
  categoriesEmpty: boolean;
  emptyStateAsSelectItem?: boolean;
  /**
   * Trang sửa tin đặt tiêu đề/mô tả NGAY TRONG section "Thông tin cơ bản" (giữa danh mục và
   * địa chỉ), trong khi trang đăng tin đặt nó ở một section hoàn toàn khác, tít phía dưới.
   * Slot này cho phép trang sửa tin chèn <TitleDescriptionFields variant="inline" /> vào
   * đúng chỗ mà không phải tách section ra khỏi component dùng chung.
   */
  children?: ReactNode;
}

/** Loại tin đăng (mua bán/cho thuê) + Danh mục — giống hệt nhau giữa trang đăng tin và sửa tin. */
export function BasicInfoFields({
  type,
  categoryId,
  apiCategories,
  onTypeChange,
  onCategoryChange,
  categoriesEmpty,
  emptyStateAsSelectItem = false,
  children,
}: BasicInfoFieldsProps) {
  const filteredCategories = apiCategories.filter((c) => c.type === type);

  return (
    <section>
      <h3 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b">Thông tin cơ bản</h3>

      <div className="mb-6">
        <Label className="mb-3 block font-semibold text-gray-700">Loại tin đăng <span className="text-red-500">*</span></Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onTypeChange('sell')}
            className={`flex flex-col items-center justify-center p-5 border-2 rounded-xl transition-all duration-300 ${
              type === 'sell'
                ? 'border-primary bg-primary-light text-primary shadow-sm scale-[1.02]'
                : 'border-gray-200 hover:border-gray-300 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Home className="h-7 w-7 mb-2" />
            <p className="font-bold">Mua bán</p>
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('rent')}
            className={`flex flex-col items-center justify-center p-5 border-2 rounded-xl transition-all duration-300 ${
              type === 'rent'
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
        <Select value={categoryId} onValueChange={(value) => onCategoryChange(value || '')}>
          <SelectTrigger className="mt-2 h-12 bg-gray-50 border-gray-200 focus:ring-primary focus:border-primary">
            <SelectValue>
              {(v: string) => apiCategories.find((c) => String(c.id) === v)?.name ?? '-- Chọn phân khúc --'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {emptyStateAsSelectItem ? (
              categoriesEmpty ? (
                <SelectItem value="loading" disabled>Đang tải danh mục...</SelectItem>
              ) : (
                filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                ))
              )
            ) : (
              <>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                ))}
                {categoriesEmpty && (
                  <div className="px-3 py-6 text-center text-sm text-gray-400">
                    Đang tải danh mục...
                  </div>
                )}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {children}
    </section>
  );
}

interface AddressLocationValue {
  province_id?: number;
  district_id?: number;
  ward_id?: number;
  province_name?: string;
  district_name?: string;
  ward_name?: string;
  latitude?: number;
  longitude?: number;
}

interface AddressMapFieldsProps {
  location: AddressLocationValue;
  onLocationChange: (location: AddressLocationValue) => void;
  street: string;
  onStreetChange: (value: string) => void;
  /** Chỉ trang đăng tin hiện gợi ý tên đơn vị hành chính cũ — trang sửa tin không có. */
  formerUnits?: string[];
  onMapPick: (value: { lat: number; lng: number }) => void;
  isGeocoding: boolean;
  geocodeNote: { type: 'ok' | 'warn'; text: string } | null;
  /** Chữ hiển thị khi đang tra địa chỉ — 2 trang lệch nhau 1 chút, giữ nguyên từng trang. */
  geocodingMessage?: string;
}

/** Địa chỉ bất động sản: LocationSelect + số nhà + ghim bản đồ — giống hệt nhau giữa 2 trang. */
export function AddressMapFields({
  location,
  onLocationChange,
  street,
  onStreetChange,
  formerUnits = [],
  onMapPick,
  isGeocoding,
  geocodeNote,
  geocodingMessage = 'Đang tra địa chỉ từ vị trí đã ghim...',
}: AddressMapFieldsProps) {
  // Dán link Google Maps để tự ghim (feedback I.2) — vẫn giữ nguyên ghim thủ công bên dưới,
  // đây chỉ là cách điền nhanh hơn, không thay thế MapPicker.
  const [mapsLink, setMapsLink] = useState('');
  const [resolvingLink, setResolvingLink] = useState(false);

  const resolveMapsLink = async () => {
    const url = mapsLink.trim();
    if (!url) return;
    setResolvingLink(true);
    try {
      const res = await api.get('/api/v2/geocode/resolve-maps-link', { params: { url } });
      const { lat, lng } = res.data?.data ?? {};
      if (typeof lat === 'number' && typeof lng === 'number') {
        await onMapPick({ lat, lng });
        setMapsLink('');
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Không đọc được toạ độ từ link này.');
    } finally {
      setResolvingLink(false);
    }
  };

  return (
    <section>
      <h3 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b">Địa chỉ bất động sản</h3>
      <LocationSelect
        value={{
          province_id: location.province_id,
          district_id: location.district_id,
          ward_id: location.ward_id,
        }}
        onChange={(loc) =>
          onLocationChange({
            province_id: loc.province_id,
            district_id: loc.district_id,
            ward_id: loc.ward_id,
            // LocationSelect trả về toạ độ TÂM TỈNH. Nếu người dùng đã ghim chính xác trên
            // bản đồ thì giữ nguyên ghim đó — nếu không, chỉ cần đổi lại xã/phường là vị trí
            // chính xác bị đẩy về giữa tỉnh.
            latitude: location.latitude ?? loc.latitude,
            longitude: location.longitude ?? loc.longitude,
            // Giữ lại tên để AI mô tả địa chỉ bằng chữ, không phải id.
            province_name: loc.province_name,
            district_name: loc.district_name,
            ward_name: loc.ward_name,
          })
        }
        required
      />
      <div className="mt-5">
        <Label className="font-semibold text-gray-700">Địa chỉ cụ thể (Số nhà, đường)</Label>
        <Input
          value={street}
          onChange={(e) => onStreetChange(e.target.value)}
          placeholder="VD: 123 Đường Trần Phú..."
          className="mt-2 h-12 bg-gray-50 border-gray-200 focus:ring-primary focus:border-primary"
        />
      </div>

      {/* Nhắc tên đơn vị hành chính trước sáp nhập 2025 — nhiều người bán vẫn quen gọi theo
          tên cũ nên khó nhận ra xã/phường mới có phải khu của mình không. */}
      {formerUnits.length > 0 && (
        <p className="mt-2 text-[13px] text-gray-500">
          Trước sáp nhập: {formerUnits.join(', ')}
        </p>
      )}

      {/* Dán link Google Maps để tự ghim (feedback I.2) — cách nhanh cho người đã có sẵn vị
          trí trên Google Maps, không bắt buộc, vẫn ghim tay được như bình thường bên dưới. */}
      <div className="mt-5">
        <Label className="font-semibold text-gray-700">Dán link Google Maps (không bắt buộc)</Label>
        <div className="mt-2 flex gap-2">
          <Input
            value={mapsLink}
            onChange={(e) => setMapsLink(e.target.value)}
            placeholder="VD: https://maps.app.goo.gl/... hoặc link Google Maps đầy đủ"
            className="h-11 bg-gray-50 border-gray-200 focus:ring-primary focus:border-primary"
          />
          <Button
            type="button"
            variant="outline"
            onClick={resolveMapsLink}
            disabled={!mapsLink.trim() || resolvingLink}
            className="h-11 shrink-0 gap-1.5"
          >
            {resolvingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            Dùng vị trí này
          </Button>
        </div>
      </div>

      {/* Chọn vị trí trên bản đồ — khách hàng muốn ghim thay vì gõ tay. */}
      <div className="mt-5">
        <Label className="font-semibold text-gray-700">Ghim vị trí trên bản đồ</Label>
        <p className="text-[13px] text-gray-500 mt-1 mb-2">
          Chọn đúng vị trí giúp người mua tìm thấy bất động sản của bạn trên bản đồ.
        </p>
        <MapPicker
          value={
            location.latitude != null && location.longitude != null
              ? { lat: location.latitude, lng: location.longitude }
              : undefined
          }
          onChange={onMapPick}
        />
        {isGeocoding && (
          <p className="text-[13px] text-gray-500 mt-2 flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {geocodingMessage}
          </p>
        )}
        {geocodeNote && !isGeocoding && (
          <p className={`text-[13px] mt-2 ${geocodeNote.type === 'warn' ? 'text-red-600' : 'text-green-700'}`}>
            {geocodeNote.text}
          </p>
        )}
      </div>
    </section>
  );
}
