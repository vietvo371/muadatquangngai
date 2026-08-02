'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  isFieldVisible,
  directionLabel,
  DIRECTION_OPTIONS,
  LEGAL_OPTIONS,
  LEGAL_NEEDS_NOTE,
  FURNITURE_OPTIONS,
  PRICE_UNIT_OPTIONS,
  PRICE_DISPLAY_FORMAT_OPTIONS,
  type PropertyGroup,
} from '@/lib/property-form-config';
import { derivePrices, formatMoneyShort, formatPriceByMode } from '@/lib/formatters';

/**
 * Base UI `Select.Value` in ra GIÁ TRỊ THÔ khi không truyền children dạng hàm — với mọi
 * Select dùng id/mã làm value thì người dùng nhìn thấy con số vô nghĩa thay vì tên. Hai
 * helper dưới đây dựng sẵn hàm hiển thị nhãn, để không lặp lại tìm-nhãn ở từng chỗ.
 * Lưu ý: children ghi đè cả prop `placeholder`, nên hàm phải tự trả về nhãn rỗng.
 */
const optionLabel =
  (options: readonly { value: string; label: string }[], emptyLabel: string) =>
  (v: string) =>
    options.find((o) => o.value === v)?.label ?? emptyLabel;

/** Select số lượng (phòng ngủ, số tầng...) — value là chuỗi số, "0" nghĩa là không có. */
const countLabel =
  (zeroLabel: string) =>
  (v: string) =>
    !v || v === '0' ? zeroLabel : v;

/** Mốc giá bấm nhanh — đúng 5 mốc trong bản thiết kế kèm feedback 28/07. */
const PRICE_PRESETS: readonly { label: string; value: number }[] = [
  { label: '20 triệu', value: 20_000_000 },
  { label: '200 triệu', value: 200_000_000 },
  { label: '2 tỷ', value: 2_000_000_000 },
  { label: '20 tỷ', value: 20_000_000_000 },
  { label: '200 tỷ', value: 200_000_000_000 },
];

export interface PriceDetailsData {
  price: number;
  price_unit: 'total' | 'per_m2' | 'per_month' | 'negotiable';
  price_negotiable: boolean;
  /** Cách hiển thị giá cho người mua xem (feedback I.3). */
  price_display_format: 'short' | 'million' | 'mixed';
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
}

interface PriceDetailsFieldsProps {
  data: PriceDetailsData;
  onChange: (updates: Partial<PriceDetailsData>) => void;
  group: PropertyGroup;
  features: Array<{ id: number; name: string }>;
  selectedFeatureIds: number[];
  onToggleFeature: (featureId: number) => void;
}

/**
 * Diện tích + Mức giá + Thông tin chi tiết (trường riêng theo nhóm BĐS) + Tiện ích kèm
 * theo. Giống hệt nhau giữa trang đăng tin và trang sửa tin.
 */
