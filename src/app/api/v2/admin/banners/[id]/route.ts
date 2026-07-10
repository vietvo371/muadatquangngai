import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapBannerResource } from '@/lib/api-resources/banner-resource';
import { FieldError, validationErrorResponse, isString, isBoolean, inList } from '@/lib/validation';

const LINK_TARGETS = ['_self', '_blank'] as const;

/** GET /api/v2/admin/banners/[id] — port của AdminBannerController@show. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy banner.', 404);
  // Banner dùng SoftDeletes — Eloquent global scope tự loại deleted_at != null khỏi find().
  const banner = await db.banners.findFirst({ where: { id: BigInt(id), deleted_at: null } });
  if (!banner) return apiError('Không tìm thấy banner.', 404);

  return apiSuccess(mapBannerResource(banner));
}

/** PUT /api/v2/admin/banners/[id] — port của AdminBannerController@update. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy banner.', 404);
  const banner = await db.banners.findFirst({ where: { id: BigInt(id), deleted_at: null } });
  if (!banner) return apiError('Không tìm thấy banner.', 404);

  const body = await request.json().catch(() => ({}));
  const errors: FieldError[] = [];

  if ('title' in body) {
    if (!isString(body.title) || !body.title) errors.push(new FieldError('title', 'Trường họ và tên phải là chuỗi.'));
    else if (body.title.length > 255) errors.push(new FieldError('title', 'Trường họ và tên không được lớn hơn 255 ký tự.'));
  }
  if ('slug' in body) {
    if (!isString(body.slug) || !body.slug) errors.push(new FieldError('slug', 'Trường slug phải là chuỗi.'));
    else if (body.slug.length > 255) errors.push(new FieldError('slug', 'Trường slug không được lớn hơn 255 ký tự.'));
  }
  if ('image_url' in body && (!isString(body.image_url) || !body.image_url)) {
    errors.push(new FieldError('image_url', 'Trường image url phải là chuỗi.'));
  }
  if ('link_target' in body && body.link_target !== null && !inList(body.link_target, LINK_TARGETS)) {
    errors.push(new FieldError('link_target', 'Giá trị đã chọn trong trường link target không hợp lệ.'));
  }
  if ('is_active' in body && body.is_active !== null && !isBoolean(body.is_active)) {
    errors.push(new FieldError('is_active', 'Trường is active phải là đúng hoặc sai.'));
  }
  if (body.starts_at && body.ends_at && new Date(body.ends_at) < new Date(body.starts_at)) {
    errors.push(new FieldError('ends_at', 'Trường ends at phải là ngày sau hoặc bằng starts at.'));
  }

  if (errors.length === 0 && 'slug' in body && body.slug !== banner.slug) {
    const existing = await db.banners.findUnique({ where: { slug: body.slug } });
    if (existing) errors.push(new FieldError('slug', 'Trường slug đã được sử dụng.'));
  }

  if (errors.length > 0) return validationErrorResponse(errors);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = { updated_at: new Date() };
  if ('title' in body) data.title = body.title;
  if ('slug' in body) data.slug = body.slug;
  if ('type' in body) data.type = body.type;
  if ('position' in body) data.position = body.position;
  if ('image_url' in body) data.image_url = body.image_url;
  if ('link_url' in body) data.link_url = body.link_url;
  if ('link_target' in body) data.link_target = body.link_target;
  if ('content' in body) data.content = body.content;
  if ('sort_order' in body) data.sort_order = body.sort_order;
  if ('is_active' in body) data.is_active = body.is_active;
  if ('starts_at' in body) data.starts_at = body.starts_at ? new Date(body.starts_at) : null;
  if ('ends_at' in body) data.ends_at = body.ends_at ? new Date(body.ends_at) : null;

  const updated = await db.banners.update({ where: { id: banner.id }, data });
  return apiSuccess(mapBannerResource(updated), 'Banner đã được cập nhật.');
}

/** DELETE /api/v2/admin/banners/[id] — port của AdminBannerController@destroy (SoftDeletes, không hard-delete). */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy banner.', 404);
  const banner = await db.banners.findFirst({ where: { id: BigInt(id), deleted_at: null } });
  if (!banner) return apiError('Không tìm thấy banner.', 404);

  await db.banners.update({ where: { id: banner.id }, data: { deleted_at: new Date() } });
  return apiSuccess(null, 'Banner đã được xóa.');
}
