import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapCategoryResource } from '@/lib/api-resources/category-resource';
import { FieldError, validationErrorResponse, isString, isBoolean, isInteger, inList } from '@/lib/validation';
import { ALL_GROUP_FIELDS } from '@/lib/property-form-config';

/** Chuẩn hoá detail_fields → CSV field key hợp lệ (feedback #4), null nếu rỗng. */
function normalizeDetailFields(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : [];
  const set = new Set(list.map((s) => String(s).trim()));
  const valid = ALL_GROUP_FIELDS.filter((f) => set.has(f));
  return valid.length > 0 ? valid.join(',') : null;
}

async function findCategory(id: string) {
  if (!/^\d+$/.test(id)) return null;
  return db.categories.findUnique({ where: { id: BigInt(id) } });
}

/** GET /api/v2/admin/categories/[id] — port của AdminCategoryController@show. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const category = await findCategory((await params).id);
  if (!category) return apiError('Không tìm thấy danh mục.', 404);
  return apiSuccess(mapCategoryResource(category));
}

/** PUT /api/v2/admin/categories/[id] — port của AdminCategoryController@update. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const category = await findCategory(id);
  if (!category) return apiError('Không tìm thấy danh mục.', 404);

  const body = await request.json().catch(() => ({}));
  const errors: FieldError[] = [];

  if ('name' in body) {
    if (!isString(body.name) || !body.name) errors.push(new FieldError('name', 'Trường họ và tên phải là chuỗi.'));
    else if (body.name.length > 100) errors.push(new FieldError('name', 'Trường họ và tên không được lớn hơn 100 ký tự.'));
  }
  if ('slug' in body && body.slug !== null) {
    if (!isString(body.slug) || body.slug.length > 100) errors.push(new FieldError('slug', 'Trường slug không được lớn hơn 100 ký tự.'));
    else {
      const existing = await db.categories.findUnique({ where: { slug: body.slug }, select: { id: true } });
      if (existing && existing.id !== category.id) errors.push(new FieldError('slug', 'Trường slug đã được sử dụng.'));
    }
  }
  if ('type' in body && !inList(body.type, ['sell', 'rent', 'project'])) {
    errors.push(new FieldError('type', 'Giá trị đã chọn trong trường loại tin không hợp lệ.'));
  }
  if ('sort_order' in body && body.sort_order !== null && !isInteger(body.sort_order)) {
    errors.push(new FieldError('sort_order', 'Trường sort order phải là số nguyên.'));
  }
  if ('is_active' in body && body.is_active !== null && !isBoolean(body.is_active)) {
    errors.push(new FieldError('is_active', 'Trường is active phải là đúng hoặc sai.'));
  }

  if (errors.length > 0) return validationErrorResponse(errors);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = { updated_at: new Date() };
  if ('name' in body) data.name = body.name;
  if ('slug' in body) data.slug = body.slug;
  if ('type' in body) data.type = body.type;
  if ('icon' in body) data.icon = body.icon;
  if ('sort_order' in body) data.sort_order = body.sort_order;
  if ('is_active' in body) data.is_active = body.is_active;
  if ('detail_fields' in body) data.detail_fields = normalizeDetailFields(body.detail_fields);

  const updated = await db.categories.update({ where: { id: category.id }, data });
  return apiSuccess(mapCategoryResource(updated), 'Danh mục đã được cập nhật.');
}

/** DELETE /api/v2/admin/categories/[id] — port của AdminCategoryController@destroy. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const category = await findCategory((await params).id);
  if (!category) return apiError('Không tìm thấy danh mục.', 404);

  const hasProperties = await db.properties.findFirst({ where: { category_id: category.id }, select: { id: true } });
  if (hasProperties) return apiError('Không thể xóa danh mục đang có tin đăng.', 422);

  await db.categories.delete({ where: { id: category.id } });
  return apiSuccess(null, 'Danh mục đã được xóa.');
}
