export type PropertyType = "sale" | "rent";
export type PropertyStatus =
  | "pending"
  | "active"
  | "inactive"
  | "sold"
  | "rented"
  | "expired"
  | "rejected";
export type VipLevel = "normal" | "vip" | "vip_plus" | "diamond";
export type Direction =
  | "dong"
  | "tay"
  | "nam"
  | "bac"
  | "dong_bac"
  | "dong_nam"
  | "tay_bac"
  | "tay_nam";
export type LegalStatus = "so_do" | "so_hong" | "contract" | "other";
export type Furniture = "none" | "basic" | "full";

export interface Property {
  id: number;
  uuid: string;
  slug: string;
  title: string;
  description: string;
  type: PropertyType;
  status: PropertyStatus;
  is_vip: VipLevel;
  vip_expired_at: string | null;
  price: number;
  price_unit: "total" | "per_m2" | "per_month";
  price_negotiable: boolean;
  area: number;
  floors?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking: boolean;
  direction?: Direction;
  furniture: Furniture;
  legal?: LegalStatus;
  address: string;
  latitude?: number;
  longitude?: number;
  road_width?: number;
  facade?: number;
  thumbnail: string;
  media: PropertyMedia[];
  features: Feature[];
  location: PropertyLocation;
  owner: UserBasic;
  view_count: number;
  save_count: number;
  is_saved: boolean;
  published_at: string;
  created_at: string;
}

export interface PropertyLocation {
  province: { id: number; name: string; slug: string };
  district: { id: number; name: string; slug: string };
  ward?: { id: number; name: string; slug: string };
  latitude?: number;
  longitude?: number;
}

export interface PropertyMedia {
  id: number;
  type: "image" | "video" | "virtual_tour";
  url: string;
  thumbnail?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Feature {
  id: number;
  name: string;
  icon?: string;
}

export interface SearchFilters {
  q?: string;
  type?: PropertyType;
  category?: string | number;
  province?: number;
  district?: number;
  ward?: number;
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  bedrooms?: string;
  direction?: Direction;
  legal?: LegalStatus;
  is_vip?: boolean;
  sort?:
    | "newest"
    | "oldest"
    | "price_asc"
    | "price_desc"
    | "area_asc"
    | "area_desc"
    | "popular";
  page?: number;
  per_page?: number;
}
