import { db } from '@/lib/db';
import { slugify } from '@/lib/formatters';
import { toVietnamIso8601 } from '@/lib/api-resources/carbon-format';
import { isValidAgencyBusinessType } from '@/lib/agency-business-types';
import { isValidPhone, isValidEmail } from '@/lib/property-form-config';
import { FieldError } from '@/lib/validation';

/**
 * Doanh nghiệp / Sàn giao dịch — bảng `businesses` là nguồn DUY NHẤT (Notion 25/09, chốt 27/09) cho
 * danh bạ công khai, ô chọn Công ty/Sàn của môi giới, trang môi giới và trang admin. Thay cho hai
 * bảng cũ `agencies` + `broker_companies` (xem prisma/sql/2026-09-27-05-businesses.sql).
 */

export const BUSINESS_STATUSES = ['pending', 'active', 'rejected'] as const;
export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

export function parseBusinessStatus(value: string | null): BusinessStatus {
  return value === 'active' || value === 'rejected' ? value : 'pending';
}

/** Danh bạ công khai, trang doanh nghiệp: chỉ doanh nghiệp đang hoạt động. */
export const PUBLIC_BUSINESS_WHERE = { status: 'active' } as const;

/**
 * Doanh nghiệp môi giới được phép chọn làm Công ty/Sàn trực thuộc (Notion "Dropdown Công ty/Sàn"):
 * đang hoạt động, là sàn môi giới, không phải dữ liệu demo. Pending / rejected không bao giờ được
 * dùng để vượt điều kiện đăng tin (Notion "Doanh nghiệp Pending").
 */
export const SELECTABLE_BUSINESS_WHERE = { status: 'active', is_demo: false, business_type: 'brokerage' } as const;

export const MAX_TAX_CODE_LENGTH = 20;
const TAX_CODE_PATTERN = /^\d{10}(-\d{3})?$/;

