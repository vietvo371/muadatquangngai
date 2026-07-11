import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapPropertyResource, loadWardsMap, type PropertyRow } from '@/lib/api-resources/property-resource';

const INCLUDE = {
  provinces: { select: { id: true, name: true, slug: true } },
  districts: { select: { id: true, name: true, slug: true } },
  categories: { select: { id: true, name: true, slug: true, icon: true } },
} as const;

/** Haversine — km. Đối chiếu PropertyController::haversineDistance(). */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * GET /api/v2/properties/nearby — port của PropertyController@nearby.
 * Lọc bounding-box bằng haversine (bản fallback lat/lng, không PostGIS — giống Laravel),
 * sắp theo khoảng cách, lấy 10. Eager-load province/district/category (không user/media).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');
  const radius = parseFloat(searchParams.get('radius') ?? '5') || 5;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return apiError('Vui lòng cung cấp lat và lng.', 422);
  }

  const rows = await db.properties.findMany({
    where: {
      status: 'active',
      OR: [{ expired_at: null }, { expired_at: { gt: new Date() } }],
      published_at: { not: null },
      latitude: { not: null },
      longitude: { not: null },
    },
    include: INCLUDE,
  });

  const nearby = rows
    .map((p) => ({ p, dist: haversine(lat, lng, Number(p.latitude), Number(p.longitude)) }))
    .filter(({ dist }) => dist <= radius)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 10)
    .map(({ p }) => p);

  const wards = await loadWardsMap(nearby);
  return apiSuccess(
    nearby.map((p) =>
      mapPropertyResource(p as unknown as PropertyRow, p.ward_id ? (wards.get(p.ward_id.toString()) ?? null) : null, {
        includeOwner: false,
        includeMedia: false,
      })
    )
  );
}
