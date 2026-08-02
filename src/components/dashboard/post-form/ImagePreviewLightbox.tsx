'use client';

import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImagePreviewLightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

/**
 * Xem trước ảnh đã tải lên dạng gallery (feedback I.10) — bản rút gọn của phần lightbox
 * trong `HeroGallery.tsx` (trang chi tiết), chỉ giữ phần modal prev/next/Esc/đếm x/N.
 * KHÔNG sửa `HeroGallery.tsx` gốc vì component đó đang chạy thật ở trang chi tiết và tự
 * quản lý state riêng, không nhận prop điều khiển từ ngoài — tách file mới an toàn hơn.
 */
export function ImagePreviewLightbox({ images, initialIndex, onClose }: ImagePreviewLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (images.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') setActiveIndex((prev) => (prev + 1) % images.length);
      else if (e.key === 'ArrowLeft') setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [images.length, onClose]);

  if (images.length === 0) return null;

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col justify-between p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto z-10 pt-2">
        <span className="text-white/80 text-sm font-semibold tracking-wider">
          {activeIndex + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-full"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-center w-full max-w-7xl mx-auto flex-1 my-4 relative">
        <div
          className="relative flex-1 max-w-5xl h-[65vh] md:h-[75vh] flex items-center justify-center mx-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={goPrev}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-black/50 hover:bg-black/75 text-white p-2.5 md:p-3.5 rounded-full transition-all hover:scale-105 active:scale-95 z-20 shadow-lg border border-white/10"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[activeIndex]}
            alt={`Ảnh ${activeIndex + 1}`}
            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
          />

          <button
            onClick={goNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-black/50 hover:bg-black/75 text-white p-2.5 md:p-3.5 rounded-full transition-all hover:scale-105 active:scale-95 z-20 shadow-lg border border-white/10"
            aria-label="Ảnh sau"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto z-10 pb-2">
        <div className="hidden md:flex justify-center gap-2.5 overflow-x-auto py-2 max-w-full scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(idx);
              }}
              className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                idx === activeIndex ? 'border-[#1075b1] scale-105 shadow-md' : 'border-transparent opacity-50 hover:opacity-90'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
