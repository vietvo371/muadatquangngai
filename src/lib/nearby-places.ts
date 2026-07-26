/**
 * Geocode địa chỉ dự án + tra cứu tiện ích thật lân cận (trường học, siêu thị, công viên,
 * bệnh viện) bằng dữ liệu mở — không có ngân sách Google Places nên dùng Nominatim
 * (geocode, đã dùng ở /api/v2/geocode/search) + Overpass API (OpenStreetMap, miễn phí,
 * không cần key). Kết quả tính MỘT LẦN lúc tạo/sửa dự án rồi lưu vào cột nearby_places —
 * trang public không gọi API ngoài lúc tải trang (xem lib/api-resources/project-resource.ts).
 */

export type NearbyCategory = 'school' | 'supermarket' | 'park' | 'hospital';

export interface NearbyPlace {
  name: string;
  address: string;
  dist: string;
  time: string;
}

export type NearbyPlacesResult = Record<NearbyCategory, NearbyPlace[]>;

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'batdongsan-quangngai/1.0 (+https://muadatquangngai.com)';
const RADIUS_METERS = 5000;
const RESULTS_PER_CATEGORY = 5;
// Tốc độ trung bình giả định để ước lượng thời gian di chuyển trong nội thành/thị trấn.
const AVG_SPEED_KMH = 30;

const OVERPASS_QUERY: Record<NearbyCategory, string> = {
  school: 'node["amenity"="school"]',
  supermarket: 'node["shop"="supermarket"]',
  park: 'node["leisure"="park"]',
  hospital: 'node["amenity"~"^(hospital|clinic)$"]',
};

// Tâm điểm Quảng Ngãi (bờ biển) — dùng để loại kết quả Nominatim khớp NHẦM sang phần đất
// cũ Kon Tum, vốn đã gộp chung vào "Tỉnh Quảng Ngãi" sau sáp nhập 2025 nhưng OSM vẫn gắn
// tên đường/địa danh cũ trùng tên (vd "Đường Phan Đình Phùng" khớp cả ở Măng Đen, Kon Tum).
const PROVINCE_CENTER = { lat: 15.1212, lng: 108.7922 };
const MAX_DISTANCE_FROM_CENTER_KM = 60;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function nominatimQuery(q: string): Promise<{ lat: number; lng: number } | null> {
  try {
    let res = await fetch(
      `${NOMINATIM_URL}?format=json&countrycodes=vn&limit=1&accept-language=vi&q=${encodeURIComponent(q)}`,
      { headers: { 'User-Agent': USER_AGENT } }
    );

    // 429 = rate-limit tạm thời, KHÔNG phải "không tìm thấy" — chờ rồi thử lại 1 lần trước
    // khi bỏ cuộc, để không hiểu nhầm quá tải thành "địa chỉ không tồn tại".
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 5000));
      res = await fetch(
        `${NOMINATIM_URL}?format=json&countrycodes=vn&limit=1&accept-language=vi&q=${encodeURIComponent(q)}`,
        { headers: { 'User-Agent': USER_AGENT } }
      );
    }
    if (!res.ok) return null;

    const rows = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (rows.length === 0) return null;

    return { lat: parseFloat(rows[0].lat), lng: parseFloat(rows[0].lon) };
  } catch {
    return null;
  }
}

