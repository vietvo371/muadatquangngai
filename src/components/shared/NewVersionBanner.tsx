'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Nhắc tải lại trang khi máy chủ đã deploy bản mới.
 *
 * Vấn đề thật trên production: sau mỗi lần deploy, tab mở từ trước vẫn dùng mã Server Action của
 * bản cũ — người dùng bấm nút thì thao tác KHÔNG chạy và không hiện lỗi gì (log máy chủ ghi
 * "Failed to find Server Action"). Thay vì để họ bấm mãi, hiện thanh nhắc tải lại.
 */

const POLL_MS = 5 * 60 * 1000;

export function NewVersionBanner() {
  const [outdated, setOutdated] = useState(false);
  const [baseline, setBaseline] = useState<string | null>(null);

  const check = useCallback(async () => {
    try {
      const res = await fetch('/api/v2/build-id', { cache: 'no-store' });
      const data = (await res.json()) as { build_id?: string };
      const id = data?.build_id;
      if (!id) return; // không xác định được thì im lặng, tránh báo nhầm

      setBaseline((prev) => {
        if (prev === null) return id;
        if (prev !== id) setOutdated(true);
        return prev;
      });
    } catch {
      // Mất mạng/lỗi tạm thời — không phải dấu hiệu có bản mới.
    }
  }, []);

  useEffect(() => {
    check();
    const timer = setInterval(check, POLL_MS);
    // Kiểm tra thêm mỗi khi người dùng quay lại tab: đây là lúc hay xảy ra "tab để lâu rồi bấm".
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [check]);

  if (!outdated) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] max-w-[calc(100vw-2rem)]">
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-white px-4 py-3 shadow-lg">
        <RefreshCw className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm text-gray-700">
          Đã có phiên bản mới. Hãy tải lại trang để thao tác hoạt động đúng.
        </span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="shrink-0 h-9 px-4 rounded-lg bg-primary text-white text-sm font-bold"
        >
          Tải lại
        </button>
      </div>
    </div>
  );
}
