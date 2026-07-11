import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';

/** GET /api/v2/search/count — port của SearchController@count (đếm tin active theo type/province). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const province = searchParams.get('province');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {
    status: 'active',
    OR: [{ expired_at: null }, { expired_at: { gt: new Date() } }],
    published_at: { not: null },
  };
  if (type) where.type = type;
  if (province && /^\d+$/.test(province)) where.province_id = BigInt(province);

  const count = await db.properties.count({ where });
  return apiSuccess({ count });
}
