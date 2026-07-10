import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapPackageResource } from '@/lib/api-resources/package-resource';

/** PUT /api/v2/admin/packages/[id]/toggle — port của AdminPackageController@toggleActive. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy gói dịch vụ.', 404);
  const pkg = await db.packages.findUnique({ where: { id: BigInt(id) } });
  if (!pkg) return apiError('Không tìm thấy gói dịch vụ.', 404);

  const updated = await db.packages.update({
    where: { id: pkg.id },
    data: { is_active: !pkg.is_active, updated_at: new Date() },
  });

  return apiSuccess(mapPackageResource(updated), updated.is_active ? 'Đã kích hoạt gói.' : 'Đã vô hiệu hóa gói.');
}
