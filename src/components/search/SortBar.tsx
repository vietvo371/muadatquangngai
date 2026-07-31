'use client';

export interface SortBarProps {
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
  totalResults = 234,
  sort = 'newest',
  onSortChange,
}: SortBarProps) {
  // Đã bỏ toggle Lưới/Danh sách và nút "Bản đồ" (feedback 28/07) — chỉ còn ô sắp xếp; bản đồ
  // tích hợp thẳng vào split-view của trang danh sách.
  return (
    <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm lg:bg-transparent lg:p-0 lg:rounded-none lg:border-none lg:shadow-none">
      <span className="text-[14px] text-gray-500">
        <strong className="text-gray-900">{totalResults}</strong> kết quả
      </span>
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
    </div>
  );
}
