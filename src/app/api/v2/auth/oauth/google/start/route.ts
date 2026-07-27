import { NextResponse } from 'next/server';
import { buildAuthUrl, generatePkcePair, generateState, getAppOrigin, isGoogleOAuthConfigured } from '@/lib/oauth/google';

/** GET /api/v2/auth/oauth/google/start — redirect sang màn hình đồng ý của Google. */
export async function GET(request: Request) {
  const origin = getAppOrigin(request);

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(`${origin}/login?error=oauth_not_configured`);
  }

  const redirectUri = `${origin}/api/v2/auth/oauth/google/callback`;
  const state = generateState();
  const { verifier, challenge } = generatePkcePair();

  const res = NextResponse.redirect(buildAuthUrl(redirectUri, state, challenge));
  const cookieOptions = {
    httpOnly: true,
    secure: origin.startsWith('https:'),
    sameSite: 'lax' as const,
    maxAge: 600,
    path: '/',
  };
  res.cookies.set('oauth_state', state, cookieOptions);
  res.cookies.set('oauth_verifier', verifier, cookieOptions);
  return res;
}
