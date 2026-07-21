import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { normalizeName, stripAdminPrefix } from '@/lib/vietnamese-text';

/**
 * GET /api/v2/geocode/reverse?lat=&lng= — đổi toạ độ thành địa chỉ chữ.
 *
 * Gọi Nominatim ở phía server chứ không gọi thẳng từ trình duyệt vì hai lý do: quy định sử
 * dụng của Nominatim đòi User-Agent định danh được (trình duyệt không cho JS đặt header này),
 * và gọi từ server thì giới hạn tần suất tính trên IP server thay vì IP từng người dùng.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'batdongsan-quangngai/1.0 (+https://muadatquangngai.vercel.app)';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return apiError('Toạ độ không hợp lệ.', 422);
  }

  let osm: Record<string, unknown>;
  try {
    const res = await fetch(
      `${NOMINATIM}?format=json&lat=${lat}&lon=${lng}&accept-language=vi&zoom=18`,
      {
        headers: { 'User-Agent': USER_AGENT },
        // Cùng một điểm thường bị hỏi lại nhiều lần (kéo ghim qua lại) — cache 1 ngày để
        // không đập vào giới hạn tần suất của Nominatim.
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    osm = await res.json();
  } catch {
    // Không tra được địa chỉ thì vẫn cho đăng tin bằng toạ độ — người dùng tự gõ địa chỉ.
    return apiSuccess({ address: null, district_id: null, district_name: null, matched: false });
  }

  const addr = (osm.address ?? {}) as Record<string, string>;

  // Tên đường + số nhà nếu OSM có; không có đường thì lấy tên thôn/xóm làm gợi ý địa chỉ.
  const street =
    [addr.house_number, addr.road].filter(Boolean).join(' ') || addr.hamlet || addr.village || null;

  // OSM xếp xã/phường vào khoá nào là tuỳ khu vực, và cùng một điểm có thể có nhiều khoá
  // cùng lúc (Lý Sơn: village="Đồng Hộ An Hải" là tên thôn, town="Đặc khu Lý Sơn" mới là
  // đơn vị hành chính). Nên thử LẦN LƯỢT mọi khoá và lấy khoá đầu tiên khớp bộ 96 đơn vị,
  // thay vì đoán trước khoá nào mang nghĩa gì.
  const candidates = [
    addr.suburb,
    addr.quarter,
    addr.town,
    addr.city_district,
    addr.village,
    addr.municipality,
    addr.county,
    addr.city,
  ].filter((v): v is string => Boolean(v));

  const [districts, provinces] = await Promise.all([
    db.districts.findMany({ select: { id: true, name: true } }),
    db.provinces.findMany({ select: { id: true, name: true } }),
  ]);

  // Người dùng có thể kéo ghim ra ngoài phạm vi trang phục vụ (điểm sát ranh giới rất dễ
  // rơi sang tỉnh khác). Nếu không cảnh báo, họ sẽ tự chọn một xã Quảng Ngãi trong khi toạ
  // độ nằm ở tỉnh khác — tin đăng hiện sai chỗ trên bản đồ tìm kiếm.
  const stateName = addr.state || addr.province || null;
  const province = stateName
    ? provinces.find((p) => stripAdminPrefix(p.name) === stripAdminPrefix(stateName))
    : undefined;

  let districtId: number | null = null;
  let districtName: string | null = null;

  for (const cand of candidates) {
    // Khớp chính xác trước, không được thì so phần lõi sau khi bỏ tiền tố cấp hành chính.
    const hit =
      districts.find((d) => normalizeName(d.name) === normalizeName(cand)) ??
      districts.find((d) => stripAdminPrefix(d.name) === stripAdminPrefix(cand));
    if (hit) {
      districtId = Number(hit.id);
      districtName = hit.name;
      break;
    }
  }

  return apiSuccess({
    address: street,
    province_id: province ? Number(province.id) : null,
    province_name: province?.name ?? stateName,
    district_id: districtId,
    district_name: districtName,
    // matched=false nghĩa là không suy ra được xã/phường — client phải để người dùng tự chọn
    // chứ không được đoán bừa, vì chọn sai xã sẽ làm tin đăng lọt sai khu vực tìm kiếm.
    matched: districtId !== null,
    // Điểm nằm ngoài các tỉnh trang này phục vụ — client nên cảnh báo thay vì im lặng.
    outside_coverage: stateName !== null && province === undefined,
    display_name: (osm.display_name as string) ?? null,
  });
}
