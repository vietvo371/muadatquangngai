import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { FieldError, validationErrorResponse } from '@/lib/validation';

/** PUT /api/v2/admin/verifications/[id]/reject — port của AdminVerificationController@reject. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const reason = body?.rejection_reason;

  if (reason === undefined || reason === null || reason === '') {
    return validationErrorResponse([new FieldError('rejection_reason', 'Trường rejection reason không được để trống.')]);
  }
  if (typeof reason !== 'string' || reason.length > 500) {
    return validationErrorResponse([new FieldError('rejection_reason', 'Trường rejection reason không được lớn hơn 500 ký tự.')]);
  }

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

  await db.verifications.update({
    where: { id: verification.id },
    data: {
      status: 'rejected',
      rejected_at: new Date(),
      rejection_reason: reason,
      admin_id: guard.id,
      updated_at: new Date(),
    },
  });

  return NextResponse.json({ success: true, message: 'Đã từ chối yêu cầu xác thực.' });
}
