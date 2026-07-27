import crypto from 'node:crypto';

/**
 * Đăng nhập bằng Google — tự viết luồng OAuth Authorization Code + PKCE bằng fetch thuần,
 * KHÔNG dùng next-auth. Hệ thống auth hiện tại là bearer token kiểu Sanctum
 * (personal_access_tokens + Authorization: Bearer), không phải session/cookie — next-auth
 * sẽ tạo ra 2 hệ thống auth song song, phức tạp hơn nhiều so với việc tự viết ~150 dòng.
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID ?? '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

/**
 * Origin công khai để build redirect_uri — KHÔNG dùng `new URL(request.url).origin` trực
 * tiếp vì VPS chạy sau reverse proxy OpenLiteSpeed (.htaccess `[P]` sang 127.0.0.1:3002)
 * không set X-Forwarded-Host/Proto, nên `request.url` bị lộ ra origin nội bộ
 * (http://localhost:3002) thay vì domain thật — đã xác nhận qua lỗi redirect_uri_mismatch
 * thật khi test. Ưu tiên NEXT_PUBLIC_SITE_URL (đã đúng "https://muadatquangngai.com" trên
 * VPS); chỉ fallback về request origin khi biến này chưa set (dev local).
 */
export function getAppOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  return new URL(request.url).origin;
}

export function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

/** PKCE — bảo vệ thêm cho authorization code dù client là confidential (có client_secret). */
export function generatePkcePair(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function buildAuthUrl(redirectUri: string, state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<GoogleTokenResponse | null> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

export interface GoogleProfile {
  providerId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

export async function fetchProfile(accessToken: string): Promise<GoogleProfile | null> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
    email_verified?: boolean;
  };

  if (!data.email) return null;

  return {
    providerId: data.sub,
    email: data.email,
    name: data.name ?? data.email,
    avatarUrl: data.picture ?? null,
    emailVerified: Boolean(data.email_verified),
  };
}
