import { Resend } from 'resend';

// Singleton giống pattern db.ts — tránh tạo lại client khi Next.js hot-reload trong dev.
const globalForResend = globalThis as unknown as { resend?: Resend };

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || 'Muadatquangngai.com <no-reply@muadatquangngai.com>';

export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

function getResendClient(): Resend {
  return globalForResend.resend ?? (globalForResend.resend = new Resend(RESEND_API_KEY));
}

/**
 * Gửi email — trả `false` (không throw) nếu chưa cấu hình RESEND_API_KEY hoặc gửi thất bại,
 * để route gọi hàm này không crash cả request chỉ vì email lỗi (forgot-password vẫn phải
 * trả về cùng 1 thông báo chung dù gửi thành công hay không, xem route liên quan).
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.error('[email] Thiếu RESEND_API_KEY — không gửi được email tới', to);
    return false;
  }

  try {
    const { error } = await getResendClient().emails.send({ from: EMAIL_FROM, to, subject, html });
    if (error) {
      console.error('[email] Resend trả lỗi:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] Gửi email thất bại:', err instanceof Error ? err.message : err);
    return false;
  }
}
