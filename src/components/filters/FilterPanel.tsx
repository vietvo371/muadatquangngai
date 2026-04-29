'use client';

import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const directions = [
  { value: 'dong', label: 'Đông' },
  { value: 'tay', label: 'Tây' },
  { value: 'nam', label: 'Nam' },
  { value: 'bac', label: 'Bắc' },
  { value: 'dong_bac', label: 'Đông Bắc' },
  { value: 'dong_nam', label: 'Đông Nam' },
  { value: 'tay_bac', label: 'Tây Bắc' },
  { value: 'tay_nam', label: 'Tây Nam' },
];

const legalOptions = ['Sổ đỏ', 'Sổ hồng', 'Hợp đồng mua bán', 'Đang chờ sổ'];

export interface FilterPanelProps {
  type: 'sale' | 'rent';
  priceRange: number[];
  onPriceRangeChange: (value: number[]) => void;
  areaRange: number[];
  onAreaRangeChange: (value: number[]) => void;
  selectedDirection: string;
  onDirectionChange: (value: string) => void;
  minBedrooms: number;
  onBedroomsChange: (value: number) => void;
  selectedLegal?: string[];
  onLegalChange?: (value: string[]) => void;
}

export function FilterPanel({
  type,
  priceRange,
  onPriceRangeChange,
  areaRange,
  onAreaRangeChange,
  selectedDirection,
  onDirectionChange,
  minBedrooms,
  onBedroomsChange,
  selectedLegal = [],
  onLegalChange,
}: FilterPanelProps) {
  const isSale = type === 'sale';

  const priceConfig = isSale
    ? { max: 20000000000, step: 100000000, label: 'Khoảng giá' }
    : { max: 100000000, step: 500000, label: 'Khoảng giá / tháng' };

  const areaConfig = isSale
    ? { max: 1000, step: 10, maxLabel: '1000+ m²' }
    : { max: 500, step: 10, maxLabel: '500+ m²' };

  const bedroomOptions = isSale ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4];

  const formatPrice = (value: number) => {
    if (value === 0) return '0';
    if (isSale) {
      if (value >= priceConfig.max) return '20+ tỷ';
      if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
      return `${(value / 1000000).toFixed(0)} triệu`;
    } else {
      if (value >= priceConfig.max) return '100+ triệu';
      return `${(value / 1000000).toFixed(1)} triệu`;
    }
  };

  const handleLegalToggle = (legal: string) => {
    if (!onLegalChange) return;
    if (selectedLegal.includes(legal)) {
      onLegalChange(selectedLegal.filter((l) => l !== legal));
    } else {
      onLegalChange([...selectedLegal, legal]);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium mb-3 block text-gray-700">{priceConfig.label}</Label>
        <Slider
          value={priceRange}
          onValueChange={(v) => v && onPriceRangeChange(v as number[])}
          min={0}
          max={priceConfig.max}
          step={priceConfig.step}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      {/* Area Range */}
      <div>
        <Label className="text-sm font-medium mb-3 block text-gray-700">Diện tích</Label>
        <Slider
          value={areaRange}
          onValueChange={(v) => v && onAreaRangeChange(v as number[])}
          min={0}
          max={areaConfig.max}
          step={areaConfig.step}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>{areaRange[0]} m²</span>
          <span>{areaRange[1] >= areaConfig.max ? areaConfig.maxLabel : `${areaRange[1]} m²`}</span>
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <Label className="text-sm font-medium mb-3 block text-gray-700">Số phòng ngủ</Label>
        <div className="flex gap-2 flex-wrap">
          {bedroomOptions.map((num) => (
            <button
              key={num}
              onClick={() => onBedroomsChange(num)}
              className={`min-w-[40px] h-10 px-2 rounded-lg border text-sm font-medium transition-colors ${
                minBedrooms === num
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-200 hover:border-primary text-gray-600'
              }`}
            >
              {num === 0 ? 'Tất cả' : `${num}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Direction */}
      <div>
        <Label className="text-sm font-medium mb-3 block text-gray-700">Hướng nhà</Label>
        <Select value={selectedDirection} onValueChange={(v) => v && onDirectionChange(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn hướng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả hướng</SelectItem>
            {directions.map((dir) => (
              <SelectItem key={dir.value} value={dir.value}>
                {dir.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Legal Status - Only for sale */}
      {isSale && onLegalChange && (
        <div>
          <Label className="text-sm font-medium mb-3 block text-gray-700">Pháp lý</Label>
          <div className="space-y-2">
            {legalOptions.map((legal) => (
              <div key={legal} className="flex items-center gap-2">
                <Checkbox
                  id={legal}
                  checked={selectedLegal.includes(legal)}
                  onCheckedChange={() => handleLegalToggle(legal)}
                />
                <Label htmlFor={legal} className="text-sm font-normal cursor-pointer text-gray-600">
                  {legal}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
