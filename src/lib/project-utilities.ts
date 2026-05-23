/**
 * project-utilities.ts
 *
 * Nguồn dữ liệu duy nhất (Single Source of Truth) cho danh sách tiện ích dự án.
 * Dùng chung cho:
 *   - Form Thêm mới  : src/app/admin/projects/create/create-client.tsx
 *   - Form Chỉnh sửa : src/app/admin/projects/[id]/edit/edit-client.tsx
 *   - Preview        : src/components/admin/ProjectPreview.tsx
 *
 * Mỗi tiện ích gồm:
 *   - label  : Tên hiển thị tiếng Việt (key để lưu DB)
 *   - icon   : Tên icon từ lucide-react (dùng trong Preview)
 *   - group  : Nhóm tiện ích (dùng để gom nhóm trong Preview)
 */

export interface UtilityItem {
  label: string;
  /** Tên component icon lucide-react — import động ở nơi dùng */
  iconName: string;
  group: 'Sức khoẻ & Giải trí' | 'An ninh & Hạ tầng' | 'Tiện ích cộng đồng' | 'Dịch vụ & Thương mại';
}

export const PROJECT_UTILITIES: UtilityItem[] = [
  // ── Sức khoẻ & Giải trí ──────────────────────────────────────────────
  { label: 'Hồ bơi',              iconName: 'Waves',       group: 'Sức khoẻ & Giải trí' },
  { label: 'Gym & Spa',           iconName: 'Dumbbell',    group: 'Sức khoẻ & Giải trí' },
  { label: 'Công viên cây xanh',  iconName: 'Trees',       group: 'Sức khoẻ & Giải trí' },
  { label: 'Khu vui chơi trẻ em', iconName: 'Smile',       group: 'Sức khoẻ & Giải trí' },
  { label: 'Sân tennis / TTTM',   iconName: 'Activity',    group: 'Sức khoẻ & Giải trí' },
  { label: 'Câu lạc bộ cư dân',   iconName: 'Users',       group: 'Sức khoẻ & Giải trí' },

  // ── An ninh & Hạ tầng ────────────────────────────────────────────────
  { label: 'Bảo vệ 24/7',         iconName: 'Shield',      group: 'An ninh & Hạ tầng' },
  { label: 'Camera an ninh',      iconName: 'Camera',      group: 'An ninh & Hạ tầng' },
  { label: 'Thang máy',           iconName: 'ArrowUpDown', group: 'An ninh & Hạ tầng' },
  { label: 'Bãi đỗ xe',           iconName: 'Car',         group: 'An ninh & Hạ tầng' },
  { label: 'Hệ thống PCCC',       iconName: 'Flame',       group: 'An ninh & Hạ tầng' },
  { label: 'Internet tốc độ cao', iconName: 'Wifi',        group: 'An ninh & Hạ tầng' },

  // ── Tiện ích cộng đồng ───────────────────────────────────────────────
  { label: 'Trường mầm non',      iconName: 'GraduationCap', group: 'Tiện ích cộng đồng' },
  { label: 'Phòng khám nội khu',  iconName: 'Cross',         group: 'Tiện ích cộng đồng' },
  { label: 'Nhà sinh hoạt CĐ',   iconName: 'Home',          group: 'Tiện ích cộng đồng' },

  // ── Dịch vụ & Thương mại ─────────────────────────────────────────────
  { label: 'Siêu thị nội khu',    iconName: 'ShoppingCart', group: 'Dịch vụ & Thương mại' },
  { label: 'Nhà hàng & Café',    iconName: 'Coffee',       group: 'Dịch vụ & Thương mại' },
  { label: 'Khu thương mại',      iconName: 'Store',        group: 'Dịch vụ & Thương mại' },
];

/** Chỉ lấy mảng label để dùng trong form (toggle checkbox) */
export const PREDEFINED_UTILITIES: string[] = PROJECT_UTILITIES.map((u) => u.label);

/** Lấy thông tin tiện ích theo label (dùng trong Preview để lấy icon) */
export function getUtilityItem(label: string): UtilityItem | undefined {
  return PROJECT_UTILITIES.find((u) => u.label === label);
}

/** Gom nhóm tiện ích đã chọn theo group (dùng trong Preview) */
export function groupUtilities(selected: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const label of selected) {
    const item = getUtilityItem(label);
    const group = item?.group ?? 'Khác';
    if (!result[group]) result[group] = [];
    result[group].push(label);
  }
  return result;
}
