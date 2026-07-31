'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  SlidersHorizontal,
  ShieldCheck,
  Award,
  X,
  RotateCcw
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { FilterState, FilterContext, getCategoriesForContext } from './FilterSidebar';
import { RegionSelect } from '@/components/shared/RegionSelect';
import { formatPrice } from '@/lib/formatters';

interface FilterHorizontalProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onReset: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearchSubmit?: () => void;
  context?: FilterContext;
}

const PRICE_PRESETS: Array<{ label: string; min: number | ''; max: number | '' }> = [
  { label: 'Dưới 1 tỷ', min: '', max: 1000000000 },
  { label: '1 - 3 tỷ', min: 1000000000, max: 3000000000 },
  { label: '3 - 5 tỷ', min: 3000000000, max: 5000000000 },
  { label: 'Trên 5 tỷ', min: 5000000000, max: '' },
];

const AREA_PRESETS: Array<{ label: string; min: number | ''; max: number | '' }> = [
  { label: 'Dưới 50 m²', min: '', max: 50 },
  { label: '50 - 100 m²', min: 50, max: 100 },
  { label: '100 - 200 m²', min: 100, max: 200 },
  { label: 'Trên 200 m²', min: 200, max: '' },
];

const BEDROOM_OPTIONS = ['Bất kỳ', '1', '2', '3', '4+'];
const BATHROOM_OPTIONS = ['Bất kỳ', '1', '2', '3+'];
const DIRECTION_OPTIONS = ['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Nam', 'Tây Nam', 'Đông Bắc', 'Tây Bắc'];
const LEGAL_OPTIONS = ['Sổ đỏ', 'Sổ hồng', 'Hợp đồng mua bán', 'Chưa có sổ'];

