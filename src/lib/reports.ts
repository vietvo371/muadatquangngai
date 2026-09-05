/**
 * Nguồn sự thật duy nhất cho mã lý do / loại đối tượng của bảng `reports`.
 *
 * Trước đây mỗi nơi tự đặt tên một kiểu: trang admin coi `type` là loại vi phạm với 4 giá trị
 * bịa ('fake' | 'fraud' | 'spam' | 'inappropriate'), còn API dashboard lại gom theo `reason`
 * với bộ mã khác. Hai bên không bao giờ khớp nhau. Chốt lại theo đúng cột trong DB:
 *   - `type`   = đối tượng bị báo cáo (tin đăng hay người dùng)
 *   - `reason` = loại vi phạm
 */

export const REPORT_REASONS = [
  'spam',
  'duplicate',
  'fake',
  'wrong_info',
  'scam',
  'sold',
  'unreachable',
  'inappropriate',
  'other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABEL: Record<string, string> = {
  spam: 'Tin đăng spam, đăng lặp',
  duplicate: 'Tin đăng trùng lặp',
  fake: 'Thông tin sai sự thật',
  wrong_info: 'Thông tin không chính xác',
  scam: 'Có dấu hiệu lừa đảo',
  sold: 'Tin đã bán/cho thuê nhưng chưa gỡ',
  unreachable: 'Không liên hệ được người đăng',
  inappropriate: 'Nội dung không phù hợp',
  other: 'Lý do khác',
};

export const REPORT_TYPES = ['property', 'user'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABEL: Record<string, string> = {
  property: 'Tin đăng',
  user: 'Người dùng',
};

/** Mã lạ (do dữ liệu cũ hoặc client khác ghi vào) hiển thị nguyên văn thay vì bịa nhãn. */
export function reportReasonLabel(reason: string): string {
  return REPORT_REASON_LABEL[reason] ?? reason;
}

export function reportTypeLabel(type: string): string {
  return REPORT_TYPE_LABEL[type] ?? type;
}

export function isReportReason(value: unknown): value is ReportReason {
  return typeof value === 'string' && (REPORT_REASONS as readonly string[]).includes(value);
}

export function isReportType(value: unknown): value is ReportType {
  return typeof value === 'string' && (REPORT_TYPES as readonly string[]).includes(value);
}
