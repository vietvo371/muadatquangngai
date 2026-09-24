import { db } from '@/lib/db';
import { toVietnamIso8601 } from '@/lib/api-resources/carbon-format';
import { getBrokerEligibility, brokerIneligibleMessage } from '@/lib/broker-eligibility';
import { dbNow } from '@/lib/db-time';

/** Ảnh chứng chỉ phải là link https do Cloudinary trả về sau khi tải lên từ trình duyệt. */
export function isImageUrl(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 500 && /^https:\/\/\S+$/.test(v);
}

export function companyResource(c: {
  id: bigint; name: string; tax_code: string | null; address: string | null; phone: string | null;
  email: string | null; status: string; rejection_reason: string | null; agency_id?: bigint | null;
}) {
  return {
    id: c.id, name: c.name, tax_code: c.tax_code, address: c.address, phone: c.phone, email: c.email,
    status: c.status, rejection_reason: c.rejection_reason, agency_id: c.agency_id ?? null,
  };
}

/**
 * Sàn trong danh bạ Doanh nghiệp được đưa vào ô chọn Công ty/Sàn (khách chốt 24/09): sàn môi giới
 * đang hoạt động, KHÔNG lấy dữ liệu demo tự sinh.
 */
const DIRECTORY_BROKERAGE_WHERE = { business_type: 'brokerage', is_active: true, is_demo: false } as const;
const MAX_COMPANY_OPTIONS = 20;

/**
 * Lựa chọn cho ô Công ty/Sàn: Công ty/Sàn đã duyệt + sàn thật trong danh bạ chưa có dòng Công ty/Sàn.
 * Sàn danh bạ chưa liên kết trả về với id = null và agency_id — chọn nó thì server mới tạo dòng.
 */
export async function searchSelectableCompanies(q: string) {
  const nameFilter = q ? { contains: q, mode: 'insensitive' as const } : undefined;
  const [companies, agencies] = await Promise.all([
    db.broker_companies.findMany({
      where: {
        status: 'approved',
        // Sàn danh bạ đã ngừng hoạt động / bị đánh dấu demo thì không cho chọn mới nữa.
        OR: [{ agency_id: null }, { agency: DIRECTORY_BROKERAGE_WHERE }],
        ...(q ? { AND: [{ OR: [{ name: nameFilter }, { tax_code: { contains: q } }] }] } : {}),
      },
      orderBy: { name: 'asc' },
      take: MAX_COMPANY_OPTIONS,
    }),
    db.agencies.findMany({
      where: { ...DIRECTORY_BROKERAGE_WHERE, broker_companies: { none: {} }, ...(nameFilter ? { name: nameFilter } : {}) },
      orderBy: { name: 'asc' },
      take: MAX_COMPANY_OPTIONS,
      select: { id: true, name: true, address: true, phone: true, email: true },
    }),
  ]);

  const fromDirectory = agencies.map((a) => ({
    id: null, name: a.name, tax_code: null, address: a.address, phone: a.phone, email: a.email,
    status: 'approved', rejection_reason: null, agency_id: a.id,
  }));
  return [...companies.map(companyResource), ...fromDirectory]
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    .slice(0, MAX_COMPANY_OPTIONS);
}

/**
 * Dòng Công ty/Sàn (đã duyệt) ứng với một sàn trong danh bạ — tạo mới nếu chưa có. Trả null nếu sàn
 * không còn đủ điều kiện (ngừng hoạt động, demo, không phải sàn môi giới).
 */
export async function ensureCompanyForAgency(agencyId: bigint, userId: bigint) {
  const agency = await db.agencies.findFirst({ where: { id: agencyId, ...DIRECTORY_BROKERAGE_WHERE } });
  if (!agency) return null;
  const existing = await db.broker_companies.findFirst({ where: { agency_id: agency.id } });
  if (existing) return existing;

  const now = dbNow();
  try {
    return await db.broker_companies.create({
      data: {
        name: agency.name, address: agency.address, phone: agency.phone, email: agency.email,
        agency_id: agency.id, status: 'approved', created_by: userId, approved_at: now,
        created_at: now, updated_at: now,
      },
    });
  } catch (err) {
    // Hai môi giới chọn cùng một sàn cùng lúc: chỉ mục duy nhất trên agency_id chặn dòng thứ hai.
    if ((err as { code?: string })?.code === 'P2002') {
      return db.broker_companies.findFirst({ where: { agency_id: agency.id } });
    }
    throw err;
  }
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
