'use client';

import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface ListingPaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  onChange: (page: number) => void;
}

const formatCount = (n: number) => n.toLocaleString('vi-VN');

/** Dải số trang: 1 … 4 5 6 … 20 (luôn có trang đầu, trang cuối, và 1 trang mỗi bên trang hiện tại). */
export function buildPageItems(current: number, last: number): Array<number | '...'> {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const items: Array<number | '...'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);
  if (start > 2) items.push('...');
  for (let i = start; i <= end; i++) items.push(i);
  if (end < last - 1) items.push('...');
  items.push(last);
  return items;
}

/**
 * Phân trang trang danh sách (feedback 21/09, mục 13): nút "Trang tiếp" nổi bật ở trên,
 * dải số + mũi tên ở giữa, dòng thống kê "1–30 của N bất động sản" ở dưới.
 */
export function ListingPagination({ currentPage, lastPage, total, perPage, onChange }: ListingPaginationProps) {
  if (total === 0) return null;
  const from = (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= lastPage;

  return (
    <nav aria-label="Phân trang" className="mt-8 flex flex-col items-center gap-4">
      {!isLast && (
        <button
          type="button"
          onClick={() => onChange(currentPage + 1)}
          className="inline-flex h-11 w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-primary px-6 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
        >
          Trang tiếp theo
          <ArrowRight className="h-4 w-4" />
        </button>
      )}

      {lastPage > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <button
            type="button"
            aria-label="Trang trước"
            onClick={() => onChange(currentPage - 1)}
            disabled={isFirst}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border text-gray-700 transition-colors ${
              isFirst ? 'cursor-not-allowed border-gray-100 text-gray-300' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {buildPageItems(currentPage, lastPage).map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="flex h-9 w-9 items-center justify-center font-medium text-gray-400">
                …
              </span>
            ) : (
              <button
                key={`page-${p}`}
                type="button"
                aria-current={p === currentPage ? 'page' : undefined}
                onClick={() => onChange(p)}
                className={`h-9 min-w-9 rounded-lg px-2 text-[14px] font-medium transition-colors ${
                  p === currentPage
                    ? 'bg-primary font-semibold text-white shadow-sm'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            aria-label="Trang sau"
            onClick={() => onChange(currentPage + 1)}
            disabled={isLast}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border text-gray-700 transition-colors ${
              isLast ? 'cursor-not-allowed border-gray-100 text-gray-300' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <p className="text-[13px] text-gray-500">
        {formatCount(from)}–{formatCount(to)} của {formatCount(total)} bất động sản
      </p>
    </nav>
  );
}
