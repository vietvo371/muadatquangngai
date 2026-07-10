import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapBannerResource } from '@/lib/api-resources/banner-resource';

/** PUT /api/v2/admin/banners/[id]/toggle — port của AdminBannerController@toggle. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy banner.', 404);
  const banner = await db.banners.findFirst({ where: { id: BigInt(id), deleted_at: null } });
  if (!banner) return apiError('Không tìm thấy banner.', 404);

  const updated = await db.banners.update({
    where: { id: banner.id },
    data: { is_active: !banner.is_active, updated_at: new Date() },
  });

  return apiSuccess(mapBannerResource(updated), updated.is_active ? 'Đã kích hoạt banner.' : 'Đã vô hiệu hóa banner.');
}
