import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthenticatedResponse, forbiddenResponse } from '@/lib/auth';
import { toCarbonDefaultUtc } from '@/lib/api-resources/carbon-format';

const VIP_LABEL: Record<string, string> = { normal: 'Thường', vip: 'VIP', vip_plus: 'VIP+', diamond: 'Kim Cương' };
const TIERS = ['vip', 'vip_plus', 'diamond'] as const;

function notFound(id: string) {
  return NextResponse.json({ message: `No query results for model [App\\Models\\Property] ${id}` }, { status: 404 });
}

/**
 * GET /api/v2/properties/[slug]/boost — port của PropertyBoostController@checkBoost.
 * (segment tên slug nhưng giá trị là ID số, giống các route similar/boost khác.)
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const { slug: id } = await params;
  if (!/^\d+$/.test(id)) return notFound(id);
  const property = await db.properties.findUnique({ where: { id: BigInt(id) }, select: { is_vip: true, vip_expired_at: true } });
  if (!property) return notFound(id);

  const currentTier = property.is_vip ?? 'normal';
  const isExpired = property.vip_expired_at === null || property.vip_expired_at <= new Date();

  const packages = await db.packages.findMany({ where: { is_active: true, type: { not: 'normal' } }, orderBy: { id: 'asc' } });

  return NextResponse.json({
    success: true,
    data: {
      current_tier: currentTier,
      current_tier_label: VIP_LABEL[currentTier] ?? currentTier,
      vip_expired_at: toCarbonDefaultUtc(property.vip_expired_at),
      is_expired: isExpired,
      can_renew: currentTier !== 'normal',
      // Number(p.id): NextResponse.json không tự hạ BigInt (khác apiSuccess) — Laravel trả id dạng số.
      packages: packages.map((p) => ({ id: Number(p.id), name: p.name, type: p.type, price: String(p.price), duration_days: p.duration_days })),
    },
  });
}

/** POST /api/v2/properties/[slug]/boost — port của PropertyBoostController@boost (trừ balance nội bộ). */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const body = await request.json().catch(() => ({}));
  const tier = body?.tier;
  // Laravel validate 'required|in:...' — kiểm required TRƯỚC (thiếu -> message required),
  // rồi mới in (có nhưng sai -> message in). Phải phân biệt 2 message này.
  if (tier === undefined || tier === null || tier === '') {
    return NextResponse.json(
      { message: 'Trường tier không được để trống.', errors: { tier: ['Trường tier không được để trống.'] } },
      { status: 422 }
    );
  }
  if (typeof tier !== 'string' || !TIERS.includes(tier as (typeof TIERS)[number])) {
    return NextResponse.json(
      { message: 'Giá trị đã chọn trong trường tier không hợp lệ.', errors: { tier: ['Giá trị đã chọn trong trường tier không hợp lệ.'] } },
      { status: 422 }
    );
  }

  const { slug: id } = await params;
  if (!/^\d+$/.test(id)) return notFound(id);
  const property = await db.properties.findUnique({ where: { id: BigInt(id) } });
  if (!property) return notFound(id);

  if (property.user_id !== user.id && user.role !== 'admin') return forbiddenResponse();

  const pkg = await db.packages.findFirst({ where: { type: tier, is_active: true }, orderBy: { id: 'asc' } });
  if (!pkg) return NextResponse.json({ success: false, message: 'Không tìm thấy gói VIP phù hợp.' }, { status: 404 });

  const balance = Number(user.balance);
  if (balance < Number(pkg.price)) {
    return NextResponse.json({ success: false, message: 'Số dư không đủ. Vui lòng nạp thêm tiền.' }, { status: 422 });
  }

  const days = pkg.duration_days ?? 30;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);

  await db.$transaction([
    db.users.update({ where: { id: user.id }, data: { balance: { decrement: pkg.price }, updated_at: new Date() } }),
    db.properties.update({ where: { id: property.id }, data: { is_vip: tier, vip_expired_at: expiry, updated_at: new Date() } }),
  ]);

  return NextResponse.json({ success: true, message: `Đã nâng cấp tin lên ${VIP_LABEL[tier]} thành công.` });
}
