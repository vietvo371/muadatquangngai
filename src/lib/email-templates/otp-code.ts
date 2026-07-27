/** Template email mã OTP xác thực — dùng cho email_verify (và có thể tái dùng cho các loại OTP khác qua email sau này). */
export function otpCodeEmail(code: string): { subject: string; html: string } {
  return {
    subject: `${code} là mã xác thực Muadatquangngai.com của bạn`,
    html: `
<div style="font-family: -apple-system, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
  <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 16px;">Mã xác thực của bạn</h1>
  <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
    Nhập mã dưới đây để xác thực. Mã có hiệu lực trong <strong>5 phút</strong> và chỉ dùng được một lần.
  </p>
  <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; background: #f3f4f6; color: #1075b1; padding: 16px 24px; border-radius: 8px; text-align: center; margin: 0 0 24px;">
    ${code}
  </div>
  <p style="font-size: 13px; color: #6b7280; line-height: 1.6; margin: 0;">
    Nếu bạn không yêu cầu mã này, có thể bỏ qua email — không ai truy cập được tài khoản của bạn nếu không có mã.
  </p>
</div>`.trim(),
  };
}
