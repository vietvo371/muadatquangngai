/**
 * Trạng thái xử lý một khách hàng tiềm năng (lead) — môi giới tự chuyển trong dashboard.
 * `new` là trạng thái lúc khách vừa gửi form "Yêu cầu tư vấn".
 */
export const LEAD_STATUSES = ['new', 'contacted', 'closed'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Mới',
  contacted: 'Đã liên hệ',
  closed: 'Đã chốt',
};

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && (LEAD_STATUSES as readonly string[]).includes(value);
}
