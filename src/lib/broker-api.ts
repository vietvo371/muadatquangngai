import api from '@/lib/axios';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface BrokerCompany {
  /** null = sàn trong danh bạ Doanh nghiệp chưa có dòng Công ty/Sàn; chọn bằng agency_id. */
  id: number | null;
  agency_id: number | null;
  name: string;
  tax_code: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: ReviewStatus;
  rejection_reason: string | null;
}

export interface BrokerCertification {
  certificate_number: string;
  issued_date: string;
  issued_by: string;
  front_image: string;
  back_image: string;
  status: ReviewStatus;
  rejection_reason: string | null;
  reviewed_at: string | null;
  submitted_at: string | null;
}

/** Khớp dữ liệu API trả ở GET /api/v2/my/broker-profile và ở lỗi 403 BROKER_NOT_ELIGIBLE_TO_POST. */
export interface BrokerEligibilityInfo {
  isCertified: boolean;
  companyAssigned: boolean;
  companyApproved: boolean;
  certificationStatus: ReviewStatus | null;
  certificationRejectionReason: string | null;
  companyStatus: ReviewStatus | null;
}

export interface BrokerProfile extends BrokerEligibilityInfo {
  applies: boolean;
  eligible: boolean;
  message: string | null;
  companyName: string | null;
  certification: BrokerCertification | null;
  company: BrokerCompany | null;
}

export const BROKER_NOT_ELIGIBLE = 'BROKER_NOT_ELIGIBLE_TO_POST';
export const BROKER_PROFILE_HREF = '/dashboard/profile#xac-thuc-moi-gioi';

/** Lỗi axios có phải là "môi giới chưa đủ điều kiện đăng tin" không; có thì trả thông tin kèm theo. */
export function readBrokerIneligible(err: unknown): (BrokerEligibilityInfo & { message: string }) | null {
  const res = (err as { response?: { status?: number; data?: { code?: string; message?: string; data?: BrokerEligibilityInfo } } })?.response;
  if (res?.status !== 403 || res.data?.code !== BROKER_NOT_ELIGIBLE || !res.data.data) return null;
  return { ...res.data.data, message: res.data.message ?? '' };
}

export const brokerApi = {
  profile: () => api.get('/api/v2/my/broker-profile').then((r) => r.data.data as BrokerProfile),
  submitCertification: (payload: Omit<BrokerCertification, 'status' | 'rejection_reason' | 'reviewed_at' | 'submitted_at'>) =>
    api.put('/api/v2/my/broker-profile/certification', payload).then((r) => r.data as { message: string; data: BrokerProfile }),
  selectCompany: (company: Pick<BrokerCompany, 'id' | 'agency_id'>) =>
    api.put('/api/v2/my/broker-profile/company', company.id !== null ? { company_id: company.id } : { agency_id: company.agency_id })
      .then((r) => r.data as { message: string; data: BrokerProfile }),
  searchCompanies: (q: string) =>
    api.get('/api/v2/broker-companies', { params: { q } }).then((r) => r.data.data as BrokerCompany[]),
  proposeCompany: (payload: { name: string; tax_code: string; address: string; phone: string; email?: string }) =>
    api.post('/api/v2/broker-companies', payload).then((r) => r.data as { message: string; data: BrokerProfile }),
};
