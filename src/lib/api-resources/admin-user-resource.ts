import { toCarbonDefaultUtc } from './carbon-format';

/**
 * Raw dump 1 user cho AdminUserController@index — Laravel gọi $this->paginated($users)
 * TRỰC TIẾP (không qua UserResource), nên trả nguyên cột model (trừ password/remember_token
 * bị $hidden). Cùng pattern "quên wrap Resource" như các index admin khác. Verify qua curl:
 * balance/rating là decimal:2 -> STRING 2 số lẻ; timestamps dạng Carbon mặc định UTC
 * (.000000Z); id/*_id/total_* là number.
 */
export function mapAdminUserRawDump(u: {
  id: bigint;
  uuid: string;
  name: string;
  email: string;
  email_verified_at: Date | null;
  phone: string | null;
  phone_verified_at: Date | null;
  avatar: string | null;
  cover_image: string | null;
  role: string;
  status: string;
  bio: string | null;
  address: string | null;
  province_id: bigint | null;
  district_id: bigint | null;
  balance: unknown;
  total_listings: number;
  total_sold: number;
  rating: unknown;
  review_count: number;
  license_number: string | null;
  agency_name: string | null;
  website: string | null;
  facebook: string | null;
  zalo: string | null;
  last_login_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
}) {
  return {
    id: u.id,
    uuid: u.uuid,
    name: u.name,
    email: u.email,
    email_verified_at: toCarbonDefaultUtc(u.email_verified_at),
    phone: u.phone,
    phone_verified_at: toCarbonDefaultUtc(u.phone_verified_at),
    avatar: u.avatar,
    cover_image: u.cover_image,
    role: u.role,
    status: u.status,
    bio: u.bio,
    address: u.address,
    province_id: u.province_id,
    district_id: u.district_id,
    balance: Number(u.balance).toFixed(2),
    total_listings: u.total_listings,
    total_sold: u.total_sold,
    rating: Number(u.rating).toFixed(2),
    review_count: u.review_count,
    license_number: u.license_number,
    agency_name: u.agency_name,
    website: u.website,
    facebook: u.facebook,
    zalo: u.zalo,
    last_login_at: toCarbonDefaultUtc(u.last_login_at),
    created_at: toCarbonDefaultUtc(u.created_at),
    updated_at: toCarbonDefaultUtc(u.updated_at),
  };
}
