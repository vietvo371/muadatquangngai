import { apiSuccess, apiError } from '@/lib/api-response';

/**
 * GET /api/v2/geocode/resolve-maps-link?url=... — bóc lat/lng từ 1 link Google Maps (feedback
 * I.2). Chấp nhận cả link rút gọn (maps.app.goo.gl) lẫn link đầy đủ — resolve redirect ở phía
 * server để né CORS (trình duyệt không gọi thẳng maps.app.goo.gl được) và vì link rút gọn chỉ
 * lộ toạ độ thật sau khi theo redirect.
 *
 * Chỉ nhận domain Google Maps — fetch địa chỉ do người dùng dán vào là rủi ro SSRF nếu không
 * chặn domain, kẻ xấu có thể dùng ô này để dò cổng nội bộ server.
 */

const ALLOWED_HOSTS = ['maps.app.goo.gl', 'goo.gl', 'google.com', 'www.google.com', 'maps.google.com'];

/**
 * Google Maps nhúng toạ độ theo vài kiểu tuỳ loại link — thử lần lượt, kiểu nào khớp trước
 * dùng kiểu đó. `@lat,lng,zoom` xuất hiện ở link "địa điểm"; `!3d{lat}!4d{lng}` ở link ghim tay
 * (Đã lưu vị trí/thả ghim); `q=lat,lng` ở link chia sẻ toạ độ trần.
 */
function extractLatLng(url: string): { lat: number; lng: number } | null {
  const patterns = [/@(-?\d+\.\d+),(-?\d+\.\d+)/, /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { lat, lng };
      }
    }
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url')?.trim();
  if (!rawUrl) return apiError('Vui lòng dán link Google Maps.', 422);

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return apiError('Link không hợp lệ.', 422);
  }
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return apiError('Chỉ chấp nhận link từ Google Maps (google.com/maps hoặc maps.app.goo.gl).', 422);
  }

  // Link rút gọn cần theo redirect mới ra URL chứa toạ độ thật; link đầy đủ có thể đã chứa
  // toạ độ ngay ở URL ban đầu, nhưng vẫn resolve để nhất quán 1 luồng xử lý.
  let finalUrl = rawUrl;
  try {
    const res = await fetch(rawUrl, { redirect: 'follow' });
    finalUrl = res.url || rawUrl;
  } catch {
    // Không resolve được thì vẫn thử bóc toạ độ từ URL gốc — nhiều link đầy đủ đã có sẵn toạ độ.
  }

  const coords = extractLatLng(finalUrl) ?? extractLatLng(rawUrl);
  if (!coords) {
    return apiError('Không đọc được toạ độ từ link này. Vui lòng ghim thủ công trên bản đồ.', 422);
  }

  return apiSuccess(coords);
}