/** Slug duy nhất — thêm hậu tố số khi trùng, cùng cách property/project đang làm. */
export async function uniqueBusinessSlug(name: string, excludeId?: bigint): Promise<string> {
  const base = slugify(name) || 'doanh-nghiep';
  let slug = base;
  for (let i = 2; ; i++) {
    const taken = await db.businesses.findFirst({
      where: { slug, ...(excludeId !== undefined ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!taken) return slug;
    slug = `${base}-${i}`;
  }
}

export interface BusinessInput {
  name?: string;
  tax_code?: string | null;
  business_type?: string;
  industry?: string | null;
  area?: string | null;
  province_id?: bigint | null;
  district_id?: bigint | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logo?: string | null;
  description?: string | null;
  is_demo?: boolean;
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);
const nullableText = (v: unknown, max: number) => {
  if (v === null) return null;
  const t = text(v, max);
  return t === undefined ? undefined : t || null;
};
const idOrNull = (v: unknown) => {
  if (v === null || v === '') return null;
  if (typeof v === 'number' && Number.isInteger(v) && v > 0) return BigInt(v);
  if (typeof v === 'string' && /^\d+$/.test(v)) return BigInt(v);
  return undefined;
};

/**
 * Đọc + kiểm tra dữ liệu doanh nghiệp từ body. `required` là các trường bắt buộc của luồng gọi
 * (admin tạo mới chỉ cần tên; môi giới đề xuất cần tên + MST + địa chỉ + SĐT). Trường không gửi
 * thì bỏ qua (dùng được cho cả tạo mới lẫn sửa một phần).
 */
export function readBusinessInput(
  body: Record<string, unknown>,
  required: ReadonlyArray<'name' | 'tax_code' | 'address' | 'phone'>
): { input: BusinessInput; errors: FieldError[] } {
  const errors: FieldError[] = [];
  const input: BusinessInput = {};

  const name = text(body.name, 255);
  if (name !== undefined) input.name = name;
  if ((required.includes('name') || name !== undefined) && !name) {
    errors.push(new FieldError('name', 'Vui lòng nhập tên doanh nghiệp.'));
  }

  const taxCode = body.tax_code === null ? null : text(body.tax_code, MAX_TAX_CODE_LENGTH)?.replace(/\s/g, '');
  if (taxCode !== undefined) input.tax_code = taxCode || null;
  if (required.includes('tax_code') && !taxCode) {
    errors.push(new FieldError('tax_code', 'Vui lòng nhập mã số thuế.'));
  } else if (taxCode && !TAX_CODE_PATTERN.test(taxCode)) {
    errors.push(new FieldError('tax_code', 'Mã số thuế gồm 10 số (hoặc 10 số kèm -3 số chi nhánh).'));
  }

  const address = nullableText(body.address, 500);
  if (address !== undefined) input.address = address;
  if (required.includes('address') && !address) errors.push(new FieldError('address', 'Vui lòng nhập địa chỉ.'));

  const phone = nullableText(body.phone, 20);
  if (phone !== undefined) input.phone = phone;
  if (required.includes('phone') && !phone) errors.push(new FieldError('phone', 'Vui lòng nhập số điện thoại.'));
  else if (phone && !isValidPhone(phone)) errors.push(new FieldError('phone', 'Số điện thoại không hợp lệ.'));

  const email = nullableText(body.email, 255);
  if (email !== undefined) input.email = email;
  if (email && !isValidEmail(email)) errors.push(new FieldError('email', 'Email không hợp lệ.'));

  if (body.business_type !== undefined) {
    if (isValidAgencyBusinessType(body.business_type)) input.business_type = body.business_type;
    else errors.push(new FieldError('business_type', 'Lĩnh vực không hợp lệ.'));
  }

  for (const key of ['industry', 'area'] as const) {
    const v = nullableText(body[key], 255);
    if (v !== undefined) input[key] = v;
  }
  const website = nullableText(body.website, 255);
  if (website !== undefined) input.website = website;
  const logo = nullableText(body.logo, 500);
  if (logo !== undefined) input.logo = logo;
  const description = nullableText(body.description, 5000);
  if (description !== undefined) input.description = description;

  for (const key of ['province_id', 'district_id'] as const) {
    if (body[key] === undefined) continue;
    const v = idOrNull(body[key]);
    if (v === undefined) errors.push(new FieldError(key, 'Khu vực không hợp lệ.'));
    else input[key] = v;
  }

  if (body.is_demo !== undefined) {
    if (typeof body.is_demo === 'boolean') input.is_demo = body.is_demo;
    else errors.push(new FieldError('is_demo', 'Giá trị dữ liệu mẫu không hợp lệ.'));
  }

  return { input, errors };
}

const normalizePhone = (v: string | null | undefined) => (v ?? '').replace(/\D/g, '');
const normalizeText = (v: string | null | undefined) => (v ?? '').trim().toLowerCase();

/**
 * Doanh nghiệp đã tồn tại (Notion "Tạo doanh nghiệp mới" / "Duplicate doanh nghiệp"): ưu tiên trùng
 * mã số thuế; không có MST thì trùng tên + địa chỉ + số điện thoại.
 */
export async function findDuplicateBusiness(input: BusinessInput, excludeId?: bigint) {
  const notSelf = excludeId !== undefined ? { id: { not: excludeId } } : {};
  if (input.tax_code) {
    const byTax = await db.businesses.findFirst({ where: { tax_code: input.tax_code, ...notSelf } });
    if (byTax) return byTax;
  }
  if (!input.name) return null;
  const sameName = await db.businesses.findMany({
    where: { name: { equals: input.name.trim(), mode: 'insensitive' }, ...notSelf },
    take: 20,
  });
  return sameName.find(
    (b) => normalizeText(b.address) === normalizeText(input.address) && normalizePhone(b.phone) === normalizePhone(input.phone)
  ) ?? null;
}

export function duplicateBusinessMessage(existing: { status: string; name: string }): string {
  if (existing.status === 'active') {
    return `Doanh nghiệp "${existing.name}" đã có trong danh sách. Vui lòng tìm và chọn doanh nghiệp đó.`;
  }
  if (existing.status === 'pending') {
    return `Doanh nghiệp "${existing.name}" đã được đề xuất và đang chờ Admin duyệt.`;
  }
  return `Doanh nghiệp "${existing.name}" đã từng bị từ chối. Vui lòng liên hệ Admin nếu thông tin đã thay đổi.`;
}

/** Dữ liệu doanh nghiệp gắn với môi giới (Hồ sơ, popup đăng tin, ô chọn). */
export function businessBriefResource(b: {
  id: bigint; name: string; tax_code: string | null; address: string | null; phone: string | null;
  email: string | null; status: string; rejection_reason: string | null; is_demo?: boolean;
}) {
  return {
    id: Number(b.id),
    name: b.name,
    tax_code: b.tax_code,
    address: b.address,
    phone: b.phone,
    email: b.email,
    status: b.status as BusinessStatus,
    rejection_reason: b.rejection_reason,
  };
}

type BusinessRow = NonNullable<Awaited<ReturnType<typeof db.businesses.findFirst>>>;

/** Dữ liệu đầy đủ cho trang admin. */
export function businessAdminResource(
  b: BusinessRow,
  extra: { brokerCount: number; proposedByName: string | null; reviewedByName: string | null }
) {
  return {
    id: Number(b.id),
    name: b.name,
    slug: b.slug,
    business_type: b.business_type,
    industry: b.industry,
    area: b.area,
    province_id: b.province_id !== null ? Number(b.province_id) : null,
    district_id: b.district_id !== null ? Number(b.district_id) : null,
    tax_code: b.tax_code,
    address: b.address,
    phone: b.phone,
    email: b.email,
    website: b.website,
    logo: b.logo,
    description: b.description,
    status: b.status as BusinessStatus,
    is_demo: b.is_demo,
    rejection_reason: b.rejection_reason,
    broker_count: extra.brokerCount,
    proposed_by_name: extra.proposedByName,
    reviewed_by_name: extra.reviewedByName,
    approved_at: toVietnamIso8601(b.approved_at),
    rejected_at: toVietnamIso8601(b.rejected_at),
    created_at: toVietnamIso8601(b.created_at),
    updated_at: toVietnamIso8601(b.updated_at),
  };
}

/** Số môi giới tính ĐỘNG từ users.broker_company_id (Notion "Số lượng môi giới" — không lưu cứng). */
export async function brokerCountsByBusiness(ids: bigint[]): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const grouped = await db.users.groupBy({
    by: ['broker_company_id'],
    where: { broker_company_id: { in: ids }, deleted_at: null },
    _count: { _all: true },
  });
  return new Map(grouped.map((g) => [g.broker_company_id!.toString(), g._count._all]));
}
