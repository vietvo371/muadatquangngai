import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';
import { mapPropertyResource, loadWardsMap, type PropertyRow } from '@/lib/api-resources/property-resource';

const PROP_INCLUDE = {
  provinces: { select: { id: true, name: true, slug: true } },
  districts: { select: { id: true, name: true, slug: true } },
  categories: { select: { id: true, name: true, slug: true, icon: true } },
  property_media: {
    select: { id: true, type: true, url: true, thumbnail: true, caption: true, is_primary: true, sort_order: true },
  },
} as const;

/**
 * GET /api/v2/my/saved — port của SavedPropertyController@index.
 * Trả tin đã lưu (eager-load province/district/category/media, KHÔNG user), paginate 20.
 * Envelope đặc thù: data = { data: [...], meta: {...} } (Laravel bọc trong success()).
 */
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const { searchParams } = new URL(request.url);
  const perPage = 20;
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const [total, rows] = await Promise.all([
    db.saved_properties.count({ where: { user_id: user.id } }),
    db.saved_properties.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { properties: { include: PROP_INCLUDE } },
    }),
  ]);

  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? null : (page - 1) * perPage + 1;
  const to = total === 0 ? null : Math.min(page * perPage, total);

  const props = rows.map((s) => s.properties);
  const wards = await loadWardsMap(props);

  return apiSuccess({
    data: props.map((p) =>
      mapPropertyResource(p as unknown as PropertyRow, p.ward_id ? (wards.get(p.ward_id.toString()) ?? null) : null, { includeOwner: false })
    ),
    meta: { current_page: page, last_page: lastPage, per_page: perPage, total, from, to },
  });
}
