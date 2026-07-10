import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';
import { getAuthContext, unauthenticatedResponse, createToken } from '@/lib/auth';

/** POST /api/v2/auth/refresh — port của AuthController@refresh (xoá token cũ, cấp token mới). */
export async function POST(request: Request) {
  const ctx = await getAuthContext(request);
  if (!ctx) return unauthenticatedResponse();

  await db.personal_access_tokens.delete({ where: { id: ctx.tokenId } });
  const accessToken = await createToken(ctx.user.id);

  return apiSuccess({ access_token: accessToken, token_type: 'Bearer' });
}
