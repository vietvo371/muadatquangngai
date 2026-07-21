import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { normalizeName, stripAdminPrefix } from '@/lib/vietnamese-text';

/**
 * GET /api/v2/geocode/search?q= — tìm địa điểm theo tên, trả về danh sách toạ độ.
 *
 * Cũng đi qua server như route reverse: Nominatim đòi User-Agent định danh được, mà trình
 * duyệt không cho JS đặt header đó.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'batdongsan-quangngai/1.0 (+https://muadatquangngai.vercel.app)';

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim();
  if (!q) return apiError('Thiếu từ khoá tìm kiếm.', 422);

  try {
    const res = await fetch(
      // Giới hạn trong Việt Nam để "Nghĩa Lộ" không nhảy ra kết quả trùng tên ở nước khác.
      `${NOMINATIM}?format=json&countrycodes=vn&limit=5&accept-language=vi&q=${encodeURIComponent(q)}`,
      { headers: { 'User-Agent': USER_AGENT }, next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);

    const rows = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;

    // Nhiều xã trùng tên khắp cả nước ("Xã Bình Sơn" có ở cả An Giang), mà Nominatim không
    // biết trang này chỉ phục vụ Quảng Ngãi nên hay đẩy tỉnh khác lên đầu. Xếp kết quả nằm
    // trong tỉnh đang phục vụ lên trước, giữ nguyên thứ tự Nominatim trong từng nhóm.
    const provinces = await db.provinces.findMany({ select: { name: true } });
    const keys = provinces.map((p) => stripAdminPrefix(p.name));
    const inCoverage = (name: string) => keys.some((k) => normalizeName(name).includes(k));

    const mapped = rows.map((r) => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      display_name: r.display_name,
      in_coverage: inCoverage(r.display_name),
    }));

    return apiSuccess([
      ...mapped.filter((r) => r.in_coverage),
      ...mapped.filter((r) => !r.in_coverage),
    ]);
  } catch {
    // Tìm kiếm hỏng không được chặn luồng đăng tin — người dùng vẫn bấm tay lên bản đồ được.
    return apiSuccess([]);
  }
}
