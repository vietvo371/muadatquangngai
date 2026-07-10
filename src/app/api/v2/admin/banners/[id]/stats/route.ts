import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

/** GET /api/v2/admin/banners/[id]/stats — port của AdminBannerController@stats. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy banner.', 404);
  const banner = await db.banners.findFirst({ where: { id: BigInt(id), deleted_at: null } });
  if (!banner) return apiError('Không tìm thấy banner.', 404);

  return apiSuccess({
    click_count: banner.click_count,
    view_count: banner.view_count,
    ctr: banner.view_count > 0 ? Math.round((banner.click_count / banner.view_count) * 100 * 100) / 100 : 0,
  });
}
