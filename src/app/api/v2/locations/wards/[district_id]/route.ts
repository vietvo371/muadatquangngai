import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { mapWardResource } from '@/lib/api-resources/location-resource';

/** GET /api/v2/locations/wards/[district_id] — port của LocationController@wards. */
export async function GET(_request: Request, { params }: { params: Promise<{ district_id: string }> }) {
  const { district_id } = await params;
  if (!/^\d+$/.test(district_id)) return apiSuccess([]);

  const wards = await db.wards.findMany({
    where: { district_id: BigInt(district_id) },
    orderBy: { name: 'asc' },
  });
  return apiSuccess(wards.map((w) => mapWardResource(w)));
}
