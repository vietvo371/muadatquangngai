'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Search, ChevronDown, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { FilterState, FilterContext, getCategoriesForContext } from './FilterSidebar';
import { RegionSelect } from '@/components/shared/RegionSelect';
import { formatPrice } from '@/lib/formatters';
import { DIRECTION_OPTIONS, LEGAL_OPTIONS } from '@/lib/property-form-config';
import { shortFeatureName } from '@/lib/feature-icons';
import axios from '@/lib/axios';

interface FilterHorizontalProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onReset: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  context?: FilterContext;
}

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'area_desc', label: 'Diện tích lớn nhất' },
  { value: 'views_desc', label: 'Xem nhiều nhất' },
];

const PRICE_PRESETS: Array<{ label: string; min: number | ''; max: number | '' }> = [
  { label: 'Dưới 1 tỷ', min: '', max: 1_000_000_000 },
  { label: '1 - 3 tỷ', min: 1_000_000_000, max: 3_000_000_000 },
  { label: '3 - 5 tỷ', min: 3_000_000_000, max: 5_000_000_000 },
  { label: 'Trên 5 tỷ', min: 5_000_000_000, max: '' },
];

const AREA_PRESETS: Array<{ label: string; min: number | ''; max: number | '' }> = [
  { label: 'Dưới 50 m²', min: '', max: 50 },
  { label: '50 - 100 m²', min: 50, max: 100 },
  { label: '100 - 200 m²', min: 100, max: 200 },
  { label: 'Trên 200 m²', min: 200, max: '' },
];

