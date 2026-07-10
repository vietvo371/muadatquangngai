import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapProjectResource } from '@/lib/api-resources/project-resource';
import { PROJECT_ACTIVE_EXCLUDED_STATUSES } from '@/lib/api-resources/project-status';

/** GET /api/v2/projects/[slug] — port của ProjectController@show (Laravel). */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const project = await db.projects.findFirst({
    where: { slug, status: { notIn: PROJECT_ACTIVE_EXCLUDED_STATUSES } },
    include: {
      provinces: { select: { id: true, name: true } },
      districts: { select: { id: true, name: true } },
      users_projects_user_idTousers: { select: { id: true, name: true, avatar: true } },
      users_projects_agent_idTousers: { select: { id: true, name: true, avatar: true, phone: true } },
    },
  });

  if (!project) {
    return apiError('Không tìm thấy dự án.', 404);
  }

  const [ward] = await Promise.all([
    project.ward_id !== null
      ? db.wards.findUnique({ where: { id: project.ward_id }, select: { id: true, name: true } })
      : Promise.resolve(null),
    db.projects.update({ where: { id: project.id }, data: { view_count: { increment: 1 } } }),
  ]);

  return apiSuccess(mapProjectResource(project, ward));
}
