import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapAdminProjectResource } from '@/lib/api-resources/project-resource';
import { mapDistrictFromAddress } from '@/lib/api-resources/project-district-mapping';
import { validateProjectFields } from '@/lib/api-resources/project-validation';
import { validationErrorResponse } from '@/lib/validation';
import { slugify } from '@/lib/formatters';
import { randomBytes } from 'crypto';

function randomSuffix(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(randomBytes(length))
    .map((b) => chars[b % chars.length])
    .join('');
}

/**
 * Port của ProjectService::getStats() — `sold`/`rented` LUÔN bằng 0 vì Laravel filter
 * properties theo status=active TRƯỚC khi SUM(CASE WHEN status='sold'...) — 2 điều kiện
 * loại trừ lẫn nhau nên nhánh sold/rented không bao giờ khớp (dead code, verify qua curl
 * thật trên nhiều project có properties sold/rented thật vẫn luôn ra 0). min/max trả về
 * STRING (Postgres MIN/MAX decimal qua PDO), avg trả về NUMBER đã round — khi không có
 * property active nào, cả 3 field rơi về NUMBER 0 (PHP `?? 0` fallback là int, không phải
 * string) — xác nhận qua so sánh project có/không có property active.
 */
async function getProjectStats(projectId: bigint, totalUnits: number | null) {
  const activeAgg = await db.properties.aggregate({
    where: { project_id: projectId, status: 'active' },
    _count: { _all: true },
    _min: { price: true },
    _max: { price: true },
    _avg: { price: true },
  });

  const activeCount = activeAgg._count._all;
  return {
    total_units: totalUnits ?? 0,
    active_units: activeCount,
    sold_units: 0,
    rented_units: 0,
    available_units: activeCount,
    price_range: {
      min: activeAgg._min.price !== null ? String(activeAgg._min.price) : 0,
      max: activeAgg._max.price !== null ? String(activeAgg._max.price) : 0,
      avg: activeAgg._avg.price !== null ? Math.round(Number(activeAgg._avg.price)) : 0,
    },
  };
}

/** GET /api/v2/admin/projects/[id] — port của AdminProjectController@show. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy dự án.', 404);

  const project = await db.projects.findUnique({
    where: { id: BigInt(id) },
    include: { provinces: true, districts: true, users_projects_agent_idTousers: true },
  });
  if (!project) return apiError('Không tìm thấy dự án.', 404);

  // Không có FK constraint thật cho ward_id trên bảng projects nên Prisma không tạo được
  // quan hệ `wards` tự động (khác provinces/districts) — phải query tay như Phase 1.
  const [ward, stats] = await Promise.all([
    project.ward_id ? db.wards.findUnique({ where: { id: project.ward_id } }) : Promise.resolve(null),
    getProjectStats(project.id, project.total_units),
  ]);

  return apiSuccess({ project: mapAdminProjectResource({ ...project, wards: ward }), stats });
}

/**
 * PUT /api/v2/admin/projects/[id] — port của AdminProjectController@update + ProjectService::update().
 *
 * `slug` client gửi lên chỉ bị ghi đè bằng slug tự sinh KHI `name` thực sự đổi so với giá
 * trị cũ — nếu name không đổi, slug client validate-unique vẫn được LƯU nguyên (khác store()
 * luôn ghi đè vô điều kiện). Nhánh set `published_at` khi status chuyển sang 'published' là
 * dead code — ProjectStatus enum không có case 'published' nên validation `in:` luôn reject
 * giá trị này trước khi tới được nhánh đó — không cần implement.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy dự án.', 404);
  const project = await db.projects.findUnique({ where: { id: BigInt(id) } });
  if (!project) return apiError('Không tìm thấy dự án.', 404);

  const raw = await request.json().catch(() => ({}));
  const body: Record<string, unknown> = { ...raw };

  if ('min_price' in body) body.price_from = body.min_price;
  if ('max_price' in body) body.price_to = body.max_price;
  if ('investor' in body) body.developer = body.investor;
  if ('location' in body) body.address = body.location;

  if ('location' in body || 'address' in body) {
    const addressText = (body.address as string) ?? '';
    body.district_id = Number(mapDistrictFromAddress(addressText));
  }

  const errors = await validateProjectFields(body, {
    requireName: false,
    requireAddress: false,
    requireProvince: false,
    excludeSlugId: project.id,
  });
  if (errors.length > 0) return validationErrorResponse(errors);

  const nameChanging = 'name' in body && body.name !== project.name;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = { updated_at: new Date() };
  if ('name' in body) data.name = body.name;
  if (nameChanging) data.slug = `${slugify(body.name as string)}-${randomSuffix(6)}`;
  else if ('slug' in body) data.slug = body.slug;
  if ('developer' in body) data.developer = body.developer;
  if ('province_id' in body) data.province_id = BigInt(body.province_id as number);
  if ('district_id' in body) data.district_id = BigInt(body.district_id as number);
  if ('ward_id' in body) data.ward_id = body.ward_id !== null ? BigInt(body.ward_id as number) : null;
  if ('agent_id' in body) data.agent_id = body.agent_id !== null ? BigInt(body.agent_id as number) : null;
  if ('type' in body) data.type = body.type;
  if ('status' in body) data.status = body.status;
  if ('description' in body) data.description = body.description;
  if ('total_area' in body) data.total_area = body.total_area !== null ? String(body.total_area) : null;
  if ('total_units' in body) data.total_units = body.total_units;
  if ('total_blocks' in body) data.total_blocks = body.total_blocks;
  if ('total_floors' in body) data.total_floors = body.total_floors;
  if ('price_from' in body) data.price_from = body.price_from !== null ? String(body.price_from) : null;
  if ('price_to' in body) data.price_to = body.price_to !== null ? String(body.price_to) : null;
  if ('legal' in body) data.legal = body.legal;
  if ('handover_date' in body) data.handover_date = body.handover_date ? new Date(body.handover_date as string) : null;
  if ('construction_progress' in body) data.construction_progress = body.construction_progress;
  if ('construction_note' in body) data.construction_note = body.construction_note;
  if ('utilities' in body) data.utilities = body.utilities;
  if ('address' in body) data.address = body.address;
  if ('thumbnail' in body) data.thumbnail = body.thumbnail;

  const updated = await db.projects.update({ where: { id: project.id }, data });

  return apiSuccess(mapAdminProjectResource(updated), 'Dự án đã được cập nhật.');
}

/** DELETE /api/v2/admin/projects/[id] — port của AdminProjectController@destroy (hard delete, Project không dùng SoftDeletes). */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy dự án.', 404);
  const project = await db.projects.findUnique({ where: { id: BigInt(id) } });
  if (!project) return apiError('Không tìm thấy dự án.', 404);

  const hasProperties = await db.properties.findFirst({ where: { project_id: project.id }, select: { id: true } });
  if (hasProperties) return apiError('Không thể xóa dự án đang có tin đăng.', 422);

  await db.projects.delete({ where: { id: project.id } });
  return apiSuccess(null, 'Dự án đã được xóa.');
}
