import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';
import { FieldError, validationErrorResponse, isString, isBoolean, isInteger } from '@/lib/validation';
import { slugify } from '@/lib/formatters';

function mapAgency(row: {
  id: bigint; name: string; slug: string; logo: string | null; description: string | null;
  address: string | null; phone: string | null; email: string | null; website: string | null;
  is_verified: boolean; is_active: boolean; district_id: bigint | null; province_id: bigint | null;
  created_at: Date | null; updated_at: Date | null;
}) {
  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    logo: row.logo,
    description: row.description,
    address: row.address,
    phone: row.phone,
    email: row.email,
    website: row.website,
    verified: row.is_verified,
    active: row.is_active,
    district_id: row.district_id !== null ? Number(row.district_id) : null,
    province_id: row.province_id !== null ? Number(row.province_id) : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** GET /api/v2/admin/agencies — danh sách đầy đủ cho trang quản lý (gồm cả doanh nghiệp đã ẩn). */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const rows = await db.agencies.findMany({
    orderBy: { created_at: 'desc' },
  });
  const ids = rows.map((r) => r.id);
  const agentCounts = ids.length
    ? await db.users.groupBy({ by: ['agency_id'], where: { agency_id: { in: ids } }, _count: { _all: true } })
    : [];
  const countByAgency = new Map(agentCounts.map((c) => [c.agency_id!.toString(), c._count._all]));

  return apiSuccess(
    rows.map((r) => ({ ...mapAgency(r), agent_count: countByAgency.get(r.id.toString()) ?? 0 }))
  );
}

/** POST /api/v2/admin/agencies — tạo doanh nghiệp mới. */
export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const errors: FieldError[] = [];

  const name = isString(body.name) ? body.name.trim() : undefined;
  if (!name) errors.push(new FieldError('name', 'Trường tên doanh nghiệp không được để trống.'));
  else if (name.length > 255) errors.push(new FieldError('name', 'Trường tên doanh nghiệp không được lớn hơn 255 ký tự.'));

  if (body.district_id !== undefined && body.district_id !== null && !isInteger(body.district_id)) {
    errors.push(new FieldError('district_id', 'Trường xã/phường phải là số nguyên.'));
  }
  if (body.is_verified !== undefined && body.is_verified !== null && !isBoolean(body.is_verified)) {
    errors.push(new FieldError('is_verified', 'Trường đã xác minh phải là đúng hoặc sai.'));
  }
  if (body.is_active !== undefined && body.is_active !== null && !isBoolean(body.is_active)) {
    errors.push(new FieldError('is_active', 'Trường đang hoạt động phải là đúng hoặc sai.'));
  }

  if (errors.length > 0) return validationErrorResponse(errors);

  // Slug phải duy nhất — thêm hậu tố số nếu trùng, giống cách property/project đang làm.
  const base = slugify(name!);
  let slug = base;
  for (let i = 2; await db.agencies.findUnique({ where: { slug }, select: { id: true } }); i++) {
    slug = `${base}-${i}`;
  }

  const now = new Date();
  const created = await db.agencies.create({
    data: {
      name: name!,
      slug,
      logo: isString(body.logo) ? body.logo : null,
      description: isString(body.description) ? body.description : null,
      address: isString(body.address) ? body.address : null,
      district_id: body.district_id != null ? BigInt(body.district_id) : null,
      province_id: body.province_id != null ? BigInt(body.province_id) : null,
      phone: isString(body.phone) ? body.phone : null,
      email: isString(body.email) ? body.email : null,
      website: isString(body.website) ? body.website : null,
      is_verified: body.is_verified ?? false,
      is_active: body.is_active ?? true,
      created_at: now,
      updated_at: now,
    },
  });

  return apiSuccess(mapAgency(created), 'Doanh nghiệp đã được tạo.', 201);
}
