'use client';

import { ExternalLink, MapPinOff } from 'lucide-react';
import { googleStreetViewEmbedUrl, googleStreetViewPageUrl, hasUsableCoords } from '@/lib/google-embed';

interface GoogleStreetViewEmbedProps {
  latitude?: number | null;
  longitude?: number | null;
  /** Lớp CSS cho khung ảnh — nơi gọi tự quyết chiều cao. */
  frameClassName?: string;
  /** Câu hiện khi tin chưa có toạ độ (form đăng tin và trang chi tiết nói khác nhau). */
  missingCoordsText?: string;
  /** Ẩn dòng giải thích khi khung nằm trong chỗ chật. */
  showNote?: boolean;
}

/**
 * Ảnh đường phố Google tại toạ độ bất động sản, nhúng không cần API key
 * (xem `src/lib/google-embed.ts`).
 *
 * Chỗ Google chưa chụp ảnh thì chính Google hiện "Không có sẵn Chế độ xem phố" bằng tiếng Việt
 * ngay trong khung — trang mình không đọc được vào trong iframe nên không thay được câu chữ.
 * Vì vậy có thêm dòng chú thích bên dưới để người xem hiểu đó là giới hạn dữ liệu của Google,
 * không phải web hỏng. Muốn tự hiện đúng một câu thông báo riêng thì phải bật Street View
 * Static API rồi hỏi trước vùng phủ.
 */
export function GoogleStreetViewEmbed({
  latitude,
  longitude,
  frameClassName = 'aspect-video w-full',
  missingCoordsText = 'Tin đăng này chưa ghim vị trí nên chưa xem được ảnh đường phố.',
  showNote = true,
}: GoogleStreetViewEmbedProps) {
  if (!hasUsableCoords(latitude, longitude)) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-center ${frameClassName}`}
      >
        <MapPinOff className="mb-2 h-6 w-6 text-gray-400" />
        <p className="text-sm text-gray-500">{missingCoordsText}</p>
      </div>
    );
  }

  const lat = latitude as number;
  const lng = longitude as number;

  return (
    <div className="space-y-2">
      <div className={`overflow-hidden rounded-xl border border-gray-200 bg-gray-900 ${frameClassName}`}>
        <iframe
          title="Ảnh đường phố tại vị trí bất động sản"
          src={googleStreetViewEmbedUrl(lat, lng)}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0"
        />
      </div>
      {showNote && (
        <p className="text-[12px] leading-relaxed text-gray-500">
          Ảnh do Google chụp ngoài thực địa. Đường hẻm và khu vực nông thôn nhiều nơi Google chưa
          chụp tới, khi đó khung trên sẽ báo chưa có ảnh đường phố.{' '}
          <a
            href={googleStreetViewPageUrl(lat, lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            Mở trên Google Maps
            <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      )}
    </div>
  );
}
