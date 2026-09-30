'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Bath,
  Bed,
  Camera,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileText,
  Images,
  LayoutPanelTop,
  Mountain,
  Play,
  Sofa,
  Sparkles,
  Trees,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

/**
 * Thanh Thumbnail Media trên trang chi tiết BĐS (Notion 29/09 "Gallery – Thumbnail Media",
 * "Thumbnail – Category/Cover Image/Overlay/Icon/Label", "Thumbnail Carousel", "Carousel
 * Navigation", "Responsive").
 *
 * Thay cho lưới ảnh 3 cột bày hết ảnh ra trang. Mỗi ô là một nhóm media: ảnh đại diện làm nền,
 * phủ tối, biểu tượng trắng ở giữa, tên + số lượng bên dưới. Bấm ô mới mở cửa sổ xem ảnh, nên
 * trang chi tiết không tải toàn bộ ảnh ngay từ đầu ("UX – Không load Grid ngoài trang").
 *
 * Nhiều ô hơn chiều rộng màn hình thì trượt ngang, có nút trái/phải; không xuống dòng, không
 * tràn ngang trang.
 */

export interface MediaThumbnail {
  /** Khoá nhóm: 'all' | 'videos' | 'tour360' | 'floorplans' | 'streetview' | mã phân loại ảnh. */
  key: string;
  label: string;
  /** Số lượng media trong nhóm; bỏ trống khi nhóm không đếm theo ảnh (vd Tour 360). */
  count?: number;
  cover?: string;
  icon: ThumbnailIconKey;
}

export type ThumbnailIconKey =
  | 'all'
  | 'video'
  | 'tour360'
  | 'floorplan'
  | 'streetview'
  | 'facade'
  | 'living_room'
  | 'bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'balcony'
  | 'view'
  | 'amenity'
  | 'legal'
  | 'other';

const ICONS: Record<ThumbnailIconKey, LucideIcon> = {
  all: Camera,
  video: Play,
  tour360: Compass,
  floorplan: LayoutPanelTop,
  streetview: Compass,
  facade: Images,
  living_room: Sofa,
  bedroom: Bed,
  kitchen: UtensilsCrossed,
  bathroom: Bath,
  balcony: Trees,
  view: Mountain,
  amenity: Sparkles,
  legal: FileText,
  other: Images,
};

interface Props {
  thumbnails: MediaThumbnail[];
  onSelect: (key: string) => void;
}

export function PropertyMediaThumbnails({ thumbnails, onSelect }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    // Trừ 1px cho sai số làm tròn khi trình duyệt phóng to/thu nhỏ.
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    window.addEventListener('resize', updateArrows);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, thumbnails.length]);

  const scrollByStep = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.8, 160), behavior: 'smooth' });
  };

  if (thumbnails.length === 0) return null;

  return (
    <div className="relative mb-8">
      <div
        ref={trackRef}
        onScroll={updateArrows}
        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-1"
      >
        {thumbnails.map((thumb) => {
          const Icon = ICONS[thumb.icon];
          return (
            <button
              key={thumb.key}
              type="button"
              onClick={() => onSelect(thumb.key)}
              className="group shrink-0 w-[120px] sm:w-[140px] text-left"
              aria-label={thumb.count != null ? `${thumb.label}, ${thumb.count} mục` : thumb.label}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-200">
                {thumb.cover && (
                  <Image
                    src={thumb.cover}
                    alt=""
                    fill
                    sizes="140px"
                    loading="lazy"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-black/45 transition-colors group-hover:bg-black/30" />
                <Icon className="absolute inset-0 m-auto h-7 w-7 text-white drop-shadow" strokeWidth={1.75} />
              </div>
              <p className="mt-2 truncate text-[13px] font-semibold text-gray-900">
                {thumb.label}
                {thumb.count != null && <span className="ml-1 font-normal text-gray-500">({thumb.count})</span>}
              </p>
            </button>
          );
        })}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByStep(-1)}
          aria-label="Xem nhóm trước"
          className="absolute left-0 top-[calc(50%-14px)] -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md ring-1 ring-gray-200 transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByStep(1)}
          aria-label="Xem nhóm tiếp theo"
          className="absolute right-0 top-[calc(50%-14px)] -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md ring-1 ring-gray-200 transition-colors hover:text-primary"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
