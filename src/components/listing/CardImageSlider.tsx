'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';

const SWIPE_THRESHOLD_PX = 40;

/**
 * Khu ảnh trượt dùng chung cho thẻ nổi bật và thẻ lưới (khách yêu cầu 23/09: thẻ từ #2 trở đi
 * cũng lướt được ảnh và hiện số ảnh như thẻ #1). Nút Prev/Next overlay, vuốt trên màn cảm ứng,
 * bộ đếm "1/24" góc dưới phải; mọi nút chặn sự kiện để không kích hoạt Link bao ngoài.
 * `withThumbs`: thêm 2 ảnh nhỏ bên dưới là hai ảnh kế tiếp, bấm để nhảy thẳng.
 */
export function CardImageSlider({
  images,
  alt,
  withThumbs = false,
  frameClassName = 'aspect-[4/3]',
}: {
  images: string[];
  alt: string;
  /** Thẻ nổi bật hiện thêm 2 ảnh nhỏ bên dưới (khi có từ 3 ảnh); thẻ lưới thì không. */
  withThumbs?: boolean;
  /** Tỉ lệ / chiều cao khung ảnh lớn. */
  frameClassName?: string;
}) {
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const count = images.length;
  const hasMany = count > 1;
  const showThumbs = withThumbs && count >= 3;

  const go = useCallback(
    (delta: number) => {
      if (count === 0) return;
      setIdx((i) => (i + delta + count) % count);
    },
    [count]
  );

  const stop = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    e.preventDefault();
    go(dx < 0 ? 1 : -1);
  };

  const thumbs = showThumbs ? [1, 2].map((k) => (idx + k) % count) : [];

  return (
    <div className={`grid h-full gap-1 ${showThumbs ? 'grid-rows-[minmax(0,2fr)_minmax(0,1fr)]' : ''}`}>
      <div
        className={`relative overflow-hidden touch-pan-y ${frameClassName}`}
        onTouchStart={hasMany ? onTouchStart : undefined}
        onTouchEnd={hasMany ? onTouchEnd : undefined}
      >
        {count === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs uppercase text-gray-400">Không có ảnh</span>
          </div>
        ) : (
          <div
            className="absolute inset-0 flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${idx * 100}%)` }}
          >
            {images.map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={src}
                alt={i === 0 ? alt : ''}
                referrerPolicy="no-referrer"
                loading={i === 0 ? undefined : 'lazy'}
                draggable={false}
                className="h-full w-full shrink-0 object-cover"
              />
            ))}
          </div>
        )}

        {hasMany && (
          <>
            <button
              type="button"
              onClick={(e) => { stop(e); go(-1); }}
              aria-label="Ảnh trước"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-gray-800 shadow-md transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { stop(e); go(1); }}
              aria-label="Ảnh sau"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-gray-800 shadow-md transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {count > 0 && (
          <div
            data-testid="image-counter"
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white"
          >
            <Camera className="h-3 w-3" />
            {idx + 1}/{count}
          </div>
        )}
      </div>

      {showThumbs && (
        <div className="grid grid-cols-2 gap-1 min-h-[80px]">
          {thumbs.map((imageIndex, k) => (
            <button
              type="button"
              key={`${imageIndex}-${k}`}
              onClick={(e) => { stop(e); setIdx(imageIndex); }}
              aria-label={`Xem ảnh ${imageIndex + 1}`}
              className="relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <img
                src={images[imageIndex]}
                alt=""
                referrerPolicy="no-referrer"
                loading="lazy"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
