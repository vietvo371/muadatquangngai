import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiPaginated, apiSuccess, buildPaginationMeta } from '@/lib/api-response';
import { mapCategoryResource } from '@/lib/api-resources/category-resource';
import { toCarbonDefaultUtc } from '@/lib/api-resources/carbon-format';
import { FieldError, validationErrorResponse, isString, isBoolean, isInteger, inList } from '@/lib/validation';
import { slugify } from '@/lib/formatters';

/** $request->boolean() của Laravel: "1"/"true"/"on"/"yes" (không phân biệt hoa thường) -> true. */
function laravelBoolean(value: string | null): boolean {
  if (value === null) return false;
  return ['1', 'true', 'on', 'yes'].includes(value.toLowerCase());
}

/**
 * GET /api/v2/admin/categories — port của AdminCategoryController@index.
 *
 * Laravel gọi `$this->paginated($categories)` TRỰC TIẾP trên Eloquent Collection, KHÔNG
 * bọc qua CategoryResource (khác show/store/update/toggle — cả 4 method còn lại dùng đúng
 * CategoryResource) — cùng loại bug "quên wrap Resource" đã gặp ở PropertyController::
 * index(), AdminTransactionController::index(). Route admin-only, không phải hợp đồng
 * public nên giữ nguyên raw dump thật thay vì tự fix Laravel — verify qua curl thật
 * (response có is_active/created_at/updated_at mà CategoryResource không hề khai báo).
 */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const activeOnly = laravelBoolean(searchParams.get('active_only'));
  const perPage = 50;
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const where = activeOnly ? { is_active: true } : {};
  const [total, rows] = await Promise.all([
    db.categories.count({ where }),
    db.categories.findMany({ where, orderBy: { sort_order: 'asc' }, skip: (page - 1) * perPage, take: perPage }),
  ]);

  return apiPaginated(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      type: r.type,
      icon: r.icon,
      sort_order: r.sort_order,
      is_active: r.is_active,
      created_at: toCarbonDefaultUtc(r.created_at),
      updated_at: toCarbonDefaultUtc(r.updated_at),
    })),
    buildPaginationMeta(total, page, perPage)
  );
}

/** POST /api/v2/admin/categories — port của AdminCategoryController@store. */
export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const errors: FieldError[] = [];

  const name = isString(body.name) ? body.name : undefined;
  if (!name) errors.push(new FieldError('name', 'Trường họ và tên không được để trống.'));
  else if (name.length > 100) errors.push(new FieldError('name', 'Trường họ và tên không được lớn hơn 100 ký tự.'));

  if (body.slug !== undefined && body.slug !== null) {
    if (!isString(body.slug) || body.slug.length > 100) errors.push(new FieldError('slug', 'Trường slug không được lớn hơn 100 ký tự.'));
    else {
      const existing = await db.categories.findUnique({ where: { slug: body.slug }, select: { id: true } });
      if (existing) errors.push(new FieldError('slug', 'Trường slug đã được sử dụng.'));
    }
  }

  const type = body.type;
  if (!type) errors.push(new FieldError('type', 'Trường loại tin không được để trống.'));
  else if (!inList(type, ['sell', 'rent', 'project'])) errors.push(new FieldError('type', 'Giá trị đã chọn trong trường loại tin không hợp lệ.'));

  if (body.sort_order !== undefined && body.sort_order !== null && !isInteger(body.sort_order)) {
    errors.push(new FieldError('sort_order', 'Trường sort order phải là số nguyên.'));
  }
  if (body.is_active !== undefined && body.is_active !== null && !isBoolean(body.is_active)) {
    errors.push(new FieldError('is_active', 'Trường is active phải là đúng hoặc sai.'));
  }

  if (errors.length > 0) return validationErrorResponse(errors);

  const slug = body.slug || slugify(name!);
  const now = new Date();

  const created = await db.categories.create({
    data: {
      name: name!,
      slug,
      type: type!,
      icon: body.icon ?? null,
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active ?? true,
      created_at: now,
      updated_at: now,
    },
  });

  return apiSuccess(mapCategoryResource(created), 'Danh mục đã được tạo.', 201);
}
