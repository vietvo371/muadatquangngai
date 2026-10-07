'use client';

import { AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toApiError } from '@/lib/api-client';

/**
 * Khối báo lỗi tải dữ liệu, đặt đúng chỗ phần nội dung bị lỗi (Notion 07/10 "Shared UI").
 *
 * Chỉ một section hỏng thì chỉ section đó hiện khối này — phần còn lại của trang vẫn dùng
 * được, thay vì cả trang chuyển sang màn hình "Lỗi Kết Nối Hệ Thống".
 *
 * Nút "Thử lại" chỉ hiện với lỗi tạm thời (mạng, hết giờ, máy chủ lỗi). Lỗi 404/403 thì thử
 * lại cũng vô ích, hiện nút chỉ khiến người dùng bấm mãi không được gì.
 */
interface ErrorStateProps {
  /** Lỗi bất kỳ — tự quy về ApiError để lấy câu hiển thị. */
  error?: unknown;
  /** Ghi đè câu hiển thị. */
  message?: string;
  onRetry?: () => void;
  /** Bản gọn để nhét vào trong một khối nhỏ (bỏ khoảng đệm lớn). */
  compact?: boolean;
  className?: string;
}

export function ErrorState({ error, message, onRetry, compact = false, className }: ErrorStateProps) {
  const apiError = error === undefined ? null : toApiError(error);
  const text = message ?? apiError?.message ?? 'Không tải được nội dung.';
  const canRetry = Boolean(onRetry) && (apiError ? apiError.isRetryable : true);

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-gray-200 bg-gray-50 text-center',
        compact ? 'gap-2 px-4 py-5' : 'gap-3 px-6 py-10',
        className
      )}
    >
      <AlertCircle className={cn('text-gray-400', compact ? 'h-5 w-5' : 'h-7 w-7')} />
      <p className={cn('max-w-sm text-gray-600', compact ? 'text-[13px]' : 'text-[14px]')}>{text}</p>
      {canRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary-light"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Thử lại
        </button>
      )}
    </div>
  );
}
