/**
 * Geocode địa chỉ dự án (Nominatim) + tra cứu tiện ích thật lân cận (trường học, siêu thị,
 * công viên, bệnh viện) bằng Goong Place API (Autocomplete + Detail) — dữ liệu địa phương
 * Việt Nam. Dùng key server-only riêng (GOONG_PLACE_API_KEY, KHÔNG phải
 * NEXT_PUBLIC_GOONG_API_KEY dùng cho bản đồ — key đó chỉ có quyền Maptiles, không gọi được
 * Place API, đã xác nhận qua lỗi API_KEY_UNAUTHORIZED). Không thêm tiền tố NEXT_PUBLIC_ vì
 * key Place API tính phí theo lượt gọi — không được lộ ra bundle client cho ai cũng dùng
 * được. Từng thử
 * OpenStreetMap/Overpass trước (miễn phí, không cần key) nhưng dữ liệu ở Quảng Ngãi quá
 * thưa (chỉ ~4 điểm trong bán kính 8km khi test) — Goong cho kết quả thật nhiều hơn hẳn.
 * Kết quả tính MỘT LẦN lúc tạo/sửa dự án rồi lưu vào cột nearby_places — trang public
 * không gọi API ngoài lúc tải trang (xem lib/api-resources/project-resource.ts).
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
const GOONG_AUTOCOMPLETE_URL = 'https://rsapi.goong.io/Place/AutoComplete';
const GOONG_DETAIL_URL = 'https://rsapi.goong.io/Place/Detail';
const GOONG_API_KEY = process.env.GOONG_PLACE_API_KEY ?? '';
const USER_AGENT = 'batdongsan-quangngai/1.0 (+https://muadatquangngai.com)';
const RADIUS_KM = 5;
const RESULTS_PER_CATEGORY = 5;
// Lấy dư ứng viên từ Autocomplete vì "radius" chỉ ưu tiên sắp xếp (soft bias), không phải
// bộ lọc cứng — vài kết quả trả về có thể thực sự cách xa hơn bán kính, phải tự lọc lại
// bằng toạ độ thật lấy từ Place/Detail rồi mới chốt danh sách gần nhất. Không lấy dư quá
// nhiều vì mỗi ứng viên tốn 1 lần gọi Place/Detail (tính phí cao hơn AutoComplete).
const CANDIDATES_PER_CATEGORY = RESULTS_PER_CATEGORY + 2;
// Tốc độ trung bình giả định để ước lượng thời gian di chuyển trong nội thành/thị trấn.
const AVG_SPEED_KMH = 30;

// Từ khoá chung chung ("trường học") khớp rất kém trên Goong AutoComplete — tên trường thật
// ở Việt Nam luôn theo cấp học cụ thể (Tiểu học/THCS/THPT/Mầm non), tìm riêng từng cấp rồi
// gộp lại cho ra nhiều kết quả thật hơn hẳn so với 1 từ khoá chung.
const CATEGORY_KEYWORDS: Record<NearbyCategory, string[]> = {
  school: ['trường tiểu học', 'trường thcs', 'trường thpt', 'trường mầm non'],
  supermarket: ['siêu thị'],
  park: ['công viên'],
  hospital: ['bệnh viện'],
};

// AutoComplete tìm theo từ khoá xuất hiện BẤT KỲ ĐÂU trong tên — "trường học" khớp cả
// "Chuyên Sỉ Thời Trang Trường Học" (shop quần áo, không phải trường). Trường thật ở Việt
// Nam hầu như luôn đặt tên bắt đầu bằng "Trường ..." — lọc lại để loại các khớp nhầm kiểu
// tên doanh nghiệp chứa từ khoá nhưng không phải trường học.
const CATEGORY_NAME_FILTER: Partial<Record<NearbyCategory, RegExp>> = {
  school: /^Trường\b/i,
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

interface GoongPrediction {
  place_id: string;
  description: string;
  structured_formatting?: { main_text: string; secondary_text?: string };
}

async function goongFetch(url: string): Promise<Response> {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  // 429 = hết quota tức thời (hiếm với free tier 5 req/s) — chờ rồi thử lại 1 lần, không
  // hiểu nhầm quá tải tạm thời thành "không tìm thấy".
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 3000));
    return fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  }
  return res;
}

async function autocomplete(keyword: string, lat: number, lng: number): Promise<GoongPrediction[]> {
  const url = `${GOONG_AUTOCOMPLETE_URL}?api_key=${GOONG_API_KEY}&input=${encodeURIComponent(keyword)}&location=${lat},${lng}&radius=${RADIUS_KM}&limit=${CANDIDATES_PER_CATEGORY}`;
  const res = await goongFetch(url);
  if (!res.ok) throw new Error(`Goong AutoComplete ${res.status}`);

  const data = (await res.json()) as { predictions?: GoongPrediction[] };
  return data.predictions ?? [];
}

async function placeDetailCoords(placeId: string): Promise<{ lat: number; lng: number } | null> {
  const url = `${GOONG_DETAIL_URL}?place_id=${encodeURIComponent(placeId)}&api_key=${GOONG_API_KEY}`;
  const res = await goongFetch(url);
  if (!res.ok) return null;

  const data = (await res.json()) as { result?: { geometry?: { location?: { lat: number; lng: number } } } };
  const loc = data.result?.geometry?.location;
  return loc ? { lat: loc.lat, lng: loc.lng } : null;
}

/**
 * Một danh mục (vd "trường học") → tối đa RESULTS_PER_CATEGORY địa điểm thật gần nhất, dùng
 * Goong AutoComplete (tìm theo TỪNG từ khoá trong CATEGORY_KEYWORDS, ưu tiên gần toạ độ) rồi
 * gộp + khử trùng lặp theo place_id, cuối cùng gọi Place/Detail để lấy toạ độ chính xác từng
 * ứng viên — AutoComplete không lọc cứng theo bán kính nên phải tự lọc lại bằng khoảng cách
 * thật, loại các kết quả vượt RADIUS_KM.
 */
