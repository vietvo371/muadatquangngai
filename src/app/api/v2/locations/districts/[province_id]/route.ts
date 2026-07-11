import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { mapDistrictResource } from '@/lib/api-resources/location-resource';

/** GET /api/v2/locations/districts/[province_id] — port của LocationController@districts. */
export async function GET(_request: Request, { params }: { params: Promise<{ province_id: string }> }) {
  const { province_id } = await params;
  if (!/^\d+$/.test(province_id)) return apiSuccess([]);

  const districts = await db.districts.findMany({
    where: { province_id: BigInt(province_id) },
    orderBy: { name: 'asc' },
  });
  return apiSuccess(districts.map((d) => mapDistrictResource(d)));
}
