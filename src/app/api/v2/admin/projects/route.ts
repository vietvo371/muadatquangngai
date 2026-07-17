import { randomUUID, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiPaginated, apiSuccess, buildPaginationMeta } from '@/lib/api-response';
import { mapAdminProjectResource } from '@/lib/api-resources/project-resource';
import { mapDistrictFromAddress } from '@/lib/api-resources/project-district-mapping';
import { validateProjectFields } from '@/lib/api-resources/project-validation';
import { FieldError, validationErrorResponse, isInteger } from '@/lib/validation';
import { slugify } from '@/lib/formatters';
import { DEFAULT_PROJECT_TYPE } from '@/lib/project-type';

function randomSuffix(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(randomBytes(length))
    .map((b) => chars[b % chars.length])
    .join('');
}

/** GET /api/v2/admin/projects — port của AdminProjectController@index. */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const provinceId = searchParams.get('province_id');
  const search = searchParams.get('search');
  const perPage = 20;
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (status) where.status = status;
  if (provinceId) where.province_id = BigInt(provinceId);
  if (search) where.name = { contains: search };

  const [total, rows] = await Promise.all([
    db.projects.count({ where }),
    db.projects.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { provinces: true, districts: true },
    }),
  ]);

  return apiPaginated(
    rows.map((r) => mapAdminProjectResource(r)),
    buildPaginationMeta(total, page, perPage)
  );
}

/**
 * POST /api/v2/admin/projects — port của AdminProjectController@store + ProjectService::create().
 *
 * Map field FE (min_price/max_price/investor/location) sang cột DB (price_from/price_to/
 * developer/address) TRƯỚC khi validate — đúng thứ tự Laravel. `slug` client gửi lên VẪN
 * được validate unique (nếu có) nhưng SAU ĐÓ bị ProjectService::create() ghi đè vô điều
 * kiện bằng slug tự sinh (`Str::slug($name).'-'.Str::random(6)`) — đây là hành vi thật của
 * code, không phải lỗi implement thiếu, giữ nguyên để khớp response thật. Response trả về
 * KHÔNG eager-load quan hệ nào (Project::create() trả bare model) nên location.province/
 * district/ward và owner/agent đều bị omit khỏi response — xem mapAdminProjectResource.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const raw = await request.json().catch(() => ({}));
  const body: Record<string, unknown> = { ...raw };

  if ('min_price' in body) body.price_from = body.min_price;
  if ('max_price' in body) body.price_to = body.max_price;
  if ('investor' in body) body.developer = body.investor;
  if ('location' in body) body.address = body.location;

  if (!('province_id' in body)) body.province_id = 64;
  if (!('user_id' in body)) body.user_id = Number(guard.id);
  if (!('status' in body)) body.status = 'draft';
  if (!('type' in body)) body.type = DEFAULT_PROJECT_TYPE;

  if (!('district_id' in body)) {
    const addressText = (body.address as string) ?? '';
    body.district_id = Number(mapDistrictFromAddress(addressText));
  }

  const errors = await validateProjectFields(body, { requireName: true, requireAddress: true, requireProvince: true });

  if (!isInteger(body.user_id)) errors.push(new FieldError('user_id', 'Trường user id phải là số nguyên.'));
  else {
    const exists = await db.users.findUnique({ where: { id: BigInt(body.user_id as number) } });
    if (!exists) errors.push(new FieldError('user_id', 'Giá trị đã chọn trong trường user id không hợp lệ.'));
  }

  if (errors.length > 0) return validationErrorResponse(errors);

  const now = new Date();
  const created = await db.projects.create({
    data: {
      name: body.name as string,
      slug: `${slugify(body.name as string)}-${randomSuffix(6)}`,
      uuid: randomUUID(),
      user_id: BigInt(body.user_id as number),
      developer: (body.developer as string) ?? null,
      province_id: BigInt(body.province_id as number),
      district_id: BigInt(body.district_id as number), // NOT NULL trong DB — luôn có giá trị nhờ auto-map từ address ở trên
      ward_id: body.ward_id !== undefined && body.ward_id !== null ? BigInt(body.ward_id as number) : null,
      agent_id: body.agent_id !== undefined && body.agent_id !== null ? BigInt(body.agent_id as number) : null,
      type: body.type as string,
      status: body.status as string,
      description: (body.description as string) ?? null,
      total_area: body.total_area !== undefined && body.total_area !== null ? String(body.total_area) : null,
      total_units: (body.total_units as number) ?? null,
      total_blocks: (body.total_blocks as number) ?? null,
      total_floors: (body.total_floors as number) ?? null,
      price_from: body.price_from !== undefined && body.price_from !== null ? String(body.price_from) : null,
      price_to: body.price_to !== undefined && body.price_to !== null ? String(body.price_to) : null,
      legal: (body.legal as string) ?? null,
      handover_date: body.handover_date ? new Date(body.handover_date as string) : null,
      construction_progress: (body.construction_progress as number) ?? null,
      construction_note: (body.construction_note as string) ?? null,
      utilities: body.utilities ?? undefined,
      floor_plans: body.floor_plans ?? undefined,
      address: body.address as string,
      thumbnail: (body.thumbnail as string) ?? null,
      view_count: 0,
      created_at: now,
      updated_at: now,
    },
  });

  return apiSuccess(mapAdminProjectResource(created), 'Dự án đã được tạo.', 201);
}
