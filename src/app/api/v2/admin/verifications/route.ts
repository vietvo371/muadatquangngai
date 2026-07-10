import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { mapVerificationResource } from '@/lib/api-resources/verification-resource';

const USER_BRIEF_SELECT = { id: true, name: true, email: true, phone: true, avatar: true } as const;

/** GET /api/v2/admin/verifications — port của AdminVerificationController@index (chỉ lấy pending). */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const perPage = Math.max(1, parseInt(searchParams.get('per_page') ?? '20', 10) || 20);
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const where = { status: 'pending', ...(type ? { type } : {}) };

  const [total, rows] = await Promise.all([
    db.verifications.count({ where }),
    db.verifications.findMany({
      where,
      orderBy: { created_at: 'desc' }, // ->latest()
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        users_verifications_user_idTousers: { select: USER_BRIEF_SELECT },
        users_verifications_admin_idTousers: { select: USER_BRIEF_SELECT },
      },
    }),
  ]);

  // Laravel route này tự build meta tay (không có from/to) — khớp đúng shape gốc.
  return NextResponse.json({
    success: true,
    data: rows.map((r) => mapVerificationResource(r)),
    meta: {
      current_page: page,
      last_page: Math.max(1, Math.ceil(total / perPage)),
      per_page: perPage,
      total,
    },
  });
}