async function queryCategory(cat: NearbyCategory, lat: number, lng: number): Promise<NearbyPlace[]> {
  const predictionLists = await Promise.all(
    CATEGORY_KEYWORDS[cat].map((keyword) => autocomplete(keyword, lat, lng))
  );

  const seen = new Set<string>();
  const predictions = predictionLists.flat().filter((p) => {
    if (seen.has(p.place_id)) return false;
    seen.add(p.place_id);
    return true;
  });

  const nameFilter = CATEGORY_NAME_FILTER[cat];
  const withDistance: Array<NearbyPlace & { _km: number }> = [];
  for (const p of predictions) {
    const name = p.structured_formatting?.main_text ?? p.description;
    if (nameFilter && !nameFilter.test(name.trim())) continue;

    const coords = await placeDetailCoords(p.place_id);
    if (!coords) continue;

    const km = haversineKm(lat, lng, coords.lat, coords.lng);
    if (km > RADIUS_KM) continue;

    withDistance.push({
      name,
      address: p.structured_formatting?.secondary_text ?? '',
      dist: formatDist(km),
      time: formatTime(km),
      _km: km,
    });
  }

  return withDistance
    .sort((a, b) => a._km - b._km)
    .slice(0, RESULTS_PER_CATEGORY)
    .map(({ name, address, dist, time }) => ({ name, address, dist, time }));
}

/**
 * Toạ độ → 4 danh mục tiện ích thật trong bán kính RADIUS_KM (Goong Place API). Ném lỗi nếu
 * bất kỳ danh mục nào gọi API thất bại — xem computeProjectLocationData, lỗi ở đây làm cả
 * kết quả geocode/địa chỉ bị huỷ theo, KHÔNG lưu dữ liệu tiện ích rỗng giả do lỗi tạm thời.
 */
export async function fetchNearbyPlaces(lat: number, lng: number): Promise<NearbyPlacesResult> {
  if (!GOONG_API_KEY) throw new Error('Thiếu GOONG_PLACE_API_KEY.');

  const categories: NearbyCategory[] = ['school', 'supermarket', 'park', 'hospital'];
  const results = await Promise.all(categories.map((cat) => queryCategory(cat, lat, lng)));

  return {
    school: results[0],
    supermarket: results[1],
    park: results[2],
    hospital: results[3],
  };
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
