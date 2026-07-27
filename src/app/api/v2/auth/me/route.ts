import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { getAuthContext, unauthenticatedResponse } from '@/lib/auth';
import { mapUserResource } from '@/lib/api-resources/user-resource';

/** GET /api/v2/auth/me — port của UserController@me (eager-load province/district). */
export async function GET(request: Request) {
  const ctx = await getAuthContext(request);
  if (!ctx) return unauthenticatedResponse();

  const { user } = ctx;
  const [province, district] = await Promise.all([
    user.province_id !== null
      ? db.provinces.findUnique({ where: { id: user.province_id }, select: { id: true, name: true } })
      : Promise.resolve(null),
    user.district_id !== null
      ? db.districts.findUnique({ where: { id: user.district_id }, select: { id: true, name: true } })
      : Promise.resolve(null),
  ]);

  return apiSuccess({
    user: mapUserResource(user, user.id, { province, district }),
  });
}
