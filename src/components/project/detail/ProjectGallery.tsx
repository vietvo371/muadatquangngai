'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Building, Calendar, Home, ImageOff, LayoutGrid } from 'lucide-react';
import { formatArea, formatCount, formatQuarter } from '@/lib/display-format';
import type { Project } from '@/lib/project/types';

// Lightbox chỉ nạp khi người xem thực sự bấm mở ảnh (Notion 07/10 "chỉ load khi cần").
const ProjectLightbox = dynamic(() => import('./ProjectLightbox').then((m) => m.ProjectLightbox), { ssr: false });

/**
 * Ảnh dự án + dải thống kê nhanh.
 *
 * Dự án chưa có ảnh thì hiện khung trống có biểu tượng — KHÔNG mượn ảnh dự án khác như trước
 * (người xem tưởng đó là ảnh thật của dự án này).
 */
export function ProjectGallery({ project }: { project: Project }) {
  const images = project.images;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const stats = [
    { icon: LayoutGrid, label: 'Diện tích', value: formatArea(project.totalAreaHa, 'ha') },
    { icon: Building, label: 'Block', value: formatCount(project.totalBlocks, 'block') },
    {
      icon: Home,
      label: project.unitWord === 'lô' ? 'Lô đất' : 'Căn',
      value: formatCount(project.totalUnits, project.unitWord),
    },
    { icon: Calendar, label: 'Bàn giao', value: formatQuarter(project.handoverDate) },
  ].filter((s): s is typeof s & { value: string } => s.value !== null);

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-gray-100 bg-white">
      {images.length === 0 ? (
        <div className="flex h-[220px] flex-col items-center justify-center gap-2 bg-gray-50 text-gray-400 md:h-[300px]">
          <ImageOff className="h-8 w-8" />
          <p className="text-[13px]">Dự án chưa có hình ảnh</p>
        </div>
      ) : (
        <>
          <div className="flex h-[280px] gap-1 md:h-[360px]">
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="group relative flex-1 cursor-pointer overflow-hidden"
              aria-label="Xem ảnh lớn"
            >
              <Image
                src={images[0]}
                alt={project.name}
                fill
                referrerPolicy="no-referrer"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
              />
              {images.length > 1 && (
                <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">
                  1 / {images.length}
                </span>
              )}
            </button>
            {images.length > 1 && (
              <div className="hidden w-32 flex-col gap-1 sm:flex md:w-40">
                {images.slice(1, 4).map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setLightboxIndex(i + 1)}
                    className="group relative flex-1 cursor-pointer overflow-hidden"
                    aria-label={`Xem ảnh ${i + 2}`}
                  >
                    <Image
                      src={img}
                      alt=""
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="160px"
                    />
                    {i === 2 && images.length > 4 && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-semibold text-white">
                        +{images.length - 4}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3 sm:hidden">
              {images.map((img, i) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md"
                  aria-label={`Xem ảnh ${i + 1}`}
                >
                  <Image src={img} alt="" fill referrerPolicy="no-referrer" className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {stats.length > 0 && (
        <div
          className="grid divide-x divide-gray-100 border-t border-gray-100"
          style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
        >
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center px-2 py-3 text-center">
              <Icon className="mb-1 h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-gray-800 md:text-sm">{value}</span>
              <span className="text-[11px] text-gray-400 md:text-xs">{label}</span>
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <ProjectLightbox images={images} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  );
}
