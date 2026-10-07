'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, Ruler } from 'lucide-react';
import { formatArea, formatCount, formatMoney } from '@/lib/display-format';
import { sanitizeRichText } from '@/lib/sanitize-html';
import { projectOverviewRows, projectPriceLabel } from '@/lib/project/fields';
import type { Project } from '@/lib/project/types';

const DESC_COLLAPSED_HEIGHT = 340;

/** Đơn giá ước tính = giá thấp nhất ÷ diện tích nhỏ nhất trong các loại sản phẩm. */
function estimatedPricePerM2(project: Project): string | null {
  const areas = project.unitTypes.map((t) => t.area).filter((a): a is number => a !== null);
  if (!project.priceFrom || areas.length === 0) return null;
  const perM2 = project.priceFrom / Math.min(...areas);
  const million = perM2 / 1_000_000;
  return million < 0.1
    ? `từ ${(million * 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} nghìn/m²`
    : `từ ${million.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu/m²`;
}

/** Thông tin chung + khoảng giá + mô tả. Mỗi phần thiếu dữ liệu thì tự ẩn. */
export function ProjectOverview({ project }: { project: Project }) {
  const rows = projectOverviewRows(project);
  const priceLabel = projectPriceLabel(project);
  const perM2 = estimatedPricePerM2(project);
  const descriptionHtml = useMemo(
    () => (project.descriptionHtml ? sanitizeRichText(project.descriptionHtml) : null),
    [project.descriptionHtml]
  );

  const descRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    if (descRef.current) setOverflows(descRef.current.scrollHeight > DESC_COLLAPSED_HEIGHT + 20);
  }, [descriptionHtml]);

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-gray-900">Tổng quan {project.name}</h2>

      {rows.length > 0 && (
        <dl className="grid grid-cols-1 gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-start gap-2">
              <dt className="w-28 shrink-0 text-gray-400">{label}</dt>
              <dd className="font-medium text-gray-800">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {(priceLabel || perM2) && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-card)] border border-gray-100 bg-gray-50 p-4">
          {priceLabel && (
            <div>
              <p className="mb-1 text-xs text-gray-400">Khoảng giá dự kiến</p>
              <p className="text-xl font-bold text-primary">{priceLabel}</p>
            </div>
          )}
          {perM2 && (
            <div className="text-right">
              <p className="mb-1 text-xs text-gray-400">Đơn giá ước tính</p>
              <p className="text-sm font-bold text-gray-800">{perM2}</p>
            </div>
          )}
        </div>
      )}

      {descriptionHtml && (
        <div>
          <div className="relative">
            <div
              ref={descRef}
              className={`overflow-hidden whitespace-pre-line text-sm leading-relaxed text-gray-600 transition-[max-height] duration-300 [&_a]:text-primary [&_a]:underline [&_h2]:mb-1.5 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 [&_h3]:mb-1 [&_h3]:mt-2.5 [&_h3]:text-[15px] [&_h3]:font-bold [&_h3]:text-gray-900 [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 ${
                !expanded && overflows ? 'max-h-[340px]' : 'max-h-none'
              }`}
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
            {!expanded && overflows && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
            )}
          </div>
          {overflows && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-sm font-semibold text-primary hover:underline"
            >
              {expanded ? 'Thu gọn' : 'Xem thêm'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Danh sách tiện ích dự án. Không có thì ẩn — không tự liệt kê "Hồ bơi, Gym..." như trước. */
export function ProjectUtilities({ utilities }: { utilities: string[] }) {
  if (utilities.length === 0) return null;
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-gray-900">Tiện ích dự án</h3>
      <div className="flex flex-wrap gap-2">
        {utilities.map((u) => (
          <span key={u} className="flex items-center gap-1.5 rounded-lg bg-primary-light px-3 py-1.5 text-xs font-medium text-primary">
            <CheckCircle className="h-3.5 w-3.5" />
            {u}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Các loại sản phẩm do admin nhập. Không có thì ẩn — trước đây trang tự sinh ra 3 loại mặt
 * bằng với diện tích, số căn và giá bịa theo công thức.
 */
export function ProjectUnitTypes({ project }: { project: Project }) {
  if (project.unitTypes.length === 0) return null;
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-gray-900">
        {project.unitWord === 'lô' ? 'Loại lô điển hình' : 'Loại căn điển hình'}
      </h3>
      <div className="divide-y divide-gray-50 overflow-hidden rounded-[var(--radius-card)] border border-gray-100">
        {project.unitTypes.map((t) => {
          const meta = [formatArea(t.area), formatCount(t.count, project.unitWord)].filter(Boolean).join(' · ');
          const price = formatMoney(t.priceFrom);
          return (
            <div key={t.name} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Ruler className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                  {meta && <p className="text-xs text-gray-400">{meta}</p>}
                </div>
              </div>
              {price && <p className="text-sm font-bold text-primary">Từ {price}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
