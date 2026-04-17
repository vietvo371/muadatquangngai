export type UserRole = "user" | "agent" | "agency" | "admin" | "super_admin";
export type UserStatus = "active" | "inactive" | "banned";

export interface User {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone?: string;
  phone_verified_at?: string;
  avatar?: string;
  cover_image?: string;
  role: UserRole;
  status: UserStatus;
  bio?: string;
  balance: number;
  total_listings: number;
  total_sold: number;
  rating: number;
  review_count: number;
  agency_name?: string;
  license_number?: string;
  zalo?: string;
  facebook?: string;
  website?: string;
  address?: string;
  province_id?: number;
  district_id?: number;
  created_at: string;
  updated_at: string;
}

export interface UserBasic {
  id: number;
  name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  rating: number;
  total_listings: number;
}
