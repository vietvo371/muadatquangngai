'use client';

import { Map as MapIcon, X } from 'lucide-react';

export interface SortBarProps {
  totalResults?: number;
  sort?: string;
  onSortChange?: (sort: string) => void;
  /** Chế độ bản đồ đang bật hay không — quyết định nhãn nút "Xem/Đóng bản đồ". */
  mapMode?: boolean;
  onToggleMap?: () => void;
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
  totalResults = 234,
  sort = 'newest',
  onSortChange,
  mapMode = false,
  onToggleMap,
}: SortBarProps) {
  // Đã bỏ toggle Lưới/Danh sách (feedback 28/07). Nút "Xem bản đồ" giờ bật/tắt chế độ bản đồ
  // ngay tại trang (như batdongsan.com.vn ?tpl=map), không dẫn sang trang riêng nữa.
  return (
    <div className="flex items-center justify-between gap-3 mb-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm lg:bg-transparent lg:p-0 lg:rounded-none lg:border-none lg:shadow-none">
      <span className="text-[14px] text-gray-500 shrink-0">
        <strong className="text-gray-900">{totalResults}</strong> kết quả
      </span>
      <div className="flex items-center gap-2">
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

        {onToggleMap && (
          <button
            type="button"
            onClick={onToggleMap}
            className="h-9 px-3.5 rounded-lg bg-[#12a5a5] hover:bg-[#0e8f8f] text-white font-semibold text-[13px] flex items-center gap-1.5 transition-colors shrink-0"
            aria-label={mapMode ? 'Đóng bản đồ' : 'Xem bản đồ'}
          >
            {mapMode ? <X className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
            <span className="hidden sm:inline">{mapMode ? 'Đóng bản đồ' : 'Xem bản đồ'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
