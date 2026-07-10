import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiPaginated, buildPaginationMeta } from '@/lib/api-response';
import { mapBannerResource, mapBannerCreateResponse } from '@/lib/api-resources/banner-resource';
import { FieldError, validationErrorResponse, isString, isBoolean, inList } from '@/lib/validation';
import { slugify } from '@/lib/formatters';

function randomSuffix(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(randomBytes(length))
    .map((b) => chars[b % chars.length])
    .join('');
}

const LINK_TARGETS = ['_self', '_blank'] as const;

/** GET /api/v2/admin/banners — port của AdminBannerController@index. */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const position = searchParams.get('position');
  const status = searchParams.get('status');
  const perPage = 20;
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { deleted_at: null }; // Banner dùng SoftDeletes — global scope tự loại bản ghi đã xoá
  if (type) where.type = type;
  if (position) where.position = position;
  if (status) where.is_active = status === 'active';

  const [total, rows] = await Promise.all([
    db.banners.count({ where }),
    db.banners.findMany({ where, orderBy: { created_at: 'desc' }, skip: (page - 1) * perPage, take: perPage }),
  ]);

  return apiPaginated(rows.map((r) => mapBannerResource(r)), buildPaginationMeta(total, page, perPage));
}

/** POST /api/v2/admin/banners — port của AdminBannerController@store. */
export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const errors: FieldError[] = [];

  if (!isString(body.title) || !body.title) errors.push(new FieldError('title', 'Trường họ và tên không được để trống.'));
  else if (body.title.length > 255) errors.push(new FieldError('title', 'Trường họ và tên không được lớn hơn 255 ký tự.'));

  if (body.slug !== undefined && body.slug !== null) {
    if (!isString(body.slug)) errors.push(new FieldError('slug', 'Trường slug phải là chuỗi.'));
    else if (body.slug.length > 255) errors.push(new FieldError('slug', 'Trường slug không được lớn hơn 255 ký tự.'));
  }

  if (!isString(body.type) || !body.type) errors.push(new FieldError('type', 'Trường loại tin không được để trống.'));
  if (!isString(body.position) || !body.position) errors.push(new FieldError('position', 'Trường position không được để trống.'));
  if (!isString(body.image_url) || !body.image_url) errors.push(new FieldError('image_url', 'Trường image url không được để trống.'));

  if (body.link_target !== undefined && body.link_target !== null && !inList(body.link_target, LINK_TARGETS)) {
    errors.push(new FieldError('link_target', 'Giá trị đã chọn trong trường link target không hợp lệ.'));
  }
  if (body.is_active !== undefined && body.is_active !== null && !isBoolean(body.is_active)) {
    errors.push(new FieldError('is_active', 'Trường is active phải là đúng hoặc sai.'));
  }
  if (body.starts_at && body.ends_at && new Date(body.ends_at) < new Date(body.starts_at)) {
    errors.push(new FieldError('ends_at', 'Trường ends at phải là ngày sau hoặc bằng starts at.'));
  }

  if (errors.length === 0 && body.slug) {
    const existing = await db.banners.findUnique({ where: { slug: body.slug } });
    if (existing) errors.push(new FieldError('slug', 'Trường slug đã được sử dụng.'));
  }

  if (errors.length > 0) return validationErrorResponse(errors);

  const slug = body.slug || `${slugify(body.title)}-${randomSuffix(6)}`;
  const now = new Date();

  const created = await db.banners.create({
    data: {
      title: body.title,
      slug,
      type: body.type,
      position: body.position,
      image_url: body.image_url,
      link_url: body.link_url ?? null,
      link_target: body.link_target ?? undefined,
      content: body.content ?? null,
      sort_order: body.sort_order ?? undefined,
      is_active: body.is_active ?? undefined,
      starts_at: body.starts_at ? new Date(body.starts_at) : null,
      ends_at: body.ends_at ? new Date(body.ends_at) : null,
      created_by: guard.id,
      created_at: now,
      updated_at: now,
    },
  });

  return new NextResponse(
    JSON.stringify(
      { success: true, message: 'Banner đã được tạo.', data: mapBannerCreateResponse({ ...body, slug }, created) },
      (_key, v) => (typeof v === 'bigint' ? Number(v) : v)
    ),
    { status: 201, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
  );
}
