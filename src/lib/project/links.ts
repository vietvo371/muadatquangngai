import { slugify } from '@/lib/formatters';

/**
 * Khoá xã/phường trên URL của trang danh sách dự án (`/du-an?district=...`).
 *
 * Trang danh sách và breadcrumb trang chi tiết phải tạo ra CÙNG một khoá từ cùng một tên, nếu
 * không bấm breadcrumb sẽ ra danh sách lọc rỗng. Trước đây mỗi trang tự viết một bản riêng.
 */
export function projectDistrictKey(name: string | null | undefined): string | null {
  if (!name) return null;
  const clean = name
    .toLowerCase()
    .replace(/huyện|thành phố|thị xã|tp\.|tx\./g, '')
    .trim();
  const key = slugify(clean);
  if (!key) return null;
  return key === 'quang-ngai' ? 'tp-quang-ngai' : key;
}

export function projectDistrictHref(name: string | null | undefined): string | null {
  const key = projectDistrictKey(name);
  return key ? `/du-an?district=${key}` : null;
}
