import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';

/**
 * GET /api/v2/admin/price-report/options — lựa chọn cho bộ lọc Báo cáo giá.
 * Chỉ trả tỉnh và phường/xã đã có dữ liệu giá, để bộ lọc không dẫn tới trang trống.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const [areas, categories] = await Promise.all([
    db.$queryRaw<{ id: string; name: string; province_id: string; province_name: string }[]>`
      SELECT d.id::text AS id, d.name, p.id::text AS province_id, p.name AS province_name
      FROM districts d
      JOIN provinces p ON p.id = d.province_id
      WHERE d.id IN (SELECT DISTINCT area_id FROM price_observations)
      ORDER BY d.name`,
    db.categories.findMany({
      where: { type: 'sell', is_active: true },
      orderBy: [{ sort_order: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true },
    }),
  ]);

  const provinces = [...new Map(areas.map((a) => [a.province_id, { id: a.province_id, name: a.province_name }])).values()];
  return apiSuccess({
    provinces,
    areas: areas.map(({ id, name, province_id }) => ({ id, name, province_id })),
    categories: categories.map((c) => ({ id: c.id.toString(), name: c.name })),
  });
}
