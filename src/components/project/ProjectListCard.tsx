'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Building, Calendar, Home, ImageOff, MapPin } from 'lucide-react';
import { formatArea, formatCount, formatQuarter } from '@/lib/display-format';
import { projectAddress, projectPriceLabel } from '@/lib/project/fields';
import type { Project } from '@/lib/project/types';

/** Mô tả dự án là HTML từ trình soạn thảo — bỏ thẻ để hiện đoạn trích bằng chữ thường. */
function plainExcerpt(html: string | null): string | null {
  if (!html) return null;
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  return text || null;
}

/**
 * Thẻ dự án trên trang danh sách. Nhận kiểu chuẩn từ Adapter; ô nào thiếu dữ liệu thì ẩn.
 *
 * Bản trước in "0 block · 0 tầng", "Bàn giao 2025" (năm bịa khi thiếu ngày), luôn ghi "căn" kể
 * cả dự án đất nền, và in nguyên thẻ HTML của mô tả ra thành chữ.
 */
export function ProjectListCard({ project }: { project: Project }) {
  const thumbnail = project.images[0] ?? null;
  const address = projectAddress(project);
  const excerpt = plainExcerpt(project.descriptionHtml);
  const price = projectPriceLabel(project);

  const scale = [formatCount(project.totalBlocks, 'block'), formatCount(project.totalFloors, 'tầng')].filter(Boolean).join(' · ');
  const units = formatCount(project.totalUnits, project.unitWord);
  const handover = formatQuarter(project.handoverDate);
  const area = formatArea(project.totalAreaHa, 'ha');

  return (
    <Link href={`/du-an/${project.slug}`}>
      <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-xl sm:flex-row">
        <div className="relative h-52 shrink-0 overflow-hidden bg-gray-100 sm:h-auto sm:w-64 md:w-72">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={project.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 288px"
            />
          ) : (
            <ImageOff className="absolute inset-0 m-auto h-8 w-8 text-gray-300" />
          )}
          {project.statusLabel && (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-primary">
              {project.statusLabel}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between gap-3 p-4 md:p-5">
          <div>
            <div className="mb-1 flex items-start justify-between gap-2">
              <h2 className="line-clamp-2 text-base font-bold leading-snug text-gray-900 transition-colors group-hover:text-primary md:text-lg">
                {project.name}
              </h2>
              {project.typeLabel && (
                <span className="mt-0.5 shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {project.typeLabel}
                </span>
              )}
            </div>
            {address && (
              <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="line-clamp-1">{address}</span>
              </div>
            )}
            {excerpt && <p className="line-clamp-2 text-sm leading-relaxed text-gray-500">{excerpt}</p>}
          </div>

          {(scale || units || handover || area) && (
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-gray-50 pt-3 text-xs text-gray-500">
              {scale && (
                <span className="flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-gray-400" />
                  {scale}
                </span>
              )}
              {units && (
                <span className="flex items-center gap-1">
                  <Home className="h-3.5 w-3.5 text-gray-400" />
                  {units}
                </span>
              )}
              {handover && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  Bàn giao {handover}
                </span>
              )}
              {area && <span className="text-gray-400">Quy mô {area}</span>}
            </div>
          )}

          {(price || project.developer) && (
            <div className="flex items-end justify-between gap-3">
              {price ? (
                <div>
                  <p className="text-xs text-gray-400">Khoảng giá</p>
                  <p className="text-base font-bold text-primary">{price}</p>
                </div>
              ) : (
                <span />
              )}
              {project.developer && (
                <p className="line-clamp-1 max-w-[160px] text-right text-xs text-gray-400">{project.developer}</p>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
