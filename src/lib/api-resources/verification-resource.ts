import { toVietnamIso8601 } from './carbon-format';

interface UserBrief {
  id: bigint;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
}

/**
 * Đối chiếu AdminVerificationController — Laravel trả RAW model
 * (response()->json(['data' => $verification])), không qua Resource class riêng.
 * Next.js dùng shape rõ ràng, có nested user/admin thay vì dump hết cột — đơn giản hoá
 * có chủ đích (route admin-only, không phải hợp đồng public).
 */
export function mapVerificationResource(v: {
  id: bigint;
  user_id: bigint;
  type: string;
  status: string;
  license_number: string | null;
  agency_name: string | null;
  documents: unknown;
  verified_at: Date | null;
  rejected_at: Date | null;
  rejection_reason: string | null;
  admin_id: bigint | null;
  created_at: Date | null;
  updated_at: Date | null;
  users_verifications_user_idTousers: UserBrief;
  users_verifications_admin_idTousers: UserBrief | null;
}) {
  return {
    id: v.id,
    user_id: v.user_id,
    type: v.type,
    status: v.status,
    license_number: v.license_number,
    agency_name: v.agency_name,
    documents: v.documents ?? null,
    verified_at: toVietnamIso8601(v.verified_at),
    rejected_at: toVietnamIso8601(v.rejected_at),
    rejection_reason: v.rejection_reason,
    admin_id: v.admin_id,
    created_at: toVietnamIso8601(v.created_at),
    updated_at: toVietnamIso8601(v.updated_at),
    user: v.users_verifications_user_idTousers,
    admin: v.users_verifications_admin_idTousers,
  };
}
