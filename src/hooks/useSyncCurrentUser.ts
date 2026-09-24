import { useEffect } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';

/**
 * Làm mới thông tin user đã lưu trong trình duyệt bằng dữ liệu thật từ server, mỗi lần mở dashboard.
 *
 * authStore lưu user vào localStorage lúc đăng nhập và trước đây không nơi nào tải lại. Khi admin đổi
 * role (vd người dùng → môi giới), giao diện vẫn hiện role cũ: trang Hồ sơ ghi "Người dùng" và ẩn mục
 * chứng chỉ, trong khi server đã chặn đăng tin như môi giới (khách báo 24/09).
 *
 * Lỗi mạng thì giữ nguyên dữ liệu cũ; token hết hạn / tài khoản bị xoá đã có interceptor 401 xử lý.
 */
export function useSyncCurrentUser() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    api.get('/api/v2/user/me')
      .then((response) => {
        if (!cancelled && response.data?.success && response.data.data) setUser(response.data.data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [accessToken, setUser]);
}
