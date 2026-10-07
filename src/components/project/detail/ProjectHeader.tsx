'use client';

import Link from 'next/link';
import { ChevronRight, MapPin, Share2 } from 'lucide-react';
import { shareCurrentPage } from '@/lib/share';
import { projectDistrictHref } from '@/lib/project/links';
import { projectAddress } from '@/lib/project/fields';
import type { Project } from '@/lib/project/types';
import { PROJECT_SECTION_IDS } from './ProjectSectionNav';

/** Breadcrumb trải toàn chiều ngang, nằm ngoài khung nội dung. */
export function ProjectBreadcrumb({ project }: { project: Project }) {
  const district = project.location.district;
  const districtHref = projectDistrictHref(district);

  return (
    <nav aria-label="Đường dẫn" className="border-b border-gray-100 bg-white">
      <div className="mx-auto flex max-w-[1152px] flex-wrap items-center gap-1.5 px-4 py-2.5 text-xs text-gray-500">
        <Link href="/" className="transition-colors hover:text-primary">
          Trang chủ
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/du-an" className="transition-colors hover:text-primary">
          Dự án
        </Link>
        {district && districtHref && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link href={districtHref} className="transition-colors hover:text-primary">
              {district}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="line-clamp-1 font-medium text-gray-800">{project.name}</span>
      </div>
    </nav>
  );
}

/** Tên dự án + trạng thái + địa chỉ + chia sẻ. */
export function ProjectTitle({ project }: { project: Project }) {
  const address = projectAddress(project);

  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold leading-tight text-gray-900 md:text-2xl">{project.name}</h1>
          {project.statusLabel && (
            <span className="rounded-[var(--radius-pill)] bg-primary-light px-2.5 py-0.5 text-[12px] font-semibold text-primary">
              {project.statusLabel}
            </span>
          )}
        </div>
        {address && (
          <div className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span>{address}</span>
            {/* Trước đây là href="#" không đi đâu cả; giờ nhảy tới khối Vị trí ngay trong trang. */}
            <a href={`#${PROJECT_SECTION_IDS.location}`} className="ml-1 font-medium text-primary hover:underline">
              Xem bản đồ
            </a>
          </div>
        )}
      </div>
      {/* Đã bỏ nút "Lưu": nó chỉ đổi màu trái tim trong trình duyệt, không lưu vào đâu cả —
            F5 là mất, sang máy khác cũng không thấy. Có tính năng lưu dự án thật thì thêm lại. */}
      <button
        type="button"
        onClick={() => shareCurrentPage(project.name)}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Chia sẻ</span>
      </button>
    </div>
  );
}
