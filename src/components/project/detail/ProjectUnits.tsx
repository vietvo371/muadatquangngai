'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ImageOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState, UnitStatusBadge } from '@/components/shared';
import { ListingPagination } from '@/components/listing/ListingPagination';
import { formatArea, formatMoney } from '@/lib/display-format';
import { timeAgo } from '@/lib/formatters';
import { urlParam, useUrlState } from '@/hooks/useUrlState';
import { UNITS_PER_PAGE, useProjectUnits } from '@/hooks/useProjectDetail';
import type { Project, Unit } from '@/lib/project/types';
import { PROJECT_SECTION_IDS } from './ProjectSectionNav';

/** Trang của danh sách căn lưu trên URL (?trang=2) — F5 hay gửi link vẫn đúng trang. */
const URL_PARAMS = { page: urlParam.page('trang') };

function unitPrice(u: Unit): string {
  if (u.priceUnit === 'negotiable' || u.price === null) return 'Thoả thuận';
  const money = formatMoney(u.price);
  if (!money) return 'Thoả thuận';
  if (u.priceUnit === 'per_m2') return `${money}/m²`;
  if (u.priceUnit === 'per_month') return `${money}/tháng`;
  return money;
}

function UnitRow({ unit }: { unit: Unit }) {
  const meta = [formatArea(unit.area), unit.district, unit.publishedAt ? timeAgo(unit.publishedAt) : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <Link href={unit.href} className="group flex gap-3 p-4 transition-colors hover:bg-gray-50">
      <div className="relative h-[72px] w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {unit.thumbnail ? (
          <Image src={unit.thumbnail} alt={unit.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="96px" />
        ) : (
          <ImageOff className="absolute inset-0 m-auto h-5 w-5 text-gray-300" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 line-clamp-2 text-sm font-medium leading-snug text-gray-800 transition-colors group-hover:text-primary">
          {unit.title}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-primary">{unitPrice(unit)}</span>
          <UnitStatusBadge status={unit.status} />
        </div>
        {meta && <p className="mt-0.5 text-xs text-gray-400">{meta}</p>}
      </div>
    </Link>
  );
}

/** Căn/lô đang rao bán thuộc dự án — lấy từ tin đăng thật có gắn dự án. */
export function ProjectUnits({ project }: { project: Project }) {
  const [{ page }, setUrl] = useUrlState(URL_PARAMS);
  const { state, reload } = useProjectUnits(project.id, page);

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-gray-100 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
        <div className="h-4 w-1 rounded-full bg-primary" />
        <h2 className="text-sm font-bold text-gray-900">
          {project.unitWord === 'lô' ? 'Lô đang mở bán' : 'Căn đang mở bán'} tại {project.name}
        </h2>
        {state.status === 'ready' && state.pagination.total > 0 && (
          <span className="text-[13px] text-gray-400">({state.pagination.total})</span>
        )}
      </div>

      {state.status === 'loading' && (
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex gap-3 p-4">
              <Skeleton className="h-[72px] w-24 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div className="p-4">
          <ErrorState error={state.error} onRetry={reload} compact />
        </div>
      )}

      {state.status === 'ready' && state.units.length === 0 && (
        <EmptyState
          className="py-10"
          title={`Chưa có tin rao bán nào tại ${project.name}`}
          description="Khi có tin đăng gắn với dự án này, chúng sẽ hiện ở đây."
        />
      )}

      {state.status === 'ready' && state.units.length > 0 && (
        <>
          <div className="divide-y divide-gray-50">
            {state.units.map((u) => (
              <UnitRow key={u.id} unit={u} />
            ))}
          </div>
          {state.pagination.lastPage > 1 && (
            <div className="border-t border-gray-100 px-4 pb-4">
              <ListingPagination
                currentPage={state.pagination.page}
                lastPage={state.pagination.lastPage}
                total={state.pagination.total}
                perPage={UNITS_PER_PAGE}
                onChange={(next) => {
                  setUrl({ page: next });
                  document.getElementById(PROJECT_SECTION_IDS.units)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
