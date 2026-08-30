import { redirect } from 'next/navigation';

/**
 * Đăng nhập bằng số điện thoại — TẠM TẮT.
 *
 * Màn hình cũ có đủ ô nhập số điện thoại và ô OTP nhưng KHÔNG nối API: cả gửi OTP lẫn xác thực
 * OTP đều còn là TODO, người dùng nhập xong sẽ mắc kẹt. Chuyển hướng về đăng nhập bằng email cho
 * tới khi có dịch vụ SMS thật. Giao diện cũ giữ ở `page.tsx.disabled-otp` để dùng lại khi nối API.
 */
export default function LoginPhonePage() {
  redirect('/login');
}
