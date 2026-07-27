'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import axios from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';

/**
 * Đích đến sau khi /api/v2/auth/oauth/google/callback redirect về — đọc access_token từ
 * URL FRAGMENT (window.location.hash, không phải query string, nên KHÔNG gọi useSearchParams)
 * rồi gọi /api/v2/auth/me để lấy đủ thông tin user trước khi đăng nhập vào authStore.
 */
export default function OAuthCallbackPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get('access_token');

    if (!accessToken) {
      router.replace('/login?error=oauth_failed');
      return;
    }

    axios
      .get('/api/v2/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((res) => {
        const user = res.data.data.user;
        login(user, accessToken);
        if (user.role === 'admin' || user.role === 'super_admin') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => {
        router.replace('/login?error=oauth_failed');
      });
  }, [router, login]);

  return (
    <div className="w-full flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-gray-500">Đang đăng nhập...</p>
    </div>
  );
}
