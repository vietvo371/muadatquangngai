import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/** GET /api/v2/admin/verifications/stats — port của AdminVerificationController@stats. */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const [pending, approved, rejected] = await Promise.all([
    db.verifications.count({ where: { status: 'pending' } }),
    db.verifications.count({ where: { status: 'approved' } }),
    db.verifications.count({ where: { status: 'rejected' } }),
  ]);

  return NextResponse.json({ success: true, data: { pending, approved, rejected } });
}
