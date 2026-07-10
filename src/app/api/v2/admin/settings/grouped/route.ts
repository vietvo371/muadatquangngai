import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';
import { mapSettingResource } from '@/lib/api-resources/setting-resource';

/**
 * GET /api/v2/admin/settings/grouped — port của AdminSettingController@grouped.
 * ĐƠN GIẢN HOÁ CÓ CHỦ ĐÍCH (đã ghi rõ): Laravel's allSettingsGrouped() trả RAW Eloquent
 * toArray() (mọi cột, timestamp định dạng UTC mặc định của Carbon) — Next.js dùng shape
 * SettingResource sạch hơn (options đã json_decode, thiếu created_at/updated_at). Chấp
 * nhận vì đây là endpoint admin nội bộ, không phải hợp đồng public cần giữ tuyệt đối.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const rows = await db.settings.findMany({ orderBy: { sort_order: 'asc' } });

  const grouped: Record<string, unknown[]> = {};
  for (const row of rows) {
    (grouped[row.group] ??= []).push(mapSettingResource(row));
  }

  return apiSuccess(grouped);
}
