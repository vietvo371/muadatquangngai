import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, unauthenticatedResponse, forbiddenResponse } from '@/lib/auth';
import { chargeWallet } from '@/lib/wallet';

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

  const days = pkg.duration_days ?? 30;
  const now = new Date();
  const base = property.vip_expired_at && property.vip_expired_at > now ? new Date(property.vip_expired_at) : now;
  base.setDate(base.getDate() + days);

  // TRƯỚC ĐÂY route này chỉ KIỂM số dư rồi gia hạn mà KHÔNG trừ tiền (comment cũ nói giữ đúng
  // behavior của Laravel) — ai có số dư đủ giá gói là gia hạn được vô hạn lần miễn phí, và
  // không có dòng giao dịch nào để đối chiếu. Nay trừ tiền thật, ghi giao dịch, nguyên tử.
  const body = await request.json().catch(() => ({}));
  const idempotencyKey =
    typeof body?.idempotency_key === 'string' && body.idempotency_key.trim().length >= 8
      ? body.idempotency_key.trim().slice(0, 64)
      : null;

  const charge = await chargeWallet({
    userId: user.id,
    amount: Number(pkg.price),
    note: `Gia hạn ${currentTier} cho tin #${property.id}`,
    idempotencyKey,
    referenceType: 'App\\Models\\Property',
    referenceId: property.id,
    apply: async (tx) => {
      await tx.properties.update({
        where: { id: property.id },
        data: { vip_expired_at: base, updated_at: new Date() },
      });
    },
  });

  if (!charge.ok) {
    return NextResponse.json({ success: false, message: 'Số dư không đủ. Vui lòng nạp thêm tiền.' }, { status: 422 });
  }
  if (charge.alreadyProcessed) {
    return NextResponse.json({ success: true, message: 'Yêu cầu gia hạn này đã được xử lý trước đó.' });
  }

  return NextResponse.json({ success: true, message: 'Đã gia hạn VIP thành công.' });
}
