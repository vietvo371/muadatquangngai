/** Trạng thái duyệt dùng chung cho hồ sơ chứng chỉ và Công ty/Sàn (Notion 24/09). */
export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export function parseReviewStatus(v: string | null): ReviewStatus {
  return v === 'approved' || v === 'rejected' ? v : 'pending';
}

export const REJECTION_REASON_MAX = 500;

/** Lý do từ chối là BẮT BUỘC (Notion "Admin – Xác thực chứng chỉ"). Trả null nếu hợp lệ. */
export function readRejectionReason(body: unknown): string | null {
  const raw = (body as { rejection_reason?: unknown })?.rejection_reason;
  const reason = typeof raw === 'string' ? raw.trim() : '';
  return reason.length >= 5 && reason.length <= REJECTION_REASON_MAX ? reason : null;
}

/** Link thông báo đưa môi giới về đúng mục xác thực trong trang Hồ sơ. */
export const BROKER_PROFILE_URL = '/dashboard/profile#xac-thuc-moi-gioi';
