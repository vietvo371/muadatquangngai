'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NewsItem {
  id: number;
  title: string;
  category: string;
  date: string;
  image: string;
  href: string;
}

interface NewsCarouselProps {
  items: NewsItem[];
}

export function NewsCarousel({ items }: NewsCarouselProps) {
  const [offset, setOffset] = useState(0);
  const visibleCount = 4; // shown at once on desktop
  const maxOffset = Math.max(0, items.length - visibleCount);

  const prev = () => setOffset((o) => Math.max(0, o - 1));
  const next = () => setOffset((o) => Math.min(maxOffset, o + 1));

  return (
    <div className="relative">
      {/* Track */}
      <div className="overflow-hidden">
        <div
          className="flex gap-4 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(calc(-${offset} * (100% / ${visibleCount}) - ${offset} * 1rem))` }}
        >
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group flex-none w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.75rem)] lg:w-[calc(25%-0.75rem)] flex flex-col"
            >
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-3 shadow-sm">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                  {item.category}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mb-1">{item.date}</p>
              <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>

      {/* Arrows */}
      <button
        onClick={prev}
        disabled={offset === 0}
        className="absolute -left-4 top-[calc(50%-32px)] -translate-y-1/2 h-9 w-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
        aria-label="Trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={next}
        disabled={offset >= maxOffset}
        className="absolute -right-4 top-[calc(50%-32px)] -translate-y-1/2 h-9 w-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
        aria-label="Tiếp"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
