import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { dbNow } from '@/lib/db-time';
import { fetchNearbyPlaces, type NearbyPlacesResult } from '@/lib/nearby-places';

/**
 * GET /api/v2/properties/[slug]/nearby — tiện ích xung quanh tin đăng (Notion 06/10
 * "Chi tiết BĐS – Bản đồ & Tiện ích xung quanh").
 *
 * Tra Goong Place API MỘT LẦN rồi lưu vào properties.nearby_places; những lượt xem sau đọc
 * thẳng từ DB. Mỗi lần tra tốn hàng chục lượt gọi Place API tính phí nên không thể tra lại
 * mỗi lượt xem, mà cũng không nên tra sẵn cho mọi tin — phần lớn tin chẳng ai mở chi tiết.
 *
 * Tách khỏi /api/v2/properties/[slug] để trang chi tiết hiện ngay, không phải chờ lần tra
 * đầu tiên (mất vài giây) mới vẽ được nội dung.
 */

/** Toạ độ lệch quá ngưỡng này coi như tin đã dời chỗ, phải tra lại. ~100m. */
const COORD_EPSILON = 0.001;

interface CachedNearby {
  lat: number;
  lng: number;
  places: NearbyPlacesResult;
}

function readCache(value: unknown, lat: number, lng: number): NearbyPlacesResult | null {
  if (!value || typeof value !== 'object') return null;
  const cached = value as Partial<CachedNearby>;
  if (typeof cached.lat !== 'number' || typeof cached.lng !== 'number' || !cached.places) return null;
  // Chủ tin dời ghim bản đồ thì tiện ích cũ không còn đúng nữa.
  if (Math.abs(cached.lat - lat) > COORD_EPSILON || Math.abs(cached.lng - lng) > COORD_EPSILON) return null;
  return cached.places;
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const property = await db.properties.findFirst({
    where: { slug },
    select: { id: true, latitude: true, longitude: true, nearby_places: true },
  });
  if (!property) return apiError('Không tìm thấy tin đăng.', 404);

  if (property.latitude === null || property.longitude === null) {
    // Tin chưa ghim bản đồ — không có gì để tra, và đó không phải lỗi.
    return apiSuccess({ places: null, reason: 'no_coordinates' });
  }

  const lat = Number(property.latitude);
  const lng = Number(property.longitude);

  const cached = readCache(property.nearby_places, lat, lng);
  if (cached) return apiSuccess({ places: cached, cached: true });

  let places: NearbyPlacesResult;
  try {
    places = await fetchNearbyPlaces(lat, lng);
  } catch (error) {
    // Goong lỗi/hết quota: trả rỗng cho lượt xem này và KHÔNG lưu, để lần sau tra lại —
    // lưu kết quả rỗng do lỗi tạm thời thì tin đó vĩnh viễn trông như không có tiện ích nào.
    console.error('[nearby] Không tra được tiện ích quanh tin đăng:', error);
    return apiSuccess({ places: null, reason: 'lookup_failed' });
  }

  await db.properties.update({
    where: { id: property.id },
    data: {
      nearby_places: JSON.parse(JSON.stringify({ lat, lng, places })),
      nearby_places_at: dbNow(),
    },
  });

  return apiSuccess({ places, cached: false });
}

export const dynamic = 'force-dynamic';
