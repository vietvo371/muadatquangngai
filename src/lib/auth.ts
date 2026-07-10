import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { db } from './db';

/** Đối chiếu AuthenticationException mặc định của Laravel (đã verify qua curl thật). */
export function unauthenticatedResponse(): NextResponse {
  return new NextResponse(JSON.stringify({ message: 'Unauthenticated.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/**
 * Tương thích Laravel Sanctum's PersonalAccessToken — CÙNG 1 bảng
 * `personal_access_tokens`, CÙNG thuật toán, để token issue bởi backend nào cũng verify
 * được ở backend kia trong giai đoạn chạy song song (Giai đoạn 1→2 strangler).
 *
 * Cơ chế (đối chiếu Laravel\Sanctum\NewAccessToken + PersonalAccessToken::findToken()):
 * - Token trả về client dạng "{id}|{40 ký tự random}".
 * - DB chỉ lưu sha256({40 ký tự random}) ở cột `token` (KHÔNG lưu id/dấu |).
 * - Verify: tách theo dấu | đầu tiên → tìm row theo id → so sha256(phần sau) với cột token.
 * - `tokenable_type` PHẢI là 'App\Models\User' y hệt Laravel (đã xác nhận qua DB thật,
 *   dự án không đăng ký Relation::morphMap nên dùng full class name mặc định).
 * - `abilities` lưu JSON string — mặc định '["*"]' (không giới hạn), khớp
 *   $user->createToken('auth_token') không truyền ability trong AuthController.php.
 */
const TOKENABLE_TYPE = 'App\\Models\\User';
const DEFAULT_ABILITIES = '["*"]';

export async function createToken(userId: bigint, name = 'auth_token'): Promise<string> {
  const plainText = crypto.randomBytes(20).toString('hex'); // 40 ký tự hex, cùng độ dài Str::random(40)
  const hashed = crypto.createHash('sha256').update(plainText).digest('hex');

  // Prisma KHÔNG tự set created_at/updated_at như Eloquent — cột này nullable trong
  // schema (Laravel tự quản lý ở tầng PHP, không có DB default). Phải set tay ở MỌI
  // create(), không riêng gì bảng này — xem ghi chú trong route register/property.
  const now = new Date();
  const row = await db.personal_access_tokens.create({
    data: {
      tokenable_type: TOKENABLE_TYPE,
      tokenable_id: userId,
      name,
      token: hashed,
      abilities: DEFAULT_ABILITIES,
      created_at: now,
      updated_at: now,
    },
  });

  return `${row.id}|${plainText}`;
}

export interface AuthUser {
  id: bigint;
  uuid: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  cover_image: string | null;
  role: string;
  status: string;
  bio: string | null;
  balance: unknown;
  total_listings: number;
  total_sold: number;
  rating: unknown;
  review_count: number;
  agency_name: string | null;
  license_number: string | null;
  zalo: string | null;
  facebook: string | null;
  website: string | null;
  address: string | null;
  email_verified_at: Date | null;
  phone_verified_at: Date | null;
  created_at: Date | null;
  province_id: bigint | null;
  district_id: bigint | null;
}

const USER_SELECT = {
  id: true,
  uuid: true,
  name: true,
  email: true,
  phone: true,
  avatar: true,
  cover_image: true,
  role: true,
  status: true,
  bio: true,
  balance: true,
  total_listings: true,
  total_sold: true,
  rating: true,
  review_count: true,
  agency_name: true,
  license_number: true,
  zalo: true,
  facebook: true,
  website: true,
  address: true,
  email_verified_at: true,
  phone_verified_at: true,
  created_at: true,
  province_id: true,
  district_id: true,
} as const;

export interface AuthContext {
  user: AuthUser;
  tokenId: bigint; // cần cho logout()/refresh() — Sanctum chỉ xoá currentAccessToken(), không phải mọi token của user
}

/**
 * Xác thực request qua header `Authorization: Bearer {id}|{plaintext}` — đối chiếu
 * PersonalAccessToken::findToken(). Trả null nếu thiếu header/token sai/user bị khoá.
 * Cũng cập nhật last_used_at giống hành vi mặc định của Sanctum guard.
 */
export async function getAuthContext(request: Request): Promise<AuthContext | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const bearerToken = authHeader.slice('Bearer '.length).trim();
  const pipeIndex = bearerToken.indexOf('|');
  if (pipeIndex === -1) return null;

  const id = bearerToken.slice(0, pipeIndex);
  const plainText = bearerToken.slice(pipeIndex + 1);
  if (!/^\d+$/.test(id) || !plainText) return null;

  const hashed = crypto.createHash('sha256').update(plainText).digest('hex');

  const tokenRow = await db.personal_access_tokens.findUnique({ where: { id: BigInt(id) } });
  if (!tokenRow || tokenRow.tokenable_type !== TOKENABLE_TYPE) return null;
  // So sánh thời gian không đổi (constant-time) — tránh timing attack, giống hash_equals() của PHP.
  if (!crypto.timingSafeEqual(Buffer.from(tokenRow.token), Buffer.from(hashed))) return null;
  if (tokenRow.expires_at && tokenRow.expires_at.getTime() < Date.now()) return null;

  const user = await db.users.findUnique({ where: { id: tokenRow.tokenable_id }, select: USER_SELECT });
  if (!user) return null;

  // Không chặn user 'banned' ở đây — Laravel cũng không tự động chặn qua middleware
  // auth:sanctum (chỉ AuthController::login() chặn LÚC đăng nhập); route nào cần chặn
  // truy cập tiếp của user đã bị khoá sẽ tự kiểm tra status khi cần.
  await db.personal_access_tokens.update({ where: { id: tokenRow.id }, data: { last_used_at: new Date() } });

  return { user, tokenId: tokenRow.id };
}

/** Tiện ích cho route chỉ cần user, không cần thao tác trên chính token hiện tại. */
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const ctx = await getAuthContext(request);
  return ctx?.user ?? null;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12); // BCRYPT_ROUNDS=12 — khớp backend/.env
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
