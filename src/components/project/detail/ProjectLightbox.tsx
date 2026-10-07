'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/** Xem ảnh toàn màn hình. Nạp động từ ProjectGallery — chỉ tải khi mở. */
export function ProjectLightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const count = images.length;
  const prev = () => setIndex((i) => (i - 1 + count) % count);
  const next = () => setIndex((i) => (i + 1) % count);

  // Phím mũi tên chuyển ảnh, Esc đóng — như mọi trình xem ảnh khác.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + count) % count);
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh dự án"
      className="fixed inset-0 z-[9999] flex select-none flex-col justify-between bg-black/95 p-4"
      onClick={onClose}
    >
      <div className="z-10 mx-auto flex w-full max-w-7xl items-center justify-between pt-2">
        <span className="text-sm font-semibold tracking-wider text-white/80">
          {index + 1} / {count}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/10 p-2.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative mx-auto my-4 flex w-full max-w-7xl flex-1 items-center justify-center">
        <div
          className="relative mx-2 flex h-[65vh] max-w-5xl flex-1 items-center justify-center md:h-[75vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {count > 1 && (
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-black/50 p-2.5 text-white transition-all hover:bg-black/75 md:left-4 md:p-3.5"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[index]}
            alt={`Ảnh ${index + 1}`}
            referrerPolicy="no-referrer"
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
          />
          {count > 1 && (
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-black/50 p-2.5 text-white transition-all hover:bg-black/75 md:right-4 md:p-3.5"
              aria-label="Ảnh sau"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          )}
        </div>
      </div>

      {count > 1 && (
        <div className="z-10 mx-auto w-full max-w-4xl pb-2">
          <div className="hidden max-w-full justify-center gap-2.5 overflow-x-auto py-2 md:flex">
            {images.map((img, i) => (
              <button
                key={img}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
                className={`relative h-14 w-20 overflow-hidden rounded-lg border-2 transition-all ${
                  i === index ? 'scale-105 border-primary shadow-md' : 'border-transparent opacity-50 hover:opacity-90'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`Ảnh nhỏ ${i + 1}`} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
