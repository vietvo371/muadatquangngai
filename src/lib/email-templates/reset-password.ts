/** Template email đặt lại mật khẩu — dạng chuỗi HTML thuần, không dùng @react-email (VPS ít RAM, không cần thêm phụ thuộc cho 2 template). */
export function resetPasswordEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: 'Đặt lại mật khẩu — Muadatquangngai.com',
    html: `
<div style="font-family: -apple-system, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
  <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 16px;">Đặt lại mật khẩu</h1>
  <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
    Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản Muadatquangngai.com của bạn.
    Nhấn vào nút bên dưới để đặt mật khẩu mới. Liên kết này có hiệu lực trong <strong>60 phút</strong>.
  </p>
  <a href="${resetUrl}" style="display: inline-block; background: #1075b1; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px;">
    Đặt lại mật khẩu
  </a>
  <p style="font-size: 13px; color: #6b7280; line-height: 1.6; margin: 24px 0 0;">
    Nếu bạn không yêu cầu điều này, có thể bỏ qua email này — mật khẩu của bạn sẽ không thay đổi.
  </p>
  <p style="font-size: 12px; color: #9ca3af; line-height: 1.6; margin: 24px 0 0; word-break: break-all;">
    Hoặc dán đường dẫn này vào trình duyệt: ${resetUrl}
  </p>
</div>`.trim(),
  };
}
