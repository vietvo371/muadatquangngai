import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapSettingResource } from '@/lib/api-resources/setting-resource';

/**
 * Laravel đăng ký CÙNG URL /settings/{param} 2 lần, phân biệt bằng HTTP method:
 *   PUT    /settings/{key} -> updateSingle (param là KEY chuỗi)
 *   DELETE /settings/{id}  -> destroy      (param là ID số)
 * Next.js không tách được 2 route trùng path, nên gộp cả 2 vào 1 file, đọc param theo
 * đúng ngữ nghĩa từng handler — vẫn đúng hành vi vì Laravel cũng phân biệt bằng method.
 */

/** PUT /api/v2/admin/settings/[param] — port của AdminSettingController@updateSingle. */
export async function PUT(request: Request, { params }: { params: Promise<{ param: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { param: key } = await params;
  const setting = await db.settings.findUnique({ where: { key } });
  if (!setting) return apiError('Không tìm thấy cài đặt.', 404);

  const body = await request.json().catch(() => ({}));
  const value = body.value === null || body.value === undefined ? null : String(body.value);

  const updated = await db.settings.update({ where: { id: setting.id }, data: { value, updated_at: new Date() } });
  return apiSuccess(mapSettingResource(updated), 'Cài đặt đã được cập nhật.');
}

const CORE_SETTINGS = new Set(['site_name', 'site_logo', 'contact_email', 'contact_phone']);

/** DELETE /api/v2/admin/settings/[param] — port của AdminSettingController@destroy. */
export async function DELETE(request: Request, { params }: { params: Promise<{ param: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { param: id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy cài đặt.', 404);

  const setting = await db.settings.findUnique({ where: { id: BigInt(id) } });
  if (!setting) return apiError('Không tìm thấy cài đặt.', 404);

  if (CORE_SETTINGS.has(setting.key)) return apiError('Không thể xóa cài đặt cốt lõi.', 422);

  await db.settings.delete({ where: { id: setting.id } });
  return apiSuccess(null, 'Cài đặt đã được xóa.');
}