/**
 * Địa chỉ dự án → toạ độ, dùng Nominatim (giới hạn Việt Nam) — trả null nếu không tìm được.
 *
 * Địa chỉ trong DB dùng tên xã/phường THEO CẤU TRÚC MỚI (sau sáp nhập hành chính), mà OSM
 * (Nominatim) phần lớn còn theo tên cũ nên khớp chuỗi đầy đủ hay trượt — thử dần các biến
 * thể ngắn hơn (bỏ xã/phường, chỉ còn huyện+tỉnh) trước khi bỏ cuộc. Mọi kết quả khớp đều
 * bị loại nếu cách tâm tỉnh (bờ biển) quá xa — tránh khớp nhầm sang phần đất Kon Tum cũ.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  // "Đường X, Phường Y, TP. Quảng Ngãi, Quảng Ngãi" → thử nguyên văn, rồi bỏ dần phần đầu
  // (thường là xã/phường/thị trấn — khó khớp OSM nhất) cho tới khi chỉ còn huyện/tỉnh.
  const parts = address.split(',').map((p) => p.trim());
  const candidates = parts.map((_, i) => parts.slice(i).join(', ')).filter((c) => c.length > 0);

  for (const [i, candidate] of candidates.entries()) {
    // Tôn trọng rate-limit Nominatim (1 req/giây) giữa các lần thử của CÙNG một địa chỉ.
    if (i > 0) await new Promise((r) => setTimeout(r, 1100));
    const result = await nominatimQuery(candidate);
    if (!result) continue;

    const distanceFromCenter = haversineKm(PROVINCE_CENTER.lat, PROVINCE_CENTER.lng, result.lat, result.lng);
    if (distanceFromCenter > MAX_DISTANCE_FROM_CENTER_KM) continue;

    return result;
  }

  return null;
}

function formatDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function formatTime(km: number): string {
  const minutes = Math.max(1, Math.round((km / AVG_SPEED_KMH) * 60));
  return `${minutes} phút`;
}

interface OverpassElement {
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

function categoryOf(tags: Record<string, string>): NearbyCategory | null {
  if (tags.amenity === 'school') return 'school';
  if (tags.shop === 'supermarket') return 'supermarket';
  if (tags.leisure === 'park') return 'park';
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return 'hospital';
  return null;
}

/**
 * Gộp cả 4 danh mục vào MỘT request Overpass (thay vì 4 request riêng) — instance công cộng
 * overpass-api.de rate-limit khá chặt (429 khi gọi dồn dập), gộp lại vừa nhanh hơn vừa an toàn
 * hơn. Ném lỗi khi gọi thất bại/bị rate-limit — KHÔNG trả mảng rỗng, để caller không lỡ lưu
 * "không có tiện ích nào" vào DB chỉ vì Overpass đang quá tải tạm thời.
 */
async function queryAllCategories(lat: number, lng: number): Promise<OverpassElement[]> {
  const filters = Object.values(OVERPASS_QUERY)
    .map((f) => `${f}(around:${RADIUS_METERS},${lat},${lng});`)
    .join('');
  const query = `[out:json][timeout:25];(${filters});out body ${RESULTS_PER_CATEGORY * 3 * 4};`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (res.status === 429 && attempt === 0) {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    if (!res.ok) throw new Error(`Overpass ${res.status}`);

    const data = (await res.json()) as { elements?: OverpassElement[] };
    return data.elements ?? [];
  }

  throw new Error('Overpass rate-limited sau khi thử lại.');
}

/**
 * Toạ độ → 4 danh mục tiện ích thật trong bán kính RADIUS_METERS (Overpass/OpenStreetMap).
 * Ném lỗi nếu Overpass thất bại — xem computeProjectLocationData, lỗi ở đây làm cả kết quả
 * geocode/địa chỉ bị huỷ theo, KHÔNG lưu dữ liệu tiện ích rỗng giả do lỗi tạm thời.
 */
export async function fetchNearbyPlaces(lat: number, lng: number): Promise<NearbyPlacesResult> {
  const elements = await queryAllCategories(lat, lng);

  const result: NearbyPlacesResult = { school: [], supermarket: [], park: [], hospital: [] };
  const withDistance: Record<NearbyCategory, Array<NearbyPlace & { _km: number }>> = {
    school: [],
    supermarket: [],
    park: [],
    hospital: [],
  };

  for (const el of elements) {
    if (!el.tags?.name) continue;
    const cat = categoryOf(el.tags);
    if (!cat) continue;

    const km = haversineKm(lat, lng, el.lat, el.lon);
    withDistance[cat].push({
      name: el.tags.name,
      address: el.tags['addr:street'] ?? el.tags['addr:full'] ?? '',
      dist: formatDist(km),
      time: formatTime(km),
      _km: km,
    });
  }

  for (const cat of Object.keys(result) as NearbyCategory[]) {
    result[cat] = withDistance[cat]
      .sort((a, b) => a._km - b._km)
      .slice(0, RESULTS_PER_CATEGORY)
      .map(({ name, address, dist, time }) => ({ name, address, dist, time }));
  }

  return result;
}

/**
 * Geocode + tra tiện ích cho MỘT địa chỉ dự án — gọi khi tạo dự án mới hoặc khi address đổi.
 * Trả null nếu geocode thất bại (địa chỉ không xác định được toạ độ) HOẶC Overpass lỗi/quá
 * tải tạm thời — không chặn luồng lưu dự án, chỉ đơn giản là chưa có dữ liệu vị trí/tiện ích
 * cho tới lần sửa sau (hoặc lần chạy backfill sau).
 */
export async function computeProjectLocationData(
  address: string
): Promise<{ lat: number; lng: number; nearbyPlaces: NearbyPlacesResult } | null> {
  const coords = await geocodeAddress(address);
  if (!coords) return null;

  try {
    const nearbyPlaces = await fetchNearbyPlaces(coords.lat, coords.lng);
    return { ...coords, nearbyPlaces };
  } catch {
    return null;
  }
}
