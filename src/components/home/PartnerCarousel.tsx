'use client';

import Image from 'next/image';

interface Partner {
  name: string;
  logo: string;
}

interface PartnerCarouselProps {
  partners: Partner[];
}

export function PartnerCarousel({ partners }: PartnerCarouselProps) {
  const doubled = [...partners, ...partners];

  return (
    <div className="relative overflow-hidden">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

      <div className="flex gap-5 animate-marquee" style={{ width: 'max-content' }}>
        {doubled.map((p, i) => (
          <div
            key={i}
            className="group relative bg-white rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer shrink-0 overflow-hidden"
            style={{ width: 180, height: 110 }}
          >
            <Image
              src={p.logo}
              alt={p.name}
              fill
              className="object-contain p-5 grayscale opacity-55 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-400"
              sizes="180px"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
