import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { getAuthContext, unauthenticatedResponse } from '@/lib/auth';

/** POST /api/v2/auth/logout — port của AuthController@logout (chỉ xoá token hiện tại). */
export async function POST(request: Request) {
  const ctx = await getAuthContext(request);
  if (!ctx) return unauthenticatedResponse();

  await db.personal_access_tokens.delete({ where: { id: ctx.tokenId } });

  return apiSuccess(null, 'Đăng xuất thành công');
}
