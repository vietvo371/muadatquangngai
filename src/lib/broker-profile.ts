import { db } from '@/lib/db';
import { toVietnamIso8601 } from '@/lib/api-resources/carbon-format';
import { getBrokerEligibility, brokerIneligibleMessage } from '@/lib/broker-eligibility';

/** Ảnh chứng chỉ phải là link https do Cloudinary trả về sau khi tải lên từ trình duyệt. */
export function isImageUrl(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 500 && /^https:\/\/\S+$/.test(v);
}

export function companyResource(c: {
  id: bigint; name: string; tax_code: string | null; address: string | null; phone: string | null;
  email: string | null; status: string; rejection_reason: string | null;
}) {
  return {
    id: c.id, name: c.name, tax_code: c.tax_code, address: c.address, phone: c.phone, email: c.email,
    status: c.status, rejection_reason: c.rejection_reason,
  };
}

/** Toàn bộ trạng thái xác thực của một môi giới — nguồn duy nhất cho trang Hồ sơ và popup đăng tin. */
export async function loadBrokerProfile(userId: bigint) {
  const [eligibility, cert, user] = await Promise.all([
    getBrokerEligibility(userId),
    db.broker_certifications.findUnique({ where: { user_id: userId } }),
    db.users.findUnique({ where: { id: userId }, select: { broker_company: true } }),
  ]);
  if (!eligibility) return null;
  return {
    ...eligibility,
    message: eligibility.eligible ? null : brokerIneligibleMessage(eligibility),
    certification: cert
      ? {
          certificate_number: cert.certificate_number,
          issued_date: cert.issued_date.toISOString().slice(0, 10),
          issued_by: cert.issued_by,
          front_image: cert.front_image,
          back_image: cert.back_image,
          status: cert.status,
          rejection_reason: cert.rejection_reason,
          reviewed_at: toVietnamIso8601(cert.reviewed_at),
          submitted_at: toVietnamIso8601(cert.updated_at ?? cert.created_at),
        }
      : null,
    company: user?.broker_company ? companyResource(user.broker_company) : null,
  };
}
