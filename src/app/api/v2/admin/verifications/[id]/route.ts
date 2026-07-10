import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { mapVerificationResource } from '@/lib/api-resources/verification-resource';

const USER_BRIEF_SELECT = { id: true, name: true, email: true, phone: true, avatar: true } as const;

/** GET /api/v2/admin/verifications/[id] — port của AdminVerificationController@show (findOrFail -> 404 nếu không có). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: `No query results for model [App\\Models\\Verification] ${id}` }, { status: 404 });
  }

  const verification = await db.verifications.findUnique({
    where: { id: BigInt(id) },
    include: {
      users_verifications_user_idTousers: { select: USER_BRIEF_SELECT },
      users_verifications_admin_idTousers: { select: USER_BRIEF_SELECT },
    },
  });

  if (!verification) {
    return NextResponse.json({ message: `No query results for model [App\\Models\\Verification] ${id}` }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: mapVerificationResource(verification) });
}
