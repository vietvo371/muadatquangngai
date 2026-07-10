import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';

/** GET /api/v2/admin/packages/stats — port của AdminPackageController@stats. */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const [packages, activeCounts] = await Promise.all([
    db.packages.findMany(),
    db.subscriptions.groupBy({ by: ['package_id'], where: { status: 'active' }, _count: { _all: true } }),
  ]);
  const countByPackage = new Map(activeCounts.map((c) => [c.package_id.toString(), c._count._all]));

  const stats = packages.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    active_subscriptions: countByPackage.get(p.id.toString()) ?? 0,
  }));

  return apiSuccess(stats);
}
