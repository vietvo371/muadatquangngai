/**
 * Kiểu dữ liệu chuẩn của khu vực Dự án (Notion 07/10 "Adapter / Mapper").
 *
 * Component chỉ làm việc với các kiểu này, không bao giờ đọc thẳng phản hồi API. Phản hồi API
 * đổi tên trường hay đổi cấu trúc thì chỉ phải sửa Adapter (./adapters.ts).
 *
 * Quy ước: trường nào có thể thiếu thì kiểu là `T | null`, và `null` nghĩa là "chưa có dữ liệu"
 * — giao diện ẩn ô đó. Không có giá trị nào ở đây được phép là số/chuỗi bịa ra cho đủ chỗ.
 */

import type { UnitStatus } from '@/lib/design-tokens';

export interface ProjectLocation {
  address: string | null;
  ward: string | null;
  district: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ProjectContact {
  name: string;
  phone: string | null;
  avatar: string | null;
  /** 'agent' = môi giới phụ trách; 'owner' = tài khoản tạo dự án. */
  role: 'agent' | 'owner';
}

export interface NearbyPlace {
  name: string;
  address: string;
  dist: string;
  time: string;
  lat?: number;
  lng?: number;
}

export type NearbyCategory = 'school' | 'supermarket' | 'park' | 'hospital';
export type NearbyPlaces = Record<NearbyCategory, NearbyPlace[]>;

/** Một loại sản phẩm trong dự án (vd. "Đất nền 100m²", "Shophouse") — từ cột floor_plans. */
export interface UnitType {
  name: string;
  /** m². */
  area: number | null;
  count: number | null;
  priceFrom: number | null;
}

/**
 * Phân khu của dự án. Backend CHƯA có dữ liệu phân khu — kiểu được định nghĩa sẵn để khi có
 * bảng thì chỉ cần nối Adapter, không phải sửa component. Hiện luôn là mảng rỗng.
 */
export interface Subdivision {
  id: string;
  name: string;
  unitCount: number | null;
  status: UnitStatus;
}

/** Mặt bằng tổng thể. Tương tự Subdivision: chưa có dữ liệu backend, hiện luôn là null. */
export interface MasterPlan {
  imageUrl: string;
  caption: string | null;
}

/** Một căn/lô đang rao bán thuộc dự án — chính là tin đăng có properties.project_id. */
export interface Unit {
  id: string;
  slug: string;
  href: string;
  title: string;
  price: number | null;
  priceUnit: 'total' | 'per_m2' | 'per_month' | 'negotiable';
  area: number | null;
  thumbnail: string | null;
  district: string | null;
  publishedAt: string | null;
  status: UnitStatus;
}

export interface Pagination {
  page: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  developer: string | null;
  /** HTML mô tả — CHƯA lọc. Nơi hiển thị phải đi qua sanitizeRichText. */
  descriptionHtml: string | null;
  status: string;
  statusLabel: string | null;
  type: string;
  typeLabel: string;
  /** "căn" hoặc "lô" tuỳ loại dự án. */
  unitWord: 'căn' | 'lô';
  images: string[];
  location: ProjectLocation;
  /** projects.total_area lưu theo HA. */
  totalAreaHa: number | null;
  totalUnits: number | null;
  totalBlocks: number | null;
  totalFloors: number | null;
  priceFrom: number | null;
  priceTo: number | null;
  legal: string | null;
  handoverDate: string | null;
  constructionProgress: number | null;
  constructionNote: string | null;
  utilities: string[];
  unitTypes: UnitType[];
  subdivisions: Subdivision[];
  masterPlan: MasterPlan | null;
  nearbyPlaces: NearbyPlaces | null;
  contact: ProjectContact | null;
  viewCount: number | null;
}
