import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-response';

/** GET /api/v2/admin/packages/stats — port của AdminPackageController@stats. */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const packages = await db.packages.findMany();
  const stats = await Promise.all(
    packages.map(async (p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      active_subscriptions: await db.subscriptions.count({ where: { package_id: p.id, status: 'active' } }),
    }))
  );

  return apiSuccess(stats);
}
