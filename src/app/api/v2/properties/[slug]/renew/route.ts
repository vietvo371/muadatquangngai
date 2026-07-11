import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthenticatedResponse, forbiddenResponse } from '@/lib/auth';

function notFound(id: string) {
  return NextResponse.json({ message: `No query results for model [App\\Models\\Property] ${id}` }, { status: 404 });
}

/** POST /api/v2/properties/[slug]/renew — port của PropertyBoostController@renew (gia hạn VIP, trừ balance nội bộ). */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const { slug: id } = await params;
  if (!/^\d+$/.test(id)) return notFound(id);
  const property = await db.properties.findUnique({ where: { id: BigInt(id) } });
  if (!property) return notFound(id);

  if (property.user_id !== user.id && user.role !== 'admin') return forbiddenResponse();

  const currentTier = property.is_vip ?? 'normal';
  if (currentTier === 'normal') {
    return NextResponse.json({ success: false, message: 'Tin này chưa có VIP để gia hạn.' }, { status: 422 });
  }

  const pkg = await db.packages.findFirst({ where: { type: currentTier, is_active: true }, orderBy: { id: 'asc' } });
  if (!pkg) return NextResponse.json({ success: false, message: 'Không tìm thấy gói gia hạn.' }, { status: 404 });

  if (Number(user.balance) < Number(pkg.price)) {
    return NextResponse.json({ success: false, message: 'Số dư không đủ. Vui lòng nạp thêm tiền.' }, { status: 422 });
  }

  const days = pkg.duration_days ?? 30;
  const now = new Date();
  const base = property.vip_expired_at && property.vip_expired_at > now ? new Date(property.vip_expired_at) : now;
  base.setDate(base.getDate() + days);

  // Laravel renew() KHÔNG trừ balance (chỉ boost() trừ) — chỉ cập nhật hạn. Giữ đúng behavior.
  await db.properties.update({ where: { id: property.id }, data: { vip_expired_at: base, updated_at: new Date() } });

  return NextResponse.json({ success: true, message: 'Đã gia hạn VIP thành công.' });
}
