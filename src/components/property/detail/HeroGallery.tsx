'use client';
import { Camera } from 'lucide-react';
import Image from 'next/image';

interface HeroGalleryProps {
  images: string[];
}

export function HeroGallery({ images }: HeroGalleryProps) {
  if (!images || images.length === 0) return null;

  const extraCount = images.length - 4;

  return (
    <div className="relative rounded-2xl overflow-hidden mb-8 h-[300px] sm:h-[400px] md:h-[480px]">
      <div className={`grid h-full gap-2 ${images.length > 1 ? 'grid-cols-[2fr_1fr]' : 'grid-cols-1'}`}>
        {/* Main large image */}
        <div className="relative h-full group cursor-pointer bg-gray-100 overflow-hidden">
          <Image
            src={images[0]}
            alt="Main image"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            priority
          />
        </div>

        {/* Right side: 2x2 grid of thumbnails */}
        {images.length > 1 && (
          <div className="hidden md:grid grid-rows-2 gap-2 h-full">
            {[1, 2].map((idx) => {
              const img = images[idx];
              if (!img) return <div key={idx} className="bg-gray-100 h-full" />;
              const isLast = idx === 2 && extraCount > 0;
              return (
                <div key={idx} className="relative group cursor-pointer overflow-hidden bg-gray-100 h-full">
                  <Image
                    src={img}
                    alt={`Image ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {isLast && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-[18px]">+{extraCount}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-medium text-[13px] shadow-sm flex items-center gap-2 transition-colors">
        <Camera className="w-4 h-4" />
        Xem tất cả {images.length} ảnh
      </button>
    </div>
  );
}
