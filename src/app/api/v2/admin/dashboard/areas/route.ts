import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';

/**
 * GET /api/v2/admin/dashboard/areas — tỷ lệ tin đăng theo xã/phường.
 *
 * Tách khỏi /admin/dashboard vì route đó là bản port khớp từng byte với Laravel; thêm khoá
 * mới vào đó sẽ làm lệch phép đối chiếu của scripts/diff-api.mjs.
 *
 * Trước đây biểu đồ này hardcode 45%/20%/15%/12%/8% kèm tên đơn vị hành chính đã bị xoá sau
 * sáp nhập 2025 ("Thành phố Quảng Ngãi", "Huyện Bình Sơn") — quản trị viên nhìn vào đó để
 * ra quyết định mà toàn bộ là số bịa.
 */

const TOP_N = 5;

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const grouped = await db.properties.groupBy({
    by: ['district_id'],
    _count: { _all: true },
    orderBy: { _count: { district_id: 'desc' } },
  });

  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);
  if (total === 0) return apiSuccess({ total: 0, areas: [] });

  const ids = grouped.map((g) => g.district_id).filter((id): id is bigint => id !== null);
  const districts = ids.length
    ? await db.districts.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(districts.map((d) => [d.id.toString(), d.name]));

  const rows = grouped.map((g) => ({
    name: g.district_id ? (nameById.get(g.district_id.toString()) ?? 'Không rõ') : 'Chưa gán khu vực',
    count: g._count._all,
  }));

  const top = rows.slice(0, TOP_N);
  const restCount = rows.slice(TOP_N).reduce((sum, r) => sum + r.count, 0);
  if (restCount > 0) top.push({ name: 'Khu vực khác', count: restCount });

  return apiSuccess({
    total,
    areas: top.map((r) => ({
      name: r.name,
      count: r.count,
      percent: Math.round((r.count / total) * 100),
    })),
  });
}
