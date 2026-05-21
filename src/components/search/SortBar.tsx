'use client';

import { Grid, List, Map } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface SortBarProps {
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  totalResults?: number;
  sort?: string;
  onSortChange?: (sort: string) => void;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'relevant', label: 'Phù hợp nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'area_desc', label: 'Diện tích lớn nhất' },
  { value: 'views_desc', label: 'Xem nhiều nhất' },
];

export function SortBar({
  viewMode = 'grid',
  onViewModeChange,
  totalResults = 234,
  sort = 'newest',
  onSortChange,
}: SortBarProps) {
  const router = useRouter();

  const handleMapClick = () => {
    router.push('/ban-do');
  };

  return (
    <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm lg:bg-transparent lg:p-0 lg:rounded-none lg:border-none lg:shadow-none">
      <span className="text-[14px] text-gray-500">
        <strong className="text-gray-900">{totalResults}</strong> kết quả
      </span>
      <div className="flex items-center gap-3">
        <select
          value={sort}
          onChange={(e) => onSortChange?.(e.target.value)}
          className="h-9 border border-gray-200 rounded-lg px-3 text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-[3px] focus:ring-primary/15 focus:border-primary bg-white cursor-pointer hover:bg-gray-50 transition-colors"
          aria-label="Sắp xếp theo"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Desktop: grid/list toggle + map button */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden h-9">
            <button
              onClick={() => onViewModeChange?.('grid')}
              className={`px-3 flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white hover:bg-gray-50 text-gray-500'}`}
              title="Dạng lưới"
              aria-label="Xem dạng lưới"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange?.('list')}
              className={`px-3 flex items-center justify-center transition-colors border-l border-gray-200 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white hover:bg-gray-50 text-gray-500'}`}
              title="Dạng danh sách"
              aria-label="Xem dạng danh sách"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleMapClick}
            className="px-3 border border-gray-200 rounded-lg h-9 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
            aria-label="Xem bản đồ"
          >
            <Map className="w-4 h-4 text-primary" />
            <span className="text-[13px] font-medium">Bản đồ</span>
          </button>
        </div>

        {/* Mobile: map button only */}
        <button
          onClick={handleMapClick}
          className="lg:hidden px-3 border border-gray-200 rounded-lg h-9 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
          aria-label="Xem bản đồ"
        >
          <Map className="w-4 h-4 text-primary" />
          <span className="text-[13px] font-medium">Bản đồ</span>
        </button>
      </div>
    </div>
  );
}
