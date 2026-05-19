'use client';
import { Camera } from 'lucide-react';
import Image from 'next/image';

interface HeroGalleryProps {
  images: string[];
}

export function HeroGallery({ images }: HeroGalleryProps) {
  if (!images || images.length === 0) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden mb-8 h-[300px] sm:h-[400px] md:h-[480px]">
      <div className={`grid h-full gap-2 ${images.length > 1 ? 'grid-cols-3' : 'grid-cols-1'}`}>
        <div className={`relative h-full group cursor-pointer bg-gray-100 ${images.length > 1 ? 'col-span-2' : 'col-span-1'}`}>
          <Image 
            src={images[0]} 
            alt="Main image" 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        </div>
        
        {images.length > 1 && (
          <div className="hidden md:grid grid-rows-2 gap-2 h-full col-span-1">
            <div className="relative group cursor-pointer overflow-hidden bg-gray-100 h-full">
              <Image 
                src={images[1]} 
                alt="Image 2" 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-500" 
              />
            </div>
            {images.length > 2 && (
              <div className="relative group cursor-pointer overflow-hidden bg-gray-100 h-full">
                <Image 
                  src={images[2]} 
                  alt="Image 3" 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
            )}
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
