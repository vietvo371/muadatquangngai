import { cn } from '@/lib/utils';
import { UNIT_STATUS_STYLES, type UnitStatus } from '@/lib/design-tokens';

/**
 * Nhãn trạng thái căn/lô trong dự án: Còn hàng / Giữ chỗ / Đã bán / Chưa rõ.
 * Màu lấy từ biến CSS `--unit-*` (globals.css), sửa một chỗ là mọi nơi đổi theo.
 */
export function UnitStatusBadge({ status, className }: { status: UnitStatus; className?: string }) {
  const style = UNIT_STATUS_STYLES[status];
  return (
    <span
      className={cn('inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[12px] font-semibold', className)}
      style={{ color: style.color, backgroundColor: style.background }}
    >
      {style.label}
    </span>
  );
}