export function FilterHorizontal({
  filters,
  onFilterChange,
  onReset,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  context = 'sell',
}: FilterHorizontalProps) {
  const [activeDropdown, setActiveDropdown] = useState<'type' | 'price' | 'area' | 'advanced' | null>(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isVerified, setIsVerified] = useState(false);
  const [isProAgent, setIsProAgent] = useState(false);
  const propertyTypes = getCategoriesForContext(context);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external search query to local input
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchClick = () => {
    onSearchQueryChange(localSearch);
    if (onSearchSubmit) {
      onSearchSubmit();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  const toggleType = (categoryId: string) => {
    const newTypes = filters.types.includes(categoryId)
      ? filters.types.filter(t => t !== categoryId)
      : [...filters.types, categoryId];
    onFilterChange({ types: newTypes });
  };

  const typeLabel = () => {
    if (filters.types.length === 0) return 'Loại nhà đất';
    const names = filters.types
      .map((id) => propertyTypes.find((t) => String(t.id) === id)?.name)
      .filter(Boolean);
    return `Loại: ${names.join(', ')}`;
  };

  const handlePricePreset = (min: number | '', max: number | '') => {
    onFilterChange({ priceMin: min, priceMax: max });
  };

  const handleAreaPreset = (min: number | '', max: number | '') => {
    onFilterChange({ areaMin: min, areaMax: max });
  };

  const getPriceLabel = () => {
    if (filters.priceMin === '' && filters.priceMax === '') return 'Khoảng giá';
    if (filters.priceMin !== '' && filters.priceMax === '') return `Trên ${formatPrice(filters.priceMin as number)}`;
    if (filters.priceMin === '' && filters.priceMax !== '') return `Dưới ${formatPrice(filters.priceMax as number)}`;
    return `${formatPrice(filters.priceMin as number)} - ${formatPrice(filters.priceMax as number)}`;
  };

  const getAreaLabel = () => {
    if (filters.areaMin === '' && filters.areaMax === '') return 'Diện tích';
    if (filters.areaMin !== '' && filters.areaMax === '') return `Trên ${filters.areaMin} m²`;
    if (filters.areaMin === '' && filters.areaMax !== '') return `Dưới ${filters.areaMax} m²`;
    return `${filters.areaMin} - ${filters.areaMax} m²`;
  };

  return (
    <div ref={containerRef} className="w-full bg-white shadow-md border border-gray-150 rounded-2xl p-4 mb-6 z-30 relative transition-all duration-300">
      
      {/* ══ ROW 1: SEARCH & MAP ══ */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center mb-4">
        
        {/* Search Input Box */}
        <div className="flex-1 relative flex items-center border border-gray-200 hover:border-gray-300 rounded-xl bg-gray-50/50 px-3.5 h-[48px] focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary focus-within:bg-white transition-all duration-200">
          <Search className="w-5 h-5 text-gray-400 mr-2.5 shrink-0" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Nhập tên đường, dự án hoặc khu vực tại Quảng Ngãi..."
            className="w-full bg-transparent border-none outline-none text-[14px] text-gray-800 placeholder:text-gray-450 h-full font-medium"
          />
          {localSearch && (
            <button 
              onClick={() => { setLocalSearch(''); onSearchQueryChange(''); }}
              className="p-1 rounded-full hover:bg-gray-200 text-gray-400"
              aria-label="Xóa từ khóa"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons — đã bỏ nút "Xem bản đồ" riêng (feedback 28/07); bản đồ nằm trong
            split-view của trang danh sách. */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleSearchClick}
            className="flex-1 md:flex-none bg-cta hover:bg-cta-dark text-white font-semibold text-[14px] px-8 h-[48px] rounded-xl transition-all duration-200 shadow-md shadow-cta/10 hover:shadow-lg active:scale-[0.98]"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* ══ ROW 2: HORIZONTAL FILTER DROPDOWNS & TOGGLES ══ */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[13px] text-gray-700 select-none">
        
        {/* 1. ADVANCED FILTER TRIGGER */}
        <button
          onClick={() => setActiveDropdown(activeDropdown === 'advanced' ? null : 'advanced')}
          className={`h-9 px-3.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            activeDropdown === 'advanced' || filters.bedrooms !== 'any' || filters.direction || filters.legal || filters.district !== ''
              ? 'bg-primary text-white border-primary shadow-sm shadow-primary/10'
              : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Lọc</span>
          {(filters.bedrooms !== 'any' || filters.direction || filters.legal || filters.district !== '') && (
            <span className="w-2 h-2 rounded-full bg-cta animate-pulse" />
          )}
        </button>

        {/* 2. TIN XÁC THỰC SWITCH TOGGLE */}
        <div className="h-9 px-3.5 rounded-lg border border-gray-200 bg-white flex items-center gap-2.5 font-medium hover:border-gray-300 transition-all">
          <div className="flex items-center gap-1 text-emerald-600 font-semibold">
            <ShieldCheck className="w-4 h-4 fill-emerald-50" />
            <span>Tin xác thực</span>
          </div>
          <Switch 
            checked={isVerified}
            onCheckedChange={setIsVerified}
            className="data-[state=checked]:bg-emerald-500 scale-90"
          />
        </div>

        {/* 3. LOẠI NHÀ ĐẤT DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
            className={`h-9 px-3.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all duration-200 ${
              filters.types.length > 0
                ? 'border-primary text-primary bg-primary-light/40 font-semibold'
                : 'border-gray-200 hover:border-gray-350 bg-white'
            }`}
          >
            <span>{typeLabel()}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-gray-400 ${activeDropdown === 'type' ? 'rotate-180' : ''}`} />
          </button>

          {activeDropdown === 'type' && (
            <div className="absolute top-[42px] left-0 w-[280px] bg-white border border-gray-150 rounded-xl shadow-xl p-3.5 z-40 animate-in fade-in-50 slide-in-from-top-2 duration-150 max-h-80 overflow-auto">
              <h4 className="font-bold text-gray-800 text-[12px] uppercase tracking-wider mb-2.5">Chọn loại nhà đất</h4>
              <div className="space-y-3">
                {propertyTypes.map((type) => (
                  <label key={type.id} className="flex items-center gap-2.5 cursor-pointer group">
                    <Checkbox
                      id={`type-${type.id}`}
                      checked={filters.types.includes(String(type.id))}
                      onCheckedChange={() => toggleType(String(type.id))}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-[13px] text-gray-700 group-hover:text-gray-900 transition-colors">{type.name}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setActiveDropdown(null)}
                  className="bg-primary text-white text-[12px] font-semibold px-4 py-1.5 rounded-lg hover:bg-primary-dark transition-all"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. KHOẢNG GIÁ DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'price' ? null : 'price')}
            className={`h-9 px-3.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all duration-200 ${
              filters.priceMin !== '' || filters.priceMax !== ''
                ? 'border-primary text-primary bg-primary-light/40 font-semibold'
                : 'border-gray-200 hover:border-gray-350 bg-white'
            }`}
          >
            <span>{getPriceLabel()}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-gray-400 ${activeDropdown === 'price' ? 'rotate-180' : ''}`} />
          </button>

          {activeDropdown === 'price' && (
            <div className="absolute top-[42px] left-0 w-[280px] bg-white border border-gray-150 rounded-xl shadow-xl p-4 z-40 animate-in fade-in-50 slide-in-from-top-2 duration-150">
              <h4 className="font-bold text-gray-800 text-[12px] uppercase tracking-wider mb-3">Khoảng giá</h4>
              
              {/* Custom Min-Max Input */}
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="number"
                  placeholder="Từ VNĐ"
                  value={filters.priceMin}
                  onChange={(e) => onFilterChange({ priceMin: e.target.value ? Number(e.target.value) : '' })}
                  className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-[13px] focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Đến VNĐ"
                  value={filters.priceMax}
                  onChange={(e) => onFilterChange({ priceMax: e.target.value ? Number(e.target.value) : '' })}
                  className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-[13px] focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Presets */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                {PRICE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePricePreset(preset.min, preset.max)}
                    className={`px-2 py-1.5 text-[11px] font-semibold rounded-lg transition-colors border text-left ${
                      filters.priceMin === preset.min && filters.priceMax === preset.max
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-650 border-gray-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <button
                  onClick={() => onFilterChange({ priceMin: '', priceMax: '' })}
                  className="text-[12px] text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa lọc</span>
                </button>
                <button
                  onClick={() => setActiveDropdown(null)}
                  className="bg-primary text-white text-[12px] font-semibold px-4 py-1.5 rounded-lg hover:bg-primary-dark transition-all"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. DIỆN TÍCH DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'area' ? null : 'area')}
            className={`h-9 px-3.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all duration-200 ${
              filters.areaMin !== '' || filters.areaMax !== ''
                ? 'border-primary text-primary bg-primary-light/40 font-semibold'
                : 'border-gray-200 hover:border-gray-350 bg-white'
            }`}
          >
            <span>{getAreaLabel()}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-gray-400 ${activeDropdown === 'area' ? 'rotate-180' : ''}`} />
          </button>

          {activeDropdown === 'area' && (
            <div className="absolute top-[42px] left-0 w-[280px] bg-white border border-gray-150 rounded-xl shadow-xl p-4 z-40 animate-in fade-in-50 slide-in-from-top-2 duration-150">
              <h4 className="font-bold text-gray-800 text-[12px] uppercase tracking-wider mb-3">Diện tích</h4>
              
              {/* Custom Min-Max Input */}
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="number"
                  placeholder="Từ m²"
                  value={filters.areaMin}
                  onChange={(e) => onFilterChange({ areaMin: e.target.value ? Number(e.target.value) : '' })}
                  className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-[13px] focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Đến m²"
                  value={filters.areaMax}
                  onChange={(e) => onFilterChange({ areaMax: e.target.value ? Number(e.target.value) : '' })}
                  className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-[13px] focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Presets */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                {AREA_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleAreaPreset(preset.min, preset.max)}
                    className={`px-2 py-1.5 text-[11px] font-semibold rounded-lg transition-colors border text-left ${
                      filters.areaMin === preset.min && filters.areaMax === preset.max
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-650 border-gray-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <button
                  onClick={() => onFilterChange({ areaMin: '', areaMax: '' })}
                  className="text-[12px] text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa lọc</span>
                </button>
                <button
                  onClick={() => setActiveDropdown(null)}
                  className="bg-primary text-white text-[12px] font-semibold px-4 py-1.5 rounded-lg hover:bg-primary-dark transition-all"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 6. MÔI GIỚI CHUYÊN NGHIỆP SWITCH TOGGLE */}
        <div className="h-9 px-3.5 rounded-lg border border-gray-200 bg-white flex items-center gap-2.5 font-medium hover:border-gray-300 transition-all">
          <div className="flex items-center gap-1 text-primary font-semibold">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Môi giới chuyên nghiệp</span>
          </div>
          <Switch 
            checked={isProAgent}
            onCheckedChange={setIsProAgent}
            className="data-[state=checked]:bg-primary scale-90"
          />
        </div>
      </div>

      {/* ══ ROW 3: EXPANDABLE ADVANCED FILTERS SECTION ══ */}
      {activeDropdown === 'advanced' && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Bedrooms Selection */}
            <div>
              <h5 className="font-bold text-gray-800 text-[12px] uppercase tracking-wider mb-2.5">Số phòng ngủ</h5>
              <div className="flex flex-wrap gap-1.5">
                {BEDROOM_OPTIONS.map((bed) => {
                  const val = bed === 'Bất kỳ' ? 'any' : bed;
                  const isSel = filters.bedrooms === val;
                  return (
                    <button
                      key={bed}
                      onClick={() => onFilterChange({ bedrooms: val })}
                      className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-colors border ${
                        isSel
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white hover:bg-gray-50 border-gray-205 text-gray-700'
                      }`}
                    >
                      {bed}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bathrooms Selection */}
            <div>
              <h5 className="font-bold text-gray-800 text-[12px] uppercase tracking-wider mb-2.5">Số phòng tắm</h5>
              <div className="flex flex-wrap gap-1.5">
                {BATHROOM_OPTIONS.map((bath) => {
                  const val = bath === 'Bất kỳ' ? 'any' : bath;
                  const isSel = filters.bathrooms === val;
                  return (
                    <button
                      key={bath}
                      onClick={() => onFilterChange({ bathrooms: val })}
                      className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-colors border ${
                        isSel
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white hover:bg-gray-50 border-gray-205 text-gray-700'
                      }`}
                    >
                      {bath}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direction Selection */}
            <div>
              <h5 className="font-bold text-gray-800 text-[12px] uppercase tracking-wider mb-2.5">Hướng nhà</h5>
              <select
                value={filters.direction}
                onChange={(e) => onFilterChange({ direction: e.target.value })}
                className="w-full h-8.5 border border-gray-200 rounded-lg px-2 text-[12.5px] focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-gray-750 bg-white"
              >
                <option value="">Bất kỳ</option>
                {DIRECTION_OPTIONS.map(dir => <option key={dir} value={dir}>{dir}</option>)}
              </select>
            </div>

            {/* Legal Selection */}
            <div>
              <h5 className="font-bold text-gray-800 text-[12px] uppercase tracking-wider mb-2.5">Pháp lý</h5>
              <select
                value={filters.legal}
                onChange={(e) => onFilterChange({ legal: e.target.value })}
                className="w-full h-8.5 border border-gray-200 rounded-lg px-2 text-[12.5px] focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-gray-750 bg-white"
              >
                <option value="">Bất kỳ</option>
                {LEGAL_OPTIONS.map(leg => <option key={leg} value={leg}>{leg}</option>)}
              </select>
            </div>
          </div>

          {/* District Selection inside Lọc (Advanced) — 96 xã/phường/đặc khu, ưu tiên 9 khu vực nổi bật */}
          <div className="mt-4 pt-3.5 border-t border-gray-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <span className="text-[12px] font-bold text-gray-800 uppercase tracking-wider shrink-0 mr-2 sm:mb-0">Khu vực:</span>
              <RegionSelect
                value={filters.district}
                onChange={(id) => onFilterChange({ district: id })}
                buttonClassName="h-8.5 border border-gray-200 rounded-lg px-3 text-[12.5px] focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-gray-700 bg-white min-w-[160px] flex items-center gap-1.5"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={onReset}
                className="text-[12px] text-gray-500 hover:text-gray-900 font-bold px-3 py-1.5 rounded-lg border border-gray-200 bg-white transition-all flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
              <button
                onClick={() => setActiveDropdown(null)}
                className="bg-primary hover:bg-primary-dark text-white text-[12px] font-bold px-4 py-1.5 rounded-lg transition-all shadow-md shadow-primary/10"
              >
                Đóng bộ lọc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
