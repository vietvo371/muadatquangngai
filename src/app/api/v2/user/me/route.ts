import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';
import { mapUserResource } from '@/lib/api-resources/user-resource';

/** GET /api/v2/user/me — port của UserController@me (->load(['province','district'])). */
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const [province, district] = await Promise.all([
    user.province_id !== null
      ? db.provinces.findUnique({ where: { id: user.province_id }, select: { id: true, name: true } })
      : Promise.resolve(null),
    user.district_id !== null
      ? db.districts.findUnique({ where: { id: user.district_id }, select: { id: true, name: true } })
      : Promise.resolve(null),
  ]);

  return apiSuccess(mapUserResource(user, user.id, { province, district }));
}
