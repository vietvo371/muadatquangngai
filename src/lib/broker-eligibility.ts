import { db } from '@/lib/db';
import { apiErrorWithCode } from '@/lib/api-response';

/**
 * Điều kiện đăng tin của MÔI GIỚI (Notion 24/09 "Publish – Backend Validation").
 *
 * Khách viết `role = broker`; hệ thống này gọi môi giới là `agent` (xem ROLES ở admin users).
 * Tài khoản `user` / `agency` / `admin` KHÔNG bị áp — giữ nguyên luồng đăng tin cũ
 * (Notion "Acceptance Criteria": role != broker → giữ nguyên logic hiện tại).
 *
 * Môi giới chỉ được đưa tin lên khi ĐỦ cả ba:
 *  - users.is_certified = true   (chỉ bật khi admin duyệt chứng chỉ — client không gửi được)
 *  - users.broker_company_id có giá trị
 *  - công ty đó status = 'approved'
 *
 * Kiểm ở MỌI cửa có thể đưa tin ra công khai (đăng mới, đăng lại, admin duyệt tin) để không
 * vòng qua được bằng cách gọi API trực tiếp (Notion "Publish API – Anti Bypass").
 */

export const BROKER_ROLE = 'agent';
export const BROKER_NOT_ELIGIBLE = 'BROKER_NOT_ELIGIBLE_TO_POST';

export interface BrokerEligibility {
  /** false = tài khoản không phải môi giới, luật này không áp. */
  applies: boolean;
  eligible: boolean;
  isCertified: boolean;
  companyAssigned: boolean;
  companyApproved: boolean;
  /** Trạng thái hồ sơ chứng chỉ gần nhất: null = chưa nộp bao giờ. */
  certificationStatus: 'pending' | 'approved' | 'rejected' | null;
  certificationRejectionReason: string | null;
  companyStatus: 'pending' | 'approved' | 'rejected' | null;
  companyName: string | null;
}

type Status = 'pending' | 'approved' | 'rejected';
const asStatus = (v: string | null | undefined): Status | null =>
  v === 'pending' || v === 'approved' || v === 'rejected' ? v : null;

export async function getBrokerEligibility(userId: bigint): Promise<BrokerEligibility | null> {
  const user = await db.users.findUnique({
    where: { id: userId },
    select: {
      role: true,
      is_certified: true,
      broker_company_id: true,
      broker_company: { select: { status: true, name: true } },
      broker_certification: { select: { status: true, rejection_reason: true } },
    },
  });
  if (!user) return null;

  const applies = user.role === BROKER_ROLE;
  const isCertified = user.is_certified === true;
  const companyAssigned = user.broker_company_id !== null;
  const companyApproved = user.broker_company?.status === 'approved';

  return {
    applies,
    eligible: !applies || (isCertified && companyAssigned && companyApproved),
    isCertified,
    companyAssigned,
    companyApproved,
    certificationStatus: asStatus(user.broker_certification?.status),
    certificationRejectionReason: user.broker_certification?.rejection_reason ?? null,
    companyStatus: asStatus(user.broker_company?.status),
    companyName: user.broker_company?.name ?? null,
  };
}

/** Câu thông báo theo đúng điều kiện đang thiếu (dùng chung cho API và popup). */
export function brokerIneligibleMessage(e: BrokerEligibility): string {
  const certMissing = !e.isCertified;
  if (certMissing && !e.companyAssigned) {
    return 'Bạn cần hoàn tất xác thực thông tin chứng chỉ hành nghề và cập nhật Công ty/Sàn giao dịch trực thuộc trước khi đăng tin.';
  }
  if (certMissing) {
    if (e.certificationStatus === 'pending') return 'Hồ sơ chứng chỉ hành nghề của bạn đang được Admin kiểm tra.';
    if (e.certificationStatus === 'rejected') return 'Hồ sơ chứng chỉ hành nghề của bạn đã bị từ chối.';
    return 'Bạn chưa hoàn tất xác thực thông tin chứng chỉ hành nghề.';
  }
  if (!e.companyAssigned) return 'Bạn chưa cập nhật Công ty/Sàn giao dịch trực thuộc.';
  return 'Công ty/Sàn giao dịch trực thuộc của bạn chưa được Admin duyệt.';
}

/** HTTP 403 + mã BROKER_NOT_ELIGIBLE_TO_POST + điều kiện thiếu (Notion "Publish – Error Response"). */
export function brokerIneligibleResponse(e: BrokerEligibility, message = brokerIneligibleMessage(e)) {
  return apiErrorWithCode(message, 403, BROKER_NOT_ELIGIBLE, {
    isCertified: e.isCertified,
    companyAssigned: e.companyAssigned,
    companyApproved: e.companyApproved,
    certificationStatus: e.certificationStatus,
    certificationRejectionReason: e.certificationRejectionReason,
    companyStatus: e.companyStatus,
  });
}
