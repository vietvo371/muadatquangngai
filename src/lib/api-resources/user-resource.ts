import type { AuthUser } from '../auth';
import { toVietnamIso8601 } from './carbon-format';

const AGENT_ROLES = new Set(['agent', 'agency']);

function toFloat(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'object' ? Number(value.toString()) : Number(value);
}

interface NamedRow {
  id: bigint;
  name: string;
}

/**
 * Đối chiếu 1:1 backend/app/Http/Resources/UserResource.php.
 * `requestingUserId`: id của user đang gọi API (null nếu chưa đăng nhập) — quyết định
 * các field when()-gated (phone, cover_image, zalo) có hiện hay không.
 * `loaded`: chỉ truyền khi route đó có eager-load province/district (giống
 * ->load(['province','district']) của UserController::me) — nếu KHÔNG truyền, 2 khoá
 * này bị lược bỏ hẳn (khớp whenLoaded() khi quan hệ chưa được nạp, vd. register/login).
 * Nếu CÓ truyền nhưng fk null, quan hệ trả `null` trần (đã verify qua curl thật, khớp
 * hành vi whenLoaded() khi quan hệ đã nạp nhưng giá trị null — xem carbon-format.ts kế bên
 * cho case tương tự với ward ở project-resource.ts).
 */
export function mapUserResource(
  user: AuthUser,
  requestingUserId: bigint | null,
  loaded?: { province: NamedRow | null; district: NamedRow | null }
) {
  const isOwnProfile = requestingUserId !== null && requestingUserId === user.id;
  const isVerified = user.email_verified_at !== null || user.phone_verified_at !== null;
  const isAgent = AGENT_ROLES.has(user.role);

  return {
    id: user.id,
    uuid: user.uuid,
    name: user.name,
    email: user.email,
    // phone: hiện nếu là chính chủ HOẶC tài khoản đã verified (đối chiếu $this->when(...))
    ...(isOwnProfile || isVerified ? { phone: user.phone } : {}),
    avatar: user.avatar,
    ...(isOwnProfile ? { cover_image: user.cover_image } : {}),
    role: user.role,
    status: user.status,
    bio: user.bio,
    balance: toFloat(user.balance),
    total_listings: user.total_listings,
    total_sold: user.total_sold,
    rating: toFloat(user.rating),
    review_count: user.review_count,
    ...(isAgent ? { agency_name: user.agency_name, license_number: user.license_number } : {}),
    ...(isOwnProfile ? { zalo: user.zalo } : {}),
    facebook: user.facebook,
    website: user.website,
    address: user.address,
    is_verified: isVerified,
    ...(loaded
      ? {
          province: loaded.province ? { id: loaded.province.id, name: loaded.province.name } : null,
          district: loaded.district ? { id: loaded.district.id, name: loaded.district.name } : null,
        }
      : {}),
    created_at: toVietnamIso8601(user.created_at),
  };
}
