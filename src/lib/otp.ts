import crypto from 'node:crypto';
import { db } from '@/lib/db';

const OTP_TTL_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_SENDS_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;

export function generateOtpCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Kiểm tra giới hạn gửi OTP cho 1 email + type: chặn gửi lại quá nhanh (chống spam bấm
 * liên tục) và giới hạn tổng số lần/giờ (chống spam gửi hàng loạt).
 */
export async function checkSendRateLimit(
  email: string,
  type: string
): Promise<{ allowed: true } | { allowed: false; reason: 'cooldown' | 'hourly_limit' }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await db.otp_codes.findMany({
    where: { email, type, created_at: { gte: oneHourAgo } },
    orderBy: { created_at: 'desc' },
    select: { created_at: true },
  });

  if (recent.length > 0) {
    const secondsSinceLast = (Date.now() - recent[0].created_at.getTime()) / 1000;
    if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) return { allowed: false, reason: 'cooldown' };
  }
  if (recent.length >= MAX_SENDS_PER_HOUR) return { allowed: false, reason: 'hourly_limit' };

  return { allowed: true };
}

export async function createOtp(email: string, type: string, userId?: bigint): Promise<string> {
  const code = generateOtpCode();
  await db.otp_codes.create({
    data: {
      email,
      type,
      code,
      user_id: userId ?? null,
      expires_at: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      created_at: new Date(),
    },
  });
  return code;
}

export type VerifyOtpResult = 'ok' | 'not_found' | 'expired' | 'too_many_attempts' | 'wrong_code';

/**
 * Xác thực mã OTP — tra bản ghi mới nhất chưa dùng của email+type, so mã, đánh dấu đã dùng
 * ngay khi khớp (chặn double-submit dùng lại cùng 1 mã 2 lần).
 */
export async function verifyOtp(email: string, type: string, code: string): Promise<VerifyOtpResult> {
  const row = await db.otp_codes.findFirst({
    where: { email, type, is_used: false },
    orderBy: { created_at: 'desc' },
  });

  if (!row) return 'not_found';
  if (row.expires_at.getTime() < Date.now()) return 'expired';
  if (row.attempts >= MAX_VERIFY_ATTEMPTS) return 'too_many_attempts';

  if (row.code !== code) {
    await db.otp_codes.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    return 'wrong_code';
  }

  // updateMany + where is_used:false thay vì update thường — chặn race-condition 2 request
  // verify cùng lúc đều pass, chỉ request nào update trước mới thực sự "thắng".
  const result = await db.otp_codes.updateMany({
    where: { id: row.id, is_used: false },
    data: { is_used: true, verified: true, used_at: new Date() },
  });

  return result.count > 0 ? 'ok' : 'not_found';
}