export function PriceDetailsFields({
  data,
  onChange,
  group,
  features,
  selectedFeatureIds,
  onToggleFeature,
}: PriceDetailsFieldsProps) {
  /** Quy đổi giá hiển thị ngay dưới ô nhập (feedback mục 3.3). Chỉ trả về khi có tổng giá
   * thật — thiếu diện tích thì `perM2` là null và phần đó tự ẩn, không hiện "0/m²". */
  const derived = derivePrices(data.price, data.price_unit, data.area);
  const priceBreakdown = derived.total !== null ? { total: derived.total, perM2: derived.perM2 } : null;

  return (
    <>
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b">Diện tích & Mức giá</h3>

        {/* Diện tích đặt TRƯỚC mức giá (feedback 28/07) — người bán nghĩ theo trình tự "đất
            bao nhiêu m² rồi mới bao nhiêu tiền", và phần quy đổi giá/m² bên dưới cũng cần
            diện tích mới tính được. */}
        <div className="mb-6">
          <Label className="font-semibold text-gray-700">Diện tích <span className="text-red-500">*</span></Label>
          <div className="relative mt-2 shadow-sm rounded-lg overflow-hidden md:w-1/2">
            <Input
              type="number"
              min={0}
              value={data.area || ''}
              onChange={(e) => onChange({ area: parseFloat(e.target.value) || 0 })}
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
              {/* Ô text chứ không phải type="number": input số không cho chèn dấu phân cách
                  nghìn, mà "2000000000" thì không ai đọc nổi có đúng 2 tỷ hay không. */}
              <Input
                type="text"
                inputMode="numeric"
                value={data.price ? data.price.toLocaleString('vi-VN') : ''}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  onChange({ price: digits ? parseInt(digits, 10) : 0 });
                }}
                placeholder="VD: 2.000.000.000"
                className="mt-2 h-12 bg-gray-50 focus:bg-white"
              />
            </div>
            <div>
              <Label className="font-semibold text-gray-700">Đơn vị</Label>
              <Select
                value={data.price_unit}
                onValueChange={(value) => onChange({ price_unit: (value || 'total') as PriceDetailsData['price_unit'] })}
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

          {/* Mức giá gợi ý nhanh — đúng các mốc trong bản thiết kế feedback. */}
          <div className="mt-3 flex flex-wrap gap-2">
            {PRICE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => onChange({ price: preset.value, price_unit: 'total' })}
                className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  data.price === preset.value && data.price_unit === 'total'
                    ? 'border-primary bg-primary-light text-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Quy đổi hai chiều, cập nhật ngay khi gõ (feedback mục 3.3). Chỉ hiện khi quy
              đổi được thật — thiếu diện tích thì im lặng, không hiện số 0. */}
          {priceBreakdown && (
            <p className="mt-2.5 text-[13px] text-gray-600">
              Tổng trị giá <strong className="text-gray-900">{formatMoneyShort(priceBreakdown.total)}</strong>
              {priceBreakdown.perM2 !== null && (
                <> (~{formatMoneyShort(priceBreakdown.perM2)}/m²)</>
              )}
            </p>
          )}
          {data.price > 0 && data.area <= 0 && (
            <p className="mt-2.5 text-[13px] text-amber-700">
              Nhập diện tích ở trên để hệ thống tự quy đổi giá mỗi m².
            </p>
          )}

          <div className="mt-3 flex items-center">
            <Checkbox
              id="negotiable"
              checked={data.price_negotiable}
              onCheckedChange={(checked) => onChange({ price_negotiable: !!checked })}
            />
            <Label htmlFor="negotiable" className="ml-2 cursor-pointer text-sm font-medium text-gray-700">
              Giá có thể thương lượng
            </Label>
          </div>

          {/* Cách hiển thị giá cho người mua xem (feedback I.3) — chỉ đổi CÁCH VIẾT, không
              đổi số tiền thật. Ẩn khi thoả thuận vì lúc đó không hiện số. */}
          {!data.price_negotiable && data.price_unit !== 'negotiable' && data.price > 0 && (
            <div className="mt-4">
              <Label className="font-semibold text-gray-700">Cách hiển thị giá cho người mua</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRICE_DISPLAY_FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ price_display_format: opt.value as PriceDetailsData['price_display_format'] })}
                    className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      data.price_display_format === opt.value
                        ? 'border-primary bg-primary-light text-primary'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {formatPriceByMode(data.price, opt.value as PriceDetailsData['price_display_format'])}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Thông tin chi tiết — trường hiển thị phụ thuộc nhóm BĐS (spec mục 11.2). Nhóm đất
          không có phòng ngủ/phòng tắm/số tầng/hướng ban công/nội thất. */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b">Thông tin chi tiết</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
          {isFieldVisible(group, 'bedrooms') && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Phòng ngủ</Label>
              <Select
                value={String(data.bedrooms ?? 0)}
                onValueChange={(value) => onChange({ bedrooms: parseInt(value || '0') })}
              >
                <SelectTrigger className="mt-2 h-11 bg-gray-50">
                  <SelectValue>{countLabel('Không có')}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Không có</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {isFieldVisible(group, 'bathrooms') && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Phòng tắm</Label>
              <Select
                value={String(data.bathrooms ?? 0)}
                onValueChange={(value) => onChange({ bathrooms: parseInt(value || '0') })}
              >
                <SelectTrigger className="mt-2 h-11 bg-gray-50">
                  <SelectValue>{countLabel('Không có')}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Không có</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {isFieldVisible(group, 'toilets') && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Nhà vệ sinh</Label>
              <Select
                value={String(data.toilets ?? 0)}
                onValueChange={(value) => onChange({ toilets: parseInt(value || '0') })}
              >
                <SelectTrigger className="mt-2 h-11 bg-gray-50">
                  <SelectValue>{countLabel('Không có')}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Không có</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {isFieldVisible(group, 'floors') && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Số tầng</Label>
              <Select
                value={String(data.floors ?? 0)}
                onValueChange={(value) => onChange({ floors: parseInt(value || '0') })}
              >
                <SelectTrigger className="mt-2 h-11 bg-gray-50">
                  <SelectValue>{countLabel('Không xác định')}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Không xác định</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {isFieldVisible(group, 'direction') && (
            <div>
              <Label className="text-sm font-medium text-gray-600">{directionLabel(group)}</Label>
              <Select
                value={data.direction || ''}
                onValueChange={(value) => onChange({ direction: value || '' })}
              >
                <SelectTrigger className="mt-2 h-11 bg-gray-50">
                  <SelectValue>{optionLabel(DIRECTION_OPTIONS, 'Tùy chọn')}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DIRECTION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {isFieldVisible(group, 'balcony_direction') && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Hướng ban công</Label>
              <Select
                value={data.balcony_direction || ''}
                onValueChange={(value) => onChange({ balcony_direction: value || '' })}
              >
                <SelectTrigger className="mt-2 h-11 bg-gray-50">
                  <SelectValue>{optionLabel(DIRECTION_OPTIONS, 'Tùy chọn')}</SelectValue>
                </SelectTrigger>
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
                value={data.road_width ?? ''}
                onChange={(e) => onChange({ road_width: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
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
                value={data.facade ?? ''}
                onChange={(e) => onChange({ facade: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                placeholder="VD: 4.5"
                className="mt-2 h-11 bg-gray-50"
              />
            </div>
          )}

          {isFieldVisible(group, 'legal') && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Pháp lý</Label>
              <Select
                value={data.legal || ''}
                onValueChange={(value) =>
                  onChange({
                    legal: value || '',
                    // Đổi sang loại pháp lý khác thì phần mô tả tự do không còn đúng ngữ
                    // cảnh — xoá luôn để không lưu chú thích lạc đề xuống DB.
                    ...(value === LEGAL_NEEDS_NOTE ? {} : { legal_note: '' }),
                  })
                }
              >
                <SelectTrigger className="mt-2 h-11 bg-gray-50">
                  <SelectValue>{optionLabel(LEGAL_OPTIONS, 'Tùy chọn')}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LEGAL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Ô mô tả pháp lý — chỉ hiện khi chọn "Khác" (feedback 28/07 mục 4), lưu vào cột
            properties.legal_note đã có sẵn nên không cần migration. */}
        {isFieldVisible(group, 'legal') && data.legal === LEGAL_NEEDS_NOTE && (
          <div className="mb-6">
            <Label className="font-semibold text-gray-700">Mô tả tình trạng pháp lý</Label>
            <Input
              value={data.legal_note ?? ''}
              onChange={(e) => onChange({ legal_note: e.target.value })}
              placeholder="VD: Đất đã có quyết định giao đất, đang hoàn thiện thủ tục cấp sổ"
              maxLength={500}
              className="mt-2 h-11 bg-gray-50"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Ghi rõ giúp người mua yên tâm hơn. Tối đa 500 ký tự.
            </p>
          </div>
        )}

        {isFieldVisible(group, 'furniture') && (
          <div className="mb-6">
            <Label className="font-semibold text-gray-700">Tình trạng nội thất</Label>
            <Select
              value={data.furniture || 'none'}
              onValueChange={(value) => onChange({ furniture: value || '' })}
            >
              <SelectTrigger className="mt-2 h-11 bg-gray-50 w-full md:w-1/2">
                <SelectValue>{optionLabel(FURNITURE_OPTIONS, 'Chọn tình trạng')}</SelectValue>
              </SelectTrigger>
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
                    checked={selectedFeatureIds.includes(feature.id)}
                    onCheckedChange={() => onToggleFeature(feature.id)}
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
    </>
  );
}
