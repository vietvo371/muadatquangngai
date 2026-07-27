import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { createToken, hashPassword } from '@/lib/auth';
import { exchangeCode, fetchProfile } from '@/lib/oauth/google';

const PROVIDER = 'google';

/**
 * GET /api/v2/auth/oauth/google/callback — đổi authorization code lấy token, tìm/gắn/tạo
 * user, rồi redirect về /oauth-callback kèm bearer token trong URL FRAGMENT (không phải
 * query string) — fragment không bao giờ gửi lên server/log/proxy, khác query param.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const failRedirect = NextResponse.redirect(`${url.origin}/login?error=oauth_failed`);

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookieStore = await cookies();
  const savedState = cookieStore.get('oauth_state')?.value;
  const verifier = cookieStore.get('oauth_verifier')?.value;

  // So state chống CSRF — request giả mạo không có cookie này nên sẽ luôn trượt ở đây.
  if (!code || !state || !savedState || !verifier || state !== savedState) {
    return failRedirect;
  }

  const redirectUri = `${url.origin}/api/v2/auth/oauth/google/callback`;
  const tokenData = await exchangeCode(code, redirectUri, verifier);
  if (!tokenData) return failRedirect;

  const profile = await fetchProfile(tokenData.access_token);
  if (!profile) return failRedirect;

  const existingAccount = await db.oauth_accounts.findFirst({
    where: { provider: PROVIDER, provider_id: profile.providerId },
    select: { user_id: true },
  });

  const now = new Date();
  let userId: bigint;

  if (existingAccount) {
    userId = existingAccount.user_id;
  } else {
    const existingUser = await db.users.findUnique({ where: { email: profile.email }, select: { id: true } });

    if (existingUser) {
      // Email đã có tài khoản thường (email/mật khẩu) — gắn thêm liên kết Google vào
      // CHÍNH user đó, không tạo user trùng.
      userId = existingUser.id;
    } else {
      // users.password NOT NULL nhưng user Google không cần mật khẩu — dùng chuỗi ngẫu
      // nhiên không ai đoán/đăng nhập được bằng nó qua form thường.
      const randomPassword = await hashPassword(crypto.randomBytes(32).toString('hex'));
      const created = await db.users.create({
        data: {
          uuid: crypto.randomUUID(),
          name: profile.name,
          email: profile.email,
          password: randomPassword,
          avatar: profile.avatarUrl,
          email_verified_at: profile.emailVerified ? now : null,
          created_at: now,
          updated_at: now,
        },
        select: { id: true },
      });
      userId = created.id;
    }

    await db.oauth_accounts.create({
      data: {
        user_id: userId,
        provider: PROVIDER,
        provider_id: profile.providerId,
        access_token: tokenData.access_token,
        created_at: now,
      },
    });
  }

  const accessToken = await createToken(userId);

  const res = NextResponse.redirect(`${url.origin}/oauth-callback#access_token=${accessToken}&token_type=Bearer`);
  res.cookies.delete('oauth_state');
  res.cookies.delete('oauth_verifier');
  return res;
}
