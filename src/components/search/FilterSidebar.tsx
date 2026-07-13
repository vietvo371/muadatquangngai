'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RegionSelect } from '@/components/shared/RegionSelect';
import { SELL_CATEGORIES, RENT_CATEGORIES, PROJECT_CATEGORIES, type CategoryMenuItem } from '@/lib/category-menu';

export interface FilterState {
  // category id (dạng string, khớp checkbox value) — danh sách tuỳ theo context (bán/thuê/dự án).
  types: string[];
  // district_id của 1 trong 96 xã/phường/đặc khu — '' nghĩa là "Tất cả khu vực".
  district: number | '';
  priceMin: number | '';
  priceMax: number | '';
  areaMin: number | '';
  areaMax: number | '';
  bedrooms: string;
  bathrooms: string;
  direction: string;
  legal: string;
}

export const DEFAULT_FILTERS: FilterState = {
  types: [],
  district: '',
  priceMin: '',
  priceMax: '',
  areaMin: '',
  areaMax: '',
  bedrooms: 'any',
  bathrooms: 'any',
  direction: '',
  legal: '',
};

export type FilterContext = 'sell' | 'rent' | 'project';

// Danh sách "Loại nhà đất" đồng bộ với menu danh mục con trên header (đã sửa theo Notion
// 13/07) — mỗi context (bán/thuê/dự án) có bộ category riêng, không dùng chung 1 list nữa.
export function getCategoriesForContext(context: FilterContext): CategoryMenuItem[] {
  if (context === 'rent') return RENT_CATEGORIES;
  if (context === 'project') return PROJECT_CATEGORIES;
  return SELL_CATEGORIES;
}

const BEDROOM_OPTIONS = ['Bất kỳ', '1', '2', '3', '4+'];
const BATHROOM_OPTIONS = ['Bất kỳ', '1', '2', '3+'];
const DIRECTION_OPTIONS = ['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Nam', 'Tây Nam', 'Đông Bắc', 'Tây Bắc'];
const LEGAL_OPTIONS = ['Sổ đỏ', 'Sổ hồng', 'Hợp đồng mua bán', 'Chưa có sổ'];

const PRICE_PRESETS: Array<{ label: string; min: number | ''; max: number | '' }> = [
  { label: 'Dưới 1 tỷ', min: '', max: 1000000000 },
  { label: '1-3 tỷ', min: 1000000000, max: 3000000000 },
  { label: '3-5 tỷ', min: 3000000000, max: 5000000000 },
  { label: 'Trên 5 tỷ', min: 5000000000, max: '' },
];
const AREA_PRESETS: Array<{ label: string; min: number | ''; max: number | '' }> = [
  { label: 'Dưới 50m²', min: '', max: 50 },
  { label: '50-100m²', min: 50, max: 100 },
  { label: '100-200m²', min: 100, max: 200 },
  { label: 'Trên 200m²', min: 200, max: '' },
];

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onApply: () => void;
  onReset: () => void;
  open?: boolean;
  onClose?: () => void;
  context?: FilterContext;
}

