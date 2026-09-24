import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';
import { dbNow } from '@/lib/db-time';
import { FieldError, validationErrorResponse } from '@/lib/validation';
import { isValidPhone, isValidEmail } from '@/lib/property-form-config';
import { BROKER_ROLE } from '@/lib/broker-eligibility';
import { companyResource, loadBrokerProfile } from '@/lib/broker-profile';

/** GET /api/v2/broker-companies?q= — Công ty/Sàn ĐÃ DUYỆT cho ô chọn có tìm kiếm (tối đa 20). */
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();
  const q = (new URL(request.url).searchParams.get('q') ?? '').trim().slice(0, 100);
  const rows = await db.broker_companies.findMany({
    where: {
      status: 'approved',
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { tax_code: { contains: q } }] } : {}),
    },
    orderBy: { name: 'asc' },
    take: 20,
  });
  return apiSuccess(rows.map(companyResource));
}

/**
 * POST /api/v2/broker-companies — "Công ty của tôi chưa có trong danh sách": môi giới đề xuất công
 * ty mới → 'pending' và được gắn luôn vào tài khoản; admin duyệt xong là đủ điều kiện, khỏi chọn lại.
 */
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();
  if (user.role !== BROKER_ROLE) return apiError('Chỉ tài khoản môi giới mới đề xuất Công ty/Sàn.', 403);

  const body = await request.json().catch(() => ({}));
  const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const name = s(body.name, 255);
  const taxCode = s(body.tax_code, 20).replace(/\s/g, '');
  const address = s(body.address, 500);
  const phone = s(body.phone, 20);
  const email = s(body.email, 255);

  const errors: FieldError[] = [];
  if (name.length < 3) errors.push(new FieldError('name', 'Vui lòng nhập tên Công ty/Sàn.'));
  if (!/^\d{10}(-\d{3})?$/.test(taxCode)) errors.push(new FieldError('tax_code', 'Mã số thuế gồm 10 số (hoặc 10 số kèm -3 số chi nhánh).'));
  if (!address) errors.push(new FieldError('address', 'Vui lòng nhập địa chỉ.'));
  if (!isValidPhone(phone)) errors.push(new FieldError('phone', 'Số điện thoại không hợp lệ.'));
  if (email && !isValidEmail(email)) errors.push(new FieldError('email', 'Email không hợp lệ.'));
  if (errors.length > 0) return validationErrorResponse(errors);

  const existing = await db.broker_companies.findFirst({ where: { tax_code: taxCode } });
  if (existing) {
    return apiError(
      existing.status === 'approved'
        ? 'Mã số thuế này đã có trong danh sách. Vui lòng tìm và chọn công ty đó.'
        : 'Công ty có mã số thuế này đã được đề xuất và đang chờ Admin duyệt.',
      409
    );
  }

  const now = dbNow();
  try {
    await db.$transaction(async (tx) => {
      const company = await tx.broker_companies.create({
        data: { name, tax_code: taxCode, address, phone, email: email || null, status: 'pending', created_by: user.id, created_at: now, updated_at: now },
      });
      await tx.users.update({ where: { id: user.id }, data: { broker_company_id: company.id, updated_at: now } });
    });
  } catch (err) {
    // Hai người cùng đề xuất một MST cùng lúc: chỉ mục duy nhất trên tax_code chặn lại → báo trùng.
    if ((err as { code?: string })?.code === 'P2002') {
      return apiError('Công ty có mã số thuế này vừa được đề xuất. Vui lòng tìm và chọn trong danh sách.', 409);
    }
    throw err;
  }

  return apiSuccess(await loadBrokerProfile(user.id), 'Đã gửi yêu cầu thêm Công ty/Sàn. Admin sẽ duyệt sớm.', 201);
}
