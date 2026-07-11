import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { mapProvinceResource } from '@/lib/api-resources/location-resource';

/** GET /api/v2/locations/provinces — port của LocationController@provinces. */
export async function GET() {
  const provinces = await db.provinces.findMany({ orderBy: { name: 'asc' } });
  return apiSuccess(provinces.map((p) => mapProvinceResource(p)));
}
