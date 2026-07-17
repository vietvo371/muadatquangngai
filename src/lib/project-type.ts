import { PROJECT_CATEGORIES } from './category-menu';

// Loại hình dự án — khớp đúng 7 mục menu "Dự án" (xem category-menu.ts), theo yêu cầu
// Notion "SỬA WEBSITE 17/07": thay cho 5 mục cũ (Nhà phố/Biệt thự/Chung cư/Thương mại/Đất nền).
export const PROJECT_TYPE_OPTIONS = PROJECT_CATEGORIES.map((c) => ({ value: c.slug, label: c.name }));

export const DEFAULT_PROJECT_TYPE = PROJECT_CATEGORIES[0].slug;

// Khu đô thị mới / Khu dân cư chủ yếu phân lô đất nền — tính theo "lô" thay vì "căn".
const LAND_LIKE_PROJECT_TYPES = ['khu-do-thi-moi', 'khu-dan-cu'];

export function isLandLikeProjectType(type?: string): boolean {
  return LAND_LIKE_PROJECT_TYPES.includes(type ?? '');
}

export function getProjectTypeLabel(type?: string): string {
  return PROJECT_CATEGORIES.find((c) => c.slug === type)?.name ?? 'Dự án khác';
}
