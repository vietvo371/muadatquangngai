import { NextResponse } from 'next/server';
import { buildAuthUrl, generatePkcePair, generateState, isGoogleOAuthConfigured } from '@/lib/oauth/google';

/** GET /api/v2/auth/oauth/google/start — redirect sang màn hình đồng ý của Google. */
export async function GET(request: Request) {
  const url = new URL(request.url);

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(`${url.origin}/login?error=oauth_not_configured`);
  }

  const redirectUri = `${url.origin}/api/v2/auth/oauth/google/callback`;
  const state = generateState();
  const { verifier, challenge } = generatePkcePair();

  const res = NextResponse.redirect(buildAuthUrl(redirectUri, state, challenge));
  const cookieOptions = {
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax' as const,
    maxAge: 600,
    path: '/',
  };
  res.cookies.set('oauth_state', state, cookieOptions);
  res.cookies.set('oauth_verifier', verifier, cookieOptions);
  return res;
}
