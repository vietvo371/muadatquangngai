import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      status: {
        active: 'bg-green-100 text-green-700',
        pending: 'bg-yellow-100 text-yellow-700',
        rejected: 'bg-red-100 text-red-700',
        expired: 'bg-gray-100 text-gray-700',
        inactive: 'bg-gray-100 text-gray-600',
        draft: 'bg-gray-100 text-gray-600',
        approved: 'bg-green-100 text-green-700',
        published: 'bg-green-100 text-green-700',
        archived: 'bg-yellow-100 text-yellow-700',
        sold: 'bg-primary-light text-primary',
        rented: 'bg-primary-light text-primary',
        completed: 'bg-green-100 text-green-700',
        success: 'bg-green-100 text-green-700',
        failed: 'bg-red-100 text-red-700',
        refunded: 'bg-gray-100 text-gray-700',
        resolved: 'bg-green-100 text-green-700',
        dismissed: 'bg-gray-100 text-gray-700',
      },
    },
    defaultVariants: {
      status: 'active',
    },
  }
);

const statusLabels: Record<string, string> = {
  active: 'Đang hiển thị',
  pending: 'Chờ duyệt',
  rejected: 'Từ chối',
  expired: 'Hết hạn',
  inactive: 'Tạm ẩn',
  draft: 'Nháp',
  approved: 'Đã duyệt',
  published: 'Đã xuất bản',
  archived: 'Đã lưu trữ',
  sold: 'Đã bán',
  rented: 'Đã cho thuê',
  completed: 'Hoàn thành',
  success: 'Thành công',
  failed: 'Thất bại',
  refunded: 'Đã hoàn tiền',
  resolved: 'Đã xử lý',
  dismissed: 'Bác bỏ',
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  label?: string;
}

export function StatusBadge({ className, status, label, ...props }: StatusBadgeProps) {
  const displayLabel = label || (status ? statusLabels[status] : '');

  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      {displayLabel}
    </span>
  );
}
