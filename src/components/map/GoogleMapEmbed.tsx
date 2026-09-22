'use client';

import { ExternalLink, MapPinOff } from 'lucide-react';
import { googleMapEmbedUrl, googleMapsPlaceUrl, hasUsableCoords } from '@/lib/google-embed';

interface GoogleMapEmbedProps {
  latitude?: number | null;
  longitude?: number | null;
  zoom?: number;
  /** Lớp CSS cho khung ngoài — nơi gọi tự quyết chiều cao. */
  className?: string;
  /** Ẩn dòng "Mở trên Google Maps" khi khung quá nhỏ. */
  showOpenLink?: boolean;
}

/**
 * Bản đồ Google CHỈ XEM cho trang chi tiết, nhúng bằng iframe không cần API key
 * (xem `src/lib/google-embed.ts` để biết vì sao và đánh đổi là gì).
 *
 * Thay cho bản đồ Goong một điểm trước đây: khách yêu cầu đích danh Google Maps, và bản nhúng
 * Google hiện luôn tên chợ / siêu thị / trường học quanh đó — đáp ứng phần "thông tin khu vực
 * xung quanh" ở mức nhìn thấy mà không tốn một đồng nào.
 *
 * Trang DANH SÁCH vẫn dùng Goong (`PropertyMapView`) vì ở đó cần nhiều marker giá và đồng bộ
 * hai chiều với danh sách — iframe không làm được.
 */
export function GoogleMapEmbed({
  latitude,
  longitude,
  zoom = 16,
  className = '',
  showOpenLink = true,
}: GoogleMapEmbedProps) {
  if (!hasUsableCoords(latitude, longitude)) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-50 text-center px-4 ${className}`}>
        <MapPinOff className="h-6 w-6 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Tin đăng này chưa ghim vị trí trên bản đồ.</p>
      </div>
    );
  }

  const lat = latitude as number;
  const lng = longitude as number;

  return (
    <div className={`relative ${className}`}>
      <iframe
        title="Bản đồ vị trí bất động sản trên Google Maps"
        src={googleMapEmbedUrl(lat, lng, zoom)}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full border-0"
      />
      {showOpenLink && (
        <a
          href={googleMapsPlaceUrl(lat, lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-[12px] font-semibold text-gray-800 shadow-md backdrop-blur-sm transition-colors hover:bg-white hover:text-primary"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Mở trên Google Maps
        </a>
      )}
    </div>
  );
}