export function FilterSidebar({ filters, onFilterChange, onApply, onReset, open, onClose, context = 'sell' }: FilterSidebarProps) {
  const propertyTypes = getCategoriesForContext(context);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    type: false,
    location: false,
    price: false,
    area: false,
    bedrooms: false,
    bathrooms: false,
    direction: false,
    legal: false,
  });

  const toggleSection = (section: string) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleType = (categoryId: string) => {
    const newTypes = filters.types.includes(categoryId)
      ? filters.types.filter(t => t !== categoryId)
      : [...filters.types, categoryId];
    onFilterChange({ types: newTypes });
  };

  const handlePricePreset = (min: number | '', max: number | '') => {
    onFilterChange({ priceMin: min, priceMax: max });
  };

  const handleAreaPreset = (min: number | '', max: number | '') => {
    onFilterChange({ areaMin: min, areaMax: max });
  };

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="py-5 border-b border-gray-100">
      <button
        onClick={() => toggleSection(id)}
        className="flex items-center justify-between w-full text-[13px] font-semibold text-gray-900 uppercase tracking-wider mb-3 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded"
        aria-expanded={expanded[id]}
        aria-controls={`section-${id}`}
      >
        {title}
        {expanded[id] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded[id] && <div id={`section-${id}`}>{children}</div>}
    </div>
  );

  const sidebarContent = (
    <>
      {/* Types */}
      <Section id="type" title="Loại nhà đất">
        <div className="space-y-3">
          {propertyTypes.map((type) => (
            <label key={type.id} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                id={`type-${type.id}`}
                checked={filters.types.includes(String(type.id))}
                onCheckedChange={() => toggleType(String(type.id))}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:ring-2 focus-visible:ring-primary/50"
                aria-label={`Lọc theo ${type.name.toLowerCase()}`}
              />
              <label htmlFor={`type-${type.id}`} className="text-[14px] text-gray-700 group-hover:text-gray-900 transition-colors cursor-pointer">{type.name}</label>
            </label>
          ))}
        </div>
      </Section>

      {/* Location — 96 xã/phường/đặc khu, không còn cấp Phường/Xã con */}
      <Section id="location" title="Khu vực">
        <RegionSelect
          value={filters.district}
          onChange={(id) => onFilterChange({ district: id })}
          buttonClassName="w-full h-10 border border-gray-200 rounded-lg px-3 text-[14px] focus:ring-[3px] focus:ring-primary/15 focus:border-primary outline-none transition-all cursor-pointer text-gray-700 flex items-center justify-between"
        />
      </Section>

      {/* Price */}
      <Section id="price" title="Mức giá">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="number"
            placeholder="Từ"
            value={filters.priceMin}
            onChange={(e) => onFilterChange({ priceMin: e.target.value ? Number(e.target.value) : '' })}
            className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[14px] focus:ring-[3px] focus:ring-primary/15 focus:border-primary outline-none transition-all placeholder:text-gray-400 text-gray-700"
            id="price-min"
            name="price-min"
            aria-label="Giá tối thiểu"
          />
          <span className="text-gray-400 font-medium">-</span>
          <input
            type="number"
            placeholder="Đến"
            value={filters.priceMax}
            onChange={(e) => onFilterChange({ priceMax: e.target.value ? Number(e.target.value) : '' })}
            className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[14px] focus:ring-[3px] focus:ring-primary/15 focus:border-primary outline-none transition-all placeholder:text-gray-400 text-gray-700"
            id="price-max"
            name="price-max"
            aria-label="Giá tối đa"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {PRICE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePricePreset(preset.min, preset.max)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-full transition-colors border ${
                filters.priceMin === preset.min && filters.priceMax === preset.max
                  ? 'bg-primary text-white border-primary'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Area */}
      <Section id="area" title="Diện tích">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="number"
            placeholder="Từ m²"
            value={filters.areaMin}
            onChange={(e) => onFilterChange({ areaMin: e.target.value ? Number(e.target.value) : '' })}
            className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[14px] focus:ring-[3px] focus:ring-primary/15 focus:border-primary outline-none transition-all placeholder:text-gray-400 text-gray-700"
            id="area-min"
            name="area-min"
            aria-label="Diện tích tối thiểu"
          />
          <span className="text-gray-400 font-medium">-</span>
          <input
            type="number"
            placeholder="Đến m²"
            value={filters.areaMax}
            onChange={(e) => onFilterChange({ areaMax: e.target.value ? Number(e.target.value) : '' })}
            className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[14px] focus:ring-[3px] focus:ring-primary/15 focus:border-primary outline-none transition-all placeholder:text-gray-400 text-gray-700"
            id="area-max"
            name="area-max"
            aria-label="Diện tích tối đa"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {AREA_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleAreaPreset(preset.min, preset.max)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-full transition-colors border ${
                filters.areaMin === preset.min && filters.areaMax === preset.max
                  ? 'bg-primary text-white border-primary'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Bedrooms */}
      <Section id="bedrooms" title="Số phòng ngủ">
        <div className="flex flex-wrap gap-2">
          {BEDROOM_OPTIONS.map((bed) => {
            const value = bed === 'Bất kỳ' ? 'any' : bed;
            const isSelected = filters.bedrooms === value;
            return (
              <button
                key={bed}
                onClick={() => onFilterChange({ bedrooms: value })}
                className={`px-4 py-1.5 text-[13px] font-medium rounded-full transition-colors ${
                  isSelected
                    ? 'bg-primary text-white border border-primary'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {bed}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Bathrooms */}
      <Section id="bathrooms" title="Số phòng tắm">
        <div className="flex flex-wrap gap-2">
          {BATHROOM_OPTIONS.map((bath) => {
            const value = bath === 'Bất kỳ' ? 'any' : bath;
            const isSelected = filters.bathrooms === value;
            return (
              <button
                key={bath}
                onClick={() => onFilterChange({ bathrooms: value })}
                className={`px-4 py-1.5 text-[13px] font-medium rounded-full transition-colors ${
                  isSelected
                    ? 'bg-primary text-white border border-primary'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {bath}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Direction */}
      <Section id="direction" title="Hướng nhà">
        <div className="flex flex-wrap gap-2">
          {DIRECTION_OPTIONS.map((dir) => {
            const isSelected = filters.direction === dir;
            return (
              <button
                key={dir}
                onClick={() => onFilterChange({ direction: isSelected ? '' : dir })}
                className={`px-3 py-1.5 text-[13px] font-medium rounded-full transition-colors border ${
                  isSelected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {dir}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Legal */}
      <Section id="legal" title="Pháp lý">
        <div className="flex flex-wrap gap-2">
          {LEGAL_OPTIONS.map((legalItem) => {
            const isSelected = filters.legal === legalItem;
            return (
              <button
                key={legalItem}
                onClick={() => onFilterChange({ legal: isSelected ? '' : legalItem })}
                className={`px-3 py-1.5 text-[13px] font-medium rounded-full transition-colors border ${
                  isSelected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {legalItem}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Footer Actions */}
      <div className="py-5 flex items-center gap-3">
        <Button variant="outline" onClick={onReset} className="flex-1 h-10 text-[13px] font-medium border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900">
          Đặt lại
        </Button>
        <Button onClick={onApply} className="flex-1 h-10 bg-primary hover:bg-primary-dark text-white text-[13px] font-medium">
          Áp dụng
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="w-[260px] flex-shrink-0 border-r border-gray-100 pr-6 hidden lg:block bg-white h-[calc(100vh-80px)] sticky top-20 overflow-y-auto">
        {sidebarContent}
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative ml-auto w-[300px] max-w-full h-full bg-white flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
              <span className="text-[15px] font-semibold text-gray-900">Bộ lọc</span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                aria-label="Đóng bộ lọc"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
