import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';
import { recordCurrentMonthSnapshot } from '@/lib/price-report';

/**
 * POST /api/v2/admin/price-report/snapshot — ghi nhận lại số liệu giá tháng hiện tại.
 * Tháng đã đóng không bao giờ bị ghi đè (hàm record_price_snapshot tự chặn).
 */
export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const count = await recordCurrentMonthSnapshot();
  return apiSuccess({ count }, `Đã cập nhật số liệu tháng này: ${count} tin rao bán.`);
}
