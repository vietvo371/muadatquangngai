'use client';

import { useEffect, useState } from 'react';
import { Loader2, MapPinOff } from 'lucide-react';

interface StreetViewPreviewProps {
  latitude?: number;
  longitude?: number;
}

type ViewState = 'idle' | 'loading' | 'ok' | 'unavailable';

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

/**
 * Nhúng Google Street View tại toạ độ BĐS. Trước khi nhúng, gọi Street View metadata để
 * biết khu vực có ảnh hay không — tránh nhúng một khung xám vô hồn ở nơi Google chưa chụp.
 *
 * Mọi trường hợp không nhúng được (chưa ghim toạ độ, thiếu API key, tài khoản Google bị chặn
 * billing ở VN trả REQUEST_DENIED, ZERO_RESULTS, hay lỗi mạng/CORS) đều quy về một trạng thái
 * "unavailable" hiển thị thông báo gọn — KHÔNG để lộ lỗi kỹ thuật, KHÔNG crash.
 */
export function StreetViewPreview({ latitude, longitude }: StreetViewPreviewProps) {
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
  const [state, setState] = useState<ViewState>('idle');

  useEffect(() => {
    if (!hasCoords || !GOOGLE_MAPS_KEY) {
      setState('unavailable');
      return;
    }

    let cancelled = false;
    setState('loading');

    const url =
      `https://maps.googleapis.com/maps/api/streetview/metadata` +
      `?location=${latitude},${longitude}&key=${GOOGLE_MAPS_KEY}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setState(data?.status === 'OK' ? 'ok' : 'unavailable');
      })
      .catch(() => {
        // REQUEST_DENIED do billing, CORS, mất mạng... — đều xử lý như không hỗ trợ.
        if (!cancelled) setState('unavailable');
      });

    return () => {
      cancelled = true;
    };
  }, [hasCoords, latitude, longitude]);

  if (state === 'loading') {
    return (
      <div className="aspect-video w-full rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Đang kiểm tra Street View...
      </div>
    );
  }

  if (state === 'ok') {
    const embedUrl =
      `https://www.google.com/maps/embed/v1/streetview` +
      `?key=${GOOGLE_MAPS_KEY}&location=${latitude},${longitude}`;
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200">
        <iframe
          title="Google Street View"
          src={embedUrl}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0"
        />
      </div>
    );
  }

  // idle + unavailable → cùng một thông báo gọn trong khung xám.
  return (
    <div className="aspect-video w-full rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-center px-4">
      <MapPinOff className="h-6 w-6 text-gray-400 mb-2" />
      <p className="text-sm text-gray-500">
        {hasCoords
          ? 'Khu vực này chưa hỗ trợ Street View.'
          : 'Hãy ghim vị trí trên bản đồ để xem Street View.'}
      </p>
    </div>
  );
}
