import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * PUT /api/v2/admin/verifications/[id]/approve — port của AdminVerificationController@approve.
 *
 * Laravel cũng gọi `$user->update(['role' => ..., 'verification_status' => 'approved'])`
 * nhưng cột `verification_status` KHÔNG tồn tại trên bảng `users` (đã xác nhận qua
 * `Schema::getColumnListing('users')`) và cũng không nằm trong `$fillable` — Eloquent mass
 * assignment âm thầm bỏ qua key lạ này, không throw. Nghĩa là hiệu ứng thật sự chỉ là
 * cập nhật `role`. Next.js replicate đúng hành vi THẬT (chỉ set role), không phải code
 * Laravel nhìn thấy trên mặt giấy — cùng dạng schema-drift đã gặp ở NotificationService.
 * NotificationService::send() cũng bị bỏ qua ở Next.js vì lý do tương tự (Phase 4).
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: `No query results for model [App\\Models\\Verification] ${id}` }, { status: 404 });
  }

  const verification = await db.verifications.findUnique({ where: { id: BigInt(id) } });
  if (!verification) {
    return NextResponse.json({ message: `No query results for model [App\\Models\\Verification] ${id}` }, { status: 404 });
  }

  if (verification.status !== 'pending') {
    return NextResponse.json({ success: false, message: 'Yêu cầu đã được xử lý trước đó.' }, { status: 422 });
  }

  const now = new Date();
  await db.verifications.update({
    where: { id: verification.id },
    data: { status: 'approved', verified_at: now, admin_id: guard.id, updated_at: now },
  });

  await db.users.update({
    where: { id: verification.user_id },
    data: { role: verification.type === 'agency' ? 'agency' : 'agent', updated_at: now },
  });

  return NextResponse.json({ success: true, message: 'Đã duyệt yêu cầu xác thực.' });
}
