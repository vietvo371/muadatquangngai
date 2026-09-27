import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { dbNow } from '@/lib/db-time';
import { validationErrorResponse } from '@/lib/validation';
import { readBusinessInput, findDuplicateBusiness, businessAdminResource, brokerCountsByBusiness } from '@/lib/business';

type Ctx = { params: Promise<{ id: string }> };

async function findBusiness(ctx: Ctx) {
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return null;
  return db.businesses.findUnique({ where: { id: BigInt(id) } });
}

/** PUT /api/v2/admin/businesses/[id] — sửa thông tin (slug giữ nguyên để link công khai không đổi). */
export async function PUT(request: Request, ctx: Ctx) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const existing = await findBusiness(ctx);
  if (!existing) return apiError('Không tìm thấy doanh nghiệp.', 404);

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { input, errors } = readBusinessInput(body, []);
  if (errors.length > 0) return validationErrorResponse(errors);

  if (input.tax_code) {
    const duplicate = await findDuplicateBusiness({ tax_code: input.tax_code }, existing.id);
    if (duplicate) return apiError(`Mã số thuế đã thuộc về "${duplicate.name}".`, 409);
  }

  const updated = await db.businesses.update({
    where: { id: existing.id },
    data: { ...input, updated_at: dbNow() },
  });
  const counts = await brokerCountsByBusiness([updated.id]);
  return apiSuccess(
    businessAdminResource(updated, { brokerCount: counts.get(updated.id.toString()) ?? 0, proposedByName: null, reviewedByName: null }),
    'Đã lưu thay đổi.'
  );
}

/**
 * DELETE /api/v2/admin/businesses/[id] — xoá hẳn. Không cho xoá khi còn môi giới trực thuộc: họ sẽ mất
 * Công ty/Sàn mà không hay biết. Muốn ẩn khỏi danh bạ thì dùng Từ chối (có lý do).
 */
export async function DELETE(request: Request, ctx: Ctx) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const existing = await findBusiness(ctx);
  if (!existing) return apiError('Không tìm thấy doanh nghiệp.', 404);

  const brokerCount = (await brokerCountsByBusiness([existing.id])).get(existing.id.toString()) ?? 0;
  if (brokerCount > 0) {
    return apiError(`Không thể xoá: còn ${brokerCount} môi giới trực thuộc. Hãy dùng Từ chối để ẩn doanh nghiệp.`, 409);
  }
  await db.businesses.delete({ where: { id: existing.id } });
  return apiSuccess(null, `Đã xoá ${existing.name}.`);
}

