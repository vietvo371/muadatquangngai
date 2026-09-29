import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isAxiosError } from 'axios';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';

/** Không gọi lại /me dày hơn mức này khi người dùng chuyển trang / quay lại tab liên tục. */
const MIN_SYNC_INTERVAL_MS = 30 * 1000;
let lastSyncedAt = 0;
let lastSyncedToken: string | null = null;

/**
 * Làm mới thông tin user lưu trong trình duyệt bằng dữ liệu thật từ server (Notion 29/09 "Frontend –
 * Role State", "Data Binding Role").
 *
 * authStore lưu user vào localStorage lúc đăng nhập. Khi admin đổi role, server áp quyền mới ngay
 * (token không chứa role) nhưng giao diện vẫn hiện role cũ cho tới khi tải lại hồ sơ. Hook này chạy ở
 * Providers — mọi trang: lúc mở trang, khi chuyển trang và khi quay lại tab. Role đổi thì xoá cache
 * truy vấn để các khối phụ thuộc role (huy hiệu xác thực, điều kiện đăng tin...) tải lại.
 *
 * Lỗi mạng thì giữ nguyên dữ liệu cũ.
 */
export function useSyncCurrentUser() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const pathname = usePathname();

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    const sync = async () => {
      const sameSession = lastSyncedToken === accessToken;
      if (sameSession && Date.now() - lastSyncedAt < MIN_SYNC_INTERVAL_MS) return;
      lastSyncedAt = Date.now();
      lastSyncedToken = accessToken;
      try {
        const response = await api.get('/api/v2/user/me', { skipAuthRedirect: true });
        const fresh = response.data?.success ? response.data.data : null;
        if (cancelled || !fresh) return;
        const previousRole = useAuthStore.getState().user?.role;
        setUser(fresh);
        if (previousRole && previousRole !== fresh.role) queryClient.invalidateQueries();
      } catch (error) {
        // Phiên bị thu hồi (tài khoản bị khoá / xoá, token hết hạn): đăng xuất phía trình duyệt. Chỉ
        // đưa về trang đăng nhập khi đang ở khu cần đăng nhập — trang công khai vẫn xem tiếp được.
        if (cancelled || !isAxiosError(error) || error.response?.status !== 401) return;
        logout();
        if (/^\/(dashboard|admin)(\/|$)/.test(window.location.pathname)) window.location.href = '/login';
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    sync();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [accessToken, setUser, logout, queryClient, pathname]);
}

/** Component rỗng để gắn hook vào cây Providers (client). */
export function CurrentUserSync() {
  useSyncCurrentUser();
  return null;
}
