'use client';

import { useState, useEffect } from 'react';
import { Camera, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface HeroGalleryProps {
  images: string[];
}

export function HeroGallery({ images }: HeroGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Swipe gesture states
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen || !images || images.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
      else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev + 1) % images.length);
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling when gallery is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, images]);

  if (!images || images.length === 0) return null;

  const extraCount = images.length - 3; // Excluding main + first 2 thumbnails shown on grid

  const handleOpen = (index: number) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  // Touch handlers for mobile swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      setActiveIndex((prev) => (prev + 1) % images.length);
    } else if (isRightSwipe) {
      setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden mb-8 h-[300px] sm:h-[400px] md:h-[480px]">
        {/* Changed grid-cols-[2fr_1fr] to md:grid-cols-[2fr_1fr] to make it single-column on mobile */}
        <div className={`grid h-full gap-2 ${images.length > 1 ? 'grid-cols-1 md:grid-cols-[2fr_1fr]' : 'grid-cols-1'}`}>
          {/* Main large image */}
          <div 
            onClick={() => handleOpen(0)}
            className="relative h-full group cursor-pointer bg-gray-100 overflow-hidden"
          >
            <Image
              src={images[0]}
              alt="Main image"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority
            />
          </div>

          {/* Right side: 2 grid thumbnails */}
          {images.length > 1 && (
            <div className="hidden md:grid grid-rows-2 gap-2 h-full">
              {[1, 2].map((idx) => {
                const img = images[idx];
                if (!img) return <div key={idx} className="bg-gray-100 h-full" />;
                const isLast = idx === 2 && extraCount > 0;
                return (
                  <div 
                    key={idx} 
                    onClick={() => handleOpen(idx)}
                    className="relative group cursor-pointer overflow-hidden bg-gray-100 h-full"
                  >
                    <Image
                      src={img}
                      alt={`Image ${idx + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {isLast && (
                      <div className="absolute inset-0 bg-black/55 flex items-center justify-center transition-colors group-hover:bg-black/40">
                        <span className="text-white font-bold text-[18px]">+{extraCount} ảnh</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button 
          onClick={() => handleOpen(0)}
          className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-[13px] shadow-sm flex items-center gap-2 transition-all hover:shadow-md active:scale-95"
        >
          <Camera className="w-4 h-4 text-primary" />
          Xem tất cả {images.length} ảnh
        </button>
      </div>

      {/* ══ GALLERY LIGHTBOX MODAL ══ */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col justify-between p-4 select-none animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto z-10 pt-2">
            <span className="text-white/80 text-sm font-semibold tracking-wider">
              {activeIndex + 1} / {images.length}
            </span>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-full"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex items-center justify-center w-full max-w-7xl mx-auto flex-1 my-4 relative">
            
            {/* Main Center Image Container with absolute overlay navigation and swipe gestures */}
            <div 
              className="relative flex-1 max-w-5xl h-[65vh] md:h-[75vh] flex items-center justify-center mx-2 group/slider"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Left Overlay Button */}
              <button
                onClick={handlePrev}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-black/50 hover:bg-black/75 text-white p-2.5 md:p-3.5 rounded-full transition-all hover:scale-105 active:scale-95 z-20 shadow-lg border border-white/10"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 h-6" />
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[activeIndex]}
                alt={`Slide ${activeIndex + 1}`}
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
              />

              {/* Right Overlay Button */}
              <button
                onClick={handleNext}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-black/50 hover:bg-black/75 text-white p-2.5 md:p-3.5 rounded-full transition-all hover:scale-105 active:scale-95 z-20 shadow-lg border border-white/10"
                aria-label="Ảnh sau"
              >
                <ChevronRight className="w-5 h-5 md:w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Bottom Thumbnails & Swipe Indicators */}
          <div className="w-full max-w-4xl mx-auto z-10 pb-2">
            {/* Swipe hint for mobile */}
            <div className="md:hidden flex justify-center items-center px-4 mb-2">
              <span className="text-[12px] text-white/40 font-medium text-center">
                Vuốt sang trái/phải hoặc dùng nút để chuyển ảnh
              </span>
            </div>

            {/* Desktop Thumbnails */}
            <div className="hidden md:flex justify-center gap-2.5 overflow-x-auto py-2 max-w-full scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(idx);
                  }}
                  className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === activeIndex 
                      ? 'border-[#1075b1] scale-105 shadow-md' 
                      : 'border-transparent opacity-50 hover:opacity-90'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
