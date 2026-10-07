/**
 * Bộ lọc tên địa điểm cho "Tiện ích xung quanh" — dùng chung cho lúc tra Goong (máy chủ) và
 * lúc hiển thị (trình duyệt), vì dữ liệu dự án đã lưu từ trước không được tra lại.
 *
 * Goong tìm theo từ khoá xuất hiện ở BẤT KỲ đâu trong tên, nên "Bệnh viện laptop Hưng Hải"
 * (tiệm sửa máy tính) lọt vào nhóm bệnh viện, "Công viên nghĩa trang Sơn Viên Lạc Cảnh" lọt vào
 * nhóm công viên. Chỉ loại những thứ chắc chắn sai; cố lọc sạch hơn nữa sẽ làm trống danh sách
 * ở các xã vốn đã ít địa điểm.
 */

export type NearbyFilterCategory = 'school' | 'supermarket' | 'park' | 'hospital';

/** Tên phải khớp mẫu này mới được nhận. */
export const NEARBY_NAME_REQUIRED: Partial<Record<NearbyFilterCategory, RegExp>> = {
  school: /^Trường\b/i,
  hospital: /^Bệnh viện\b/i,
};

/** Tên khớp mẫu này thì loại. */
export const NEARBY_NAME_EXCLUDED: Partial<Record<NearbyFilterCategory, RegExp>> = {
  hospital: /\b(laptop|máy tính|điện thoại|xe máy|ô ?tô|thú y|cây|điện máy)\b/i,
  park: /(nghĩa trang|nghĩa địa|nghĩa trũng|lạc cảnh|vĩnh hằng)/i,
};

export function isAcceptableNearbyName(category: NearbyFilterCategory, name: string): boolean {
  const required = NEARBY_NAME_REQUIRED[category];
  const excluded = NEARBY_NAME_EXCLUDED[category];
  if (required && !required.test(name.trim())) return false;
  if (excluded && excluded.test(name)) return false;
  return true;
}