const BEDROOM_OPTIONS = [
  { value: 'any', label: 'Bất kỳ' }, { value: '1', label: '1' }, { value: '2', label: '2' },
  { value: '3', label: '3' }, { value: '4', label: '4+' },
];
const BATHROOM_OPTIONS = [
  { value: 'any', label: 'Bất kỳ' }, { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3+' },
];

type DropdownKey = 'more' | 'type' | 'price' | 'area' | 'region' | 'features' | 'sort';
interface FeatureOption { id: number; name: string }

/**
 * Thanh lọc một hàng dạng chip (thiết kế 23/09): Bộ lọc · Loại nhà đất · Giá · Diện tích ·
 * Khu vực · Tiện ích · Sắp xếp, ô tìm kiếm ở cuối hàng.
 *
 * Bản trước có hai công tắc "Tin xác thực" / "Môi giới chuyên nghiệp" chỉ đổi trạng thái hiển thị
 * mà không lọc gì, và ô tìm kiếm, diện tích, hướng, pháp lý đều không được gửi lên API — đã gỡ
 * công tắc và nối đủ các bộ lọc còn lại (xem PropertyListingPage + api/v2/properties).
 */
export function FilterHorizontal({
  filters,
  onFilterChange,
  onReset,
  searchQuery,
  onSearchQueryChange,
  sort,
  onSortChange,
  context = 'sell',
}: FilterHorizontalProps) {
  const [open, setOpen] = useState<DropdownKey | null>(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [featureOptions, setFeatureOptions] = useState<FeatureOption[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const propertyTypes = getCategoriesForContext(context);

  // Từ khoá đổi từ bên ngoài (back/forward, bấm xoá lọc) thì đồng bộ lại ô nhập ngay trong lúc
  // render — mẫu "điều chỉnh state khi prop đổi" của React, tránh setState trong effect.
  const [syncedQuery, setSyncedQuery] = useState(searchQuery);
  if (syncedQuery !== searchQuery) {
    setSyncedQuery(searchQuery);
    setLocalSearch(searchQuery);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Danh sách tiện ích lấy từ DB (chung với form đăng tin) — không hardcode id.
  useEffect(() => {
    let cancelled = false;
    axios
      .get('/api/v2/features')
      .then((res) => {
        if (!cancelled && Array.isArray(res.data?.data)) setFeatureOptions(res.data.data);
      })
      .catch(() => { /* thiếu danh sách thì chip Tiện ích hiện thông báo trống, không chặn trang */ });
    return () => { cancelled = true; };
  }, []);

  const toggle = (key: DropdownKey) => setOpen((cur) => (cur === key ? null : key));
  const submitSearch = () => onSearchQueryChange(localSearch.trim());

  const toggleInList = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const hasPrice = filters.priceMin !== '' || filters.priceMax !== '';
  const hasArea = filters.areaMin !== '' || filters.areaMax !== '';
  const moreCount =
    Number(filters.bedrooms !== 'any') + Number(filters.bathrooms !== 'any') +
    Number(!!filters.direction) + Number(!!filters.legal);
  const activeCount =
    moreCount + Number(filters.types.length > 0) + Number(hasPrice) + Number(hasArea) +
    Number(filters.district !== '') + Number(filters.features.length > 0);

  const rangeLabel = (min: number | '', max: number | '', fmt: (v: number) => string, fallback: string) => {
    if (min === '' && max === '') return fallback;
    if (max === '') return `Trên ${fmt(min as number)}`;
    if (min === '') return `Dưới ${fmt(max as number)}`;
    return `${fmt(min)} - ${fmt(max)}`;
  };

  const typeLabel =
    filters.types.length === 0
      ? 'Loại nhà đất'
      : filters.types.length === 1
        ? propertyTypes.find((t) => String(t.id) === filters.types[0])?.name ?? 'Loại nhà đất'
        : `${filters.types.length} loại nhà đất`;
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Mới nhất';

  return (
    <div ref={containerRef} className="sticky top-[60px] z-30 -mx-4 mb-5 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-gray-700">
        {/* Bộ lọc — nút tối, số đếm = số nhóm lọc đang bật; mở phần lọc nâng cao. */}
        <Chip
          dark
          active={open === 'more'}
          onClick={() => toggle('more')}
          icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
          label={activeCount > 0 ? `Bộ lọc ${activeCount}` : 'Bộ lọc'}
          noChevron
        >
          {open === 'more' && (
            <Panel wide onClose={() => setOpen(null)} onClear={onReset} clearLabel="Đặt lại tất cả">
              <PanelSection title="Số phòng ngủ">
                <OptionRow options={BEDROOM_OPTIONS} value={filters.bedrooms} onChange={(v) => onFilterChange({ bedrooms: v })} />
              </PanelSection>
              <PanelSection title="Số phòng tắm">
                <OptionRow options={BATHROOM_OPTIONS} value={filters.bathrooms} onChange={(v) => onFilterChange({ bathrooms: v })} />
              </PanelSection>
              <PanelSection title="Hướng nhà">
                <OptionRow
                  options={DIRECTION_OPTIONS.filter((o) => o.value !== 'khong_xac_dinh')}
                  value={filters.direction}
                  onChange={(v) => onFilterChange({ direction: filters.direction === v ? '' : v })}
                />
              </PanelSection>
              <PanelSection title="Pháp lý">
                <OptionRow
                  options={LEGAL_OPTIONS}
                  value={filters.legal}
                  onChange={(v) => onFilterChange({ legal: filters.legal === v ? '' : v })}
                />
              </PanelSection>
            </Panel>
          )}
        </Chip>

        <Chip active={filters.types.length > 0} open={open === 'type'} onClick={() => toggle('type')} label={typeLabel}>
          {open === 'type' && (
            <Panel onClose={() => setOpen(null)} onClear={() => onFilterChange({ types: [] })}>
              <div className="max-h-72 space-y-2.5 overflow-auto">
                {propertyTypes.map((t) => (
                  <label key={t.id} className="group flex cursor-pointer items-center gap-2.5">
                    <Checkbox
                      checked={filters.types.includes(String(t.id))}
                      onCheckedChange={() => onFilterChange({ types: toggleInList(filters.types, String(t.id)) })}
                      className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <span className="text-[13px] text-gray-700 group-hover:text-gray-900">{t.name}</span>
                  </label>
                ))}
              </div>
            </Panel>
          )}
        </Chip>

        <Chip
          active={hasPrice}
          open={open === 'price'}
          onClick={() => toggle('price')}
          label={rangeLabel(filters.priceMin, filters.priceMax, formatPrice, 'Giá')}
        >
          {open === 'price' && (
            <Panel onClose={() => setOpen(null)} onClear={() => onFilterChange({ priceMin: '', priceMax: '' })}>
              <RangeInputs
                min={filters.priceMin}
                max={filters.priceMax}
                minPlaceholder="Từ (VNĐ)"
                maxPlaceholder="Đến (VNĐ)"
                onChange={(min, max) => onFilterChange({ priceMin: min, priceMax: max })}
              />
              <Presets
                presets={PRICE_PRESETS}
                min={filters.priceMin}
                max={filters.priceMax}
                onPick={(min, max) => onFilterChange({ priceMin: min, priceMax: max })}
              />
            </Panel>
          )}
        </Chip>

        <Chip
          active={hasArea}
          open={open === 'area'}
          onClick={() => toggle('area')}
          label={rangeLabel(filters.areaMin, filters.areaMax, (v) => `${v} m²`, 'Diện tích')}
        >
          {open === 'area' && (
            <Panel onClose={() => setOpen(null)} onClear={() => onFilterChange({ areaMin: '', areaMax: '' })}>
              <RangeInputs
                min={filters.areaMin}
                max={filters.areaMax}
                minPlaceholder="Từ m²"
                maxPlaceholder="Đến m²"
                onChange={(min, max) => onFilterChange({ areaMin: min, areaMax: max })}
              />
              <Presets
                presets={AREA_PRESETS}
                min={filters.areaMin}
                max={filters.areaMax}
                onPick={(min, max) => onFilterChange({ areaMin: min, areaMax: max })}
              />
            </Panel>
          )}
        </Chip>

        <Chip
          active={filters.district !== ''}
          open={open === 'region'}
          onClick={() => toggle('region')}
          label={filters.district !== '' ? 'Khu vực đã chọn' : 'Khu vực'}
        >
          {open === 'region' && (
            <Panel onClose={() => setOpen(null)} onClear={() => onFilterChange({ district: '' })}>
              <RegionSelect
                value={filters.district}
                onChange={(id) => onFilterChange({ district: id })}
                buttonClassName="flex h-9 w-full items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[13px] text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </Panel>
          )}
        </Chip>

        <Chip
          active={filters.features.length > 0}
          open={open === 'features'}
          onClick={() => toggle('features')}
          label={filters.features.length > 0 ? `Tiện ích (${filters.features.length})` : 'Tiện ích'}
        >
          {open === 'features' && (
            <Panel wide onClose={() => setOpen(null)} onClear={() => onFilterChange({ features: [] })}>
              {featureOptions.length === 0 ? (
                <p className="text-[13px] text-gray-500">Chưa tải được danh sách tiện ích.</p>
              ) : (
                <div className="grid max-h-72 grid-cols-2 gap-x-4 gap-y-2.5 overflow-auto">
                  {featureOptions.map((f) => (
                    <label key={f.id} className="group flex cursor-pointer items-center gap-2.5">
                      <Checkbox
                        checked={filters.features.includes(String(f.id))}
                        onCheckedChange={() => onFilterChange({ features: toggleInList(filters.features, String(f.id)) })}
                        className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                      <span className="text-[13px] text-gray-700 group-hover:text-gray-900">{shortFeatureName(f.name)}</span>
                    </label>
                  ))}
                </div>
              )}
            </Panel>
          )}
        </Chip>

        <Chip active={sort !== 'newest'} open={open === 'sort'} onClick={() => toggle('sort')} label={sortLabel}>
          {open === 'sort' && (
            <div className="absolute left-0 top-[42px] z-40 w-56 rounded-xl border border-gray-150 bg-white p-1.5 shadow-xl">
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onSortChange(o.value); setOpen(null); }}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                    sort === o.value ? 'bg-primary-light font-semibold text-primary' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </Chip>

        {/* Ô tìm kiếm — Enter hoặc bấm kính lúp để tìm; trên điện thoại chiếm cả dòng. */}
        <form
          onSubmit={(e) => { e.preventDefault(); submitSearch(); }}
          className="order-first flex h-10 w-full items-center rounded-full border border-gray-200 bg-gray-50 px-3.5 transition-colors focus-within:border-primary focus-within:bg-white md:order-none md:ml-auto md:h-9 md:w-72"
          role="search"
        >
          <input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Tìm theo khu vực, dự án, tên đường..."
            aria-label="Từ khoá tìm kiếm"
            className="h-full w-full bg-transparent text-[13px] text-gray-800 outline-none placeholder:text-gray-400"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => { setLocalSearch(''); onSearchQueryChange(''); }}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-200"
              aria-label="Xoá từ khoá"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button type="submit" className="ml-1 text-gray-500 hover:text-primary" aria-label="Tìm kiếm">
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function Chip({
  label, onClick, active = false, open = false, dark = false, noChevron = false, icon, children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  open?: boolean;
  dark?: boolean;
  noChevron?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  const tone = dark
    ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800'
    : active
      ? 'border-primary bg-primary-light font-semibold text-primary'
      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300';
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={open || undefined}
        className={`flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 font-medium transition-colors ${tone}`}
      >
        {icon}
        <span>{label}</span>
        {!noChevron && <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>
      {children}
    </div>
  );
}

function Panel({
  children, onClose, onClear, clearLabel = 'Xoá lọc', wide = false,
}: {
  children: ReactNode;
  onClose: () => void;
  onClear: () => void;
  clearLabel?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`absolute left-0 top-[42px] z-40 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-150 bg-white p-4 shadow-xl ${
        wide ? 'w-[380px]' : 'w-[290px]'
      }`}
    >
      <div className="space-y-4">{children}</div>
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <button type="button" onClick={onClear} className="flex items-center gap-1 text-[12px] font-medium text-gray-500 hover:text-gray-900">
          <RotateCcw className="h-3.5 w-3.5" />
          {clearLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-primary px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Xong
        </button>
      </div>
    </div>
  );
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h5 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-gray-800">{title}</h5>
      {children}
    </div>
  );
}

function OptionRow({
  options, value, onChange,
}: {
  options: ReadonlyArray<{ value: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg border px-2.5 py-1 text-[12.5px] font-medium transition-colors ${
            value === o.value ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function RangeInputs({
  min, max, minPlaceholder, maxPlaceholder, onChange,
}: {
  min: number | '';
  max: number | '';
  minPlaceholder: string;
  maxPlaceholder: string;
  onChange: (min: number | '', max: number | '') => void;
}) {
  const parse = (v: string): number | '' => (v === '' ? '' : Math.max(0, Number(v)));
  const inputClass =
    'h-9 w-full rounded-lg border border-gray-200 px-2.5 text-[13px] outline-none transition-all placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/10';
  return (
    <div className="flex items-center gap-2">
      <input type="number" min={0} placeholder={minPlaceholder} value={min} onChange={(e) => onChange(parse(e.target.value), max)} className={inputClass} />
      <span className="text-gray-400">-</span>
      <input type="number" min={0} placeholder={maxPlaceholder} value={max} onChange={(e) => onChange(min, parse(e.target.value))} className={inputClass} />
    </div>
  );
}

function Presets({
  presets, min, max, onPick,
}: {
  presets: Array<{ label: string; min: number | ''; max: number | '' }>;
  min: number | '';
  max: number | '';
  onPick: (min: number | '', max: number | '') => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {presets.map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => onPick(p.min, p.max)}
          className={`rounded-lg border px-2 py-1.5 text-left text-[12px] font-semibold transition-colors ${
            min === p.min && max === p.max ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
