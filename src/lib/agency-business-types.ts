/**
 * Lĩnh vực hoạt động của doanh nghiệp trong danh bạ — theo cơ cấu phân loại của
 * batdongsan.com.vn/doanh-nghiep (đối chiếu trực tiếp qua trình duyệt 21/07/2026), vì danh
 * bạ đó không chỉ gồm sàn môi giới mà còn chủ đầu tư, nhà thầu, đơn vị thiết kế...
 *
 * Chỉ 'brokerage' mới có môi giới/tin đăng gắn kèm (qua users.agency_id) — các loại khác
 * là hồ sơ giới thiệu doanh nghiệp thuần tuý.
 */
export const AGENCY_BUSINESS_TYPES = [
  { value: 'developer', label: 'Chủ đầu tư' },
  { value: 'construction', label: 'Thi công xây dựng' },
  { value: 'design', label: 'Tư vấn thiết kế' },
  { value: 'brokerage', label: 'Sàn giao dịch bất động sản' },
  { value: 'interior', label: 'Trang trí nội thất' },
  { value: 'materials', label: 'Vật liệu xây dựng' },
  { value: 'other', label: 'Lĩnh vực khác' },
] as const;

export type AgencyBusinessType = (typeof AGENCY_BUSINESS_TYPES)[number]['value'];

const LABEL_BY_VALUE = new Map(AGENCY_BUSINESS_TYPES.map((t) => [t.value, t.label]));

export function agencyBusinessTypeLabel(value: string): string {
  return LABEL_BY_VALUE.get(value as AgencyBusinessType) ?? value;
}

export function isValidAgencyBusinessType(value: unknown): value is AgencyBusinessType {
  return typeof value === 'string' && LABEL_BY_VALUE.has(value as AgencyBusinessType);
}
