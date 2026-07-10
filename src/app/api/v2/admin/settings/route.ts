import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';
import { mapSettingResource } from '@/lib/api-resources/setting-resource';
import { FieldError, validationErrorResponse, isString } from '@/lib/validation';

/** GET /api/v2/admin/settings — port của AdminSettingController@index. */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const rows = await db.settings.findMany({ orderBy: [{ group: 'asc' }, { sort_order: 'asc' }] });
  return apiSuccess(rows.map((r) => mapSettingResource(r)));
}

/** PUT /api/v2/admin/settings — port của AdminSettingController@update (upsert hàng loạt theo key). */
export async function PUT(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  if (!body.settings || typeof body.settings !== 'object' || Array.isArray(body.settings)) {
    return validationErrorResponse([new FieldError('settings', 'Trường settings không được để trống.')]);
  }

  const now = new Date();
  for (const [key, value] of Object.entries(body.settings as Record<string, unknown>)) {
    const valueStr = value === null || value === undefined ? null : String(value);
    await db.settings.upsert({
      where: { key },
      update: { value: valueStr, updated_at: now },
      create: { key, value: valueStr, label: key, created_at: now, updated_at: now },
    });
  }

  // allSettings(): pluck('value','key') -> object phẳng {key: value}
  const all = await db.settings.findMany({ orderBy: [{ group: 'asc' }, { sort_order: 'asc' }] });
  const flat = Object.fromEntries(all.map((s) => [s.key, s.value]));

  return apiSuccess(flat, 'Cài đặt đã được lưu.');
}

/** POST /api/v2/admin/settings — port của AdminSettingController@store. */
export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const errors: FieldError[] = [];

  const key = isString(body.key) ? body.key : undefined;
  if (!key) errors.push(new FieldError('key', 'Trường key không được để trống.'));
  else {
    const existing = await db.settings.findUnique({ where: { key }, select: { id: true } });
    if (existing) errors.push(new FieldError('key', 'Trường key đã được sử dụng.'));
  }
  const group = isString(body.group) ? body.group : undefined;
  if (!group) errors.push(new FieldError('group', 'Trường group không được để trống.'));
  const type = isString(body.type) ? body.type : undefined;
  if (!type) errors.push(new FieldError('type', 'Trường loại tin không được để trống.'));
  const label = isString(body.label) ? body.label : undefined;
  if (!label) errors.push(new FieldError('label', 'Trường label không được để trống.'));

  if (errors.length > 0) return validationErrorResponse(errors);

  const now = new Date();
  const created = await db.settings.create({
    data: {
      key: key!,
      group: group!,
      type: type!,
      label: label!,
      value: body.value != null ? String(body.value) : null,
      options: body.options ?? null,
      description: body.description ?? null,
      sort_order: body.sort_order ?? 0,
      created_at: now,
      updated_at: now,
    },
  });

  return apiSuccess(mapSettingResource(created), 'Cài đặt đã được tạo.', 201);
}
