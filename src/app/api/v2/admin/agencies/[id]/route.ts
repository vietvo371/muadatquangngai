import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { FieldError, validationErrorResponse, isString, isBoolean, isInteger } from '@/lib/validation';
import { isValidAgencyBusinessType } from '@/lib/agency-business-types';

function mapAgency(row: {
  id: bigint; name: string; slug: string; logo: string | null; description: string | null;
  address: string | null; phone: string | null; email: string | null; website: string | null;
  business_type: string; is_verified: boolean; is_active: boolean; district_id: bigint | null; province_id: bigint | null;
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
    business_type: row.business_type,
    verified: row.is_verified,
    active: row.is_active,
    district_id: row.district_id !== null ? Number(row.district_id) : null,
    province_id: row.province_id !== null ? Number(row.province_id) : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** PUT /api/v2/admin/agencies/[id] — sửa thông tin doanh nghiệp. */
export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy doanh nghiệp.', 404);

  const existing = await db.agencies.findUnique({ where: { id: BigInt(id) } });
  if (!existing) return apiError('Không tìm thấy doanh nghiệp.', 404);

  const body = await request.json().catch(() => ({}));
  const errors: FieldError[] = [];

  const name = body.name !== undefined ? (isString(body.name) ? body.name.trim() : undefined) : existing.name;
  if (body.name !== undefined && !name) {
    errors.push(new FieldError('name', 'Trường tên doanh nghiệp không được để trống.'));
  }
  if (body.district_id !== undefined && body.district_id !== null && !isInteger(body.district_id)) {
    errors.push(new FieldError('district_id', 'Trường xã/phường phải là số nguyên.'));
  }
  if (body.business_type !== undefined && body.business_type !== null && !isValidAgencyBusinessType(body.business_type)) {
    errors.push(new FieldError('business_type', 'Giá trị đã chọn trong trường lĩnh vực không hợp lệ.'));
  }
  if (body.is_verified !== undefined && body.is_verified !== null && !isBoolean(body.is_verified)) {
    errors.push(new FieldError('is_verified', 'Trường đã xác minh phải là đúng hoặc sai.'));
  }
  if (body.is_active !== undefined && body.is_active !== null && !isBoolean(body.is_active)) {
    errors.push(new FieldError('is_active', 'Trường đang hoạt động phải là đúng hoặc sai.'));
  }

  if (errors.length > 0) return validationErrorResponse(errors);

  const updated = await db.agencies.update({
    where: { id: existing.id },
    data: {
      name: name!,
      logo: body.logo !== undefined ? (isString(body.logo) ? body.logo : null) : undefined,
      description: body.description !== undefined ? (isString(body.description) ? body.description : null) : undefined,
      address: body.address !== undefined ? (isString(body.address) ? body.address : null) : undefined,
      district_id: body.district_id !== undefined ? (body.district_id != null ? BigInt(body.district_id) : null) : undefined,
      province_id: body.province_id !== undefined ? (body.province_id != null ? BigInt(body.province_id) : null) : undefined,
      phone: body.phone !== undefined ? (isString(body.phone) ? body.phone : null) : undefined,
      email: body.email !== undefined ? (isString(body.email) ? body.email : null) : undefined,
      website: body.website !== undefined ? (isString(body.website) ? body.website : null) : undefined,
      business_type: isValidAgencyBusinessType(body.business_type) ? body.business_type : undefined,
      is_verified: body.is_verified !== undefined ? body.is_verified : undefined,
      is_active: body.is_active !== undefined ? body.is_active : undefined,
      updated_at: new Date(),
    },
  });

  return apiSuccess(mapAgency(updated), 'Đã lưu thay đổi.');
}

/**
 * DELETE /api/v2/admin/agencies/[id] — xoá doanh nghiệp.
 *
 * Không xoá cứng khi còn môi giới gắn với doanh nghiệp này: xoá sẽ khiến các môi giới đó
 * chỉ còn agency_name (ô chữ tự do cũ), mất liên kết mà admin không hề hay biết. Bắt phải
 * gỡ hết môi giới trước.
 */
export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy doanh nghiệp.', 404);

  const agencyId = BigInt(id);
  const existing = await db.agencies.findUnique({ where: { id: agencyId } });
  if (!existing) return apiError('Không tìm thấy doanh nghiệp.', 404);

  const agentCount = await db.users.count({ where: { agency_id: agencyId } });
  if (agentCount > 0) {
    return apiError(
      `Không thể xoá: còn ${agentCount} môi giới đang thuộc doanh nghiệp này. Gỡ hết môi giới trước.`,
      409
    );
  }

  await db.agencies.delete({ where: { id: agencyId } });
  return apiSuccess(null, 'Đã xoá doanh nghiệp.');
}
