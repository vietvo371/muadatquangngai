import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapAdminProjectResource } from '@/lib/api-resources/project-resource';

/** PUT /api/v2/admin/projects/[id]/archive — port của AdminProjectController@archive. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy dự án.', 404);
  const project = await db.projects.findUnique({ where: { id: BigInt(id) } });
  if (!project) return apiError('Không tìm thấy dự án.', 404);

  const updated = await db.projects.update({
    where: { id: project.id },
    data: { status: 'archived', updated_at: new Date() },
  });

  return apiSuccess(mapAdminProjectResource(updated), 'Dự án đã được lưu trữ.');
}
