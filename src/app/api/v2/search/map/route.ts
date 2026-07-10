import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { FieldError, validationErrorResponse } from '@/lib/validation';

/**
 * GET /api/v2/search/map — port của SearchController@mapSearch.
 *
 * KHÔNG dùng PostGIS thật — dù bảng `properties` có cột `location` kiểu geography,
 * endpoint thật (route.get('/search/map') trong routes/api.php) chỉ lọc bounding-box
 * bằng `whereBetween` trên 2 cột decimal thô `latitude`/`longitude`, không đụng tới
 * `location`/ST_*. `App\Services\SearchService::mapSearch()` (dùng ST_Within thật) tồn
 * tại trong code nhưng KHÔNG được controller nào gọi — dead code, không port.
 *
 * Response raw-dump 9 cột (không qua Resource) — verify qua curl thật với property có
 * lat/lng thật: price/latitude/longitude serialize dạng STRING (decimal cast/PDO thô,
 * không có cast riêng cho latitude/longitude), type/is_vip là string enum value,
 * thumbnail là giá trị RAW trong cột (không explode lấy ảnh đầu như PropertyResource).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const swLat = searchParams.get('sw_lat');
  const swLng = searchParams.get('sw_lng');
  const neLat = searchParams.get('ne_lat');
  const neLng = searchParams.get('ne_lng');

  const errors: FieldError[] = [];
  const fields: Array<[string, string | null, string]> = [
    ['sw_lat', swLat, 'sw lat'],
    ['sw_lng', swLng, 'sw lng'],
    ['ne_lat', neLat, 'ne lat'],
    ['ne_lng', neLng, 'ne lng'],
  ];

  const parsed: Record<string, number> = {};
  for (const [key, raw, label] of fields) {
    if (raw === null || raw === '') {
      errors.push(new FieldError(key, `Trường ${label} không được để trống.`));
      continue;
    }
    const num = Number(raw);
    if (!Number.isFinite(num)) {
      errors.push(new FieldError(key, `Trường ${label} phải là số.`));
      continue;
    }
    const isLat = key.endsWith('_lat');
    const bound = isLat ? 90 : 180;
    if (num < -bound || num > bound) {
      errors.push(new FieldError(key, `Trường ${label} phải từ -${bound} đến ${bound}.`));
      continue;
    }
    parsed[key] = num;
  }

  if (errors.length > 0) return validationErrorResponse(errors);

  const now = new Date();
  const properties = await db.properties.findMany({
    where: {
      status: 'active',
      published_at: { not: null },
      OR: [{ expired_at: null }, { expired_at: { gt: now } }],
      latitude: { gte: parsed.sw_lat, lte: parsed.ne_lat, not: null },
      longitude: { gte: parsed.sw_lng, lte: parsed.ne_lng, not: null },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      thumbnail: true,
      price: true,
      latitude: true,
      longitude: true,
      type: true,
      is_vip: true,
    },
    take: 100,
  });

  return apiSuccess(
    properties.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      thumbnail: p.thumbnail,
      price: String(p.price),
      latitude: p.latitude !== null ? Number(p.latitude).toFixed(6) : null,
      longitude: p.longitude !== null ? Number(p.longitude).toFixed(6) : null,
      type: p.type,
      is_vip: p.is_vip,
    }))
  );
}
