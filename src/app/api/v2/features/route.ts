import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';

/**
 * GET /api/v2/features?group=residential|industrial
 *
 * Trả danh sách tiện ích để form đăng tin dựng ô chọn. Trước đây form hardcode id 1-8
 * kèm tên tự đặt, lệch hoàn toàn với bảng features (id 1 form ghi "Hồ bơi" nhưng DB là
 * "Có sân vườn") nên tiện ích lưu vào DB sai so với thứ người dùng bấm.
 *
 * group_type: 'residential' | 'industrial' | 'all' (hiện ở mọi nhóm) | 'hidden' (không
 * phải tiện ích, vd. các dòng trạng thái pháp lý cũ lẫn trong bảng).
 */
export async function GET(request: NextRequest) {
  const group = request.nextUrl.searchParams.get('group');

  const rows = await db.features.findMany({
    where: group
      ? { group_type: { in: [group, 'all'] } }
      : { group_type: { not: 'hidden' } },
    select: { id: true, name: true, icon: true, group_type: true },
    orderBy: { id: 'asc' },
  });

  return apiSuccess(
    rows.map((f) => ({
      id: Number(f.id),
      name: f.name,
      icon: f.icon,
      group_type: f.group_type,
    }))
  );
}
