import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { mapPropertyResource, loadWardsMap, type PropertyRow } from '@/lib/api-resources/property-resource';

const INCLUDE = {
  provinces: { select: { id: true, name: true, slug: true } },
  districts: { select: { id: true, name: true, slug: true } },
  categories: { select: { id: true, name: true, slug: true, icon: true } },
  users: { select: { id: true, name: true, phone: true, avatar: true, role: true, rating: true, total_listings: true } },
} as const;

const vipOrder: Record<string, number> = { diamond: 1, vip_plus: 2, vip: 3 };

/**
 * GET /api/v2/properties/featured — port của PropertyController@featured.
 * Chỉ tin VIP (is_vip != normal), sắp theo hạng VIP rồi published_at desc.
 * Eager-load user (KHÔNG media) → includeMedia:false.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = parseInt(searchParams.get('limit') ?? '6', 10);
  const limit = Math.min(Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 6, 20);

  const rows = await db.properties.findMany({
    where: {
      status: 'active',
      OR: [{ expired_at: null }, { expired_at: { gt: new Date() } }],
      published_at: { not: null },
      is_vip: { not: 'normal' },
    },
    include: INCLUDE,
    orderBy: { published_at: 'desc' },
  });

  const ranked = rows
    .map((p) => ({ p, rank: vipOrder[p.is_vip] ?? 4 }))
    .sort((a, b) => a.rank - b.rank) // ổn định: giữ published_at desc trong cùng hạng
    .slice(0, limit)
    .map(({ p }) => p);

  const wards = await loadWardsMap(ranked);
  return apiSuccess(
    ranked.map((p) =>
      mapPropertyResource(p as unknown as PropertyRow, p.ward_id ? (wards.get(p.ward_id.toString()) ?? null) : null, { includeMedia: false })
    )
  );
}
