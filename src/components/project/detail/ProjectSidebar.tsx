'use client';

import Image from 'next/image';
import { Phone } from 'lucide-react';
import { projectPriceLabel, projectSidebarRows } from '@/lib/project/fields';
import type { Project } from '@/lib/project/types';

/**
 * Cột phải: thẻ liên hệ + thẻ thông tin.
 *
 * Thẻ liên hệ chỉ hiện người phụ trách THẬT. Trước đây thiếu dữ liệu là hiện "Nguyễn Văn Việt"
 * — một cái tên không liên quan tới dự án. Không có người phụ trách thì vẫn có nút gửi yêu cầu
 * (lead đi tới người tạo dự án), chỉ không hiện tên ai.
 */
export function ProjectSidebar({ project, onContact }: { project: Project; onContact: () => void }) {
  const rows = projectSidebarRows(project);
  const price = projectPriceLabel(project);
  const contact = project.contact;

  return (
    <aside className="sticky top-[76px] hidden w-72 shrink-0 self-start lg:block xl:w-80">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-gray-100 bg-white">
          <div className="bg-primary px-5 py-4">
            <p className="text-sm font-semibold text-white">Liên hệ tư vấn</p>
            <p className="mt-0.5 text-xs text-white/80">Nhận thông tin chi tiết về dự án</p>
          </div>
          <div className="space-y-3 p-4">
            {contact && (
              <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-bold text-primary">
                  {contact.avatar ? (
                    <Image src={contact.avatar} alt={contact.name} fill className="object-cover" sizes="40px" />
                  ) : (
                    contact.name.trim().split(/\s+/).pop()?.charAt(0)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">{contact.name}</p>
                  <p className="text-xs text-gray-400">{contact.role === 'agent' ? 'Môi giới phụ trách' : 'Phụ trách dự án'}</p>
                </div>
              </div>
            )}
            {contact?.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-light"
              >
                <Phone className="h-4 w-4" />
                {contact.phone}
              </a>
            )}
            <button
              type="button"
              onClick={onContact}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Gửi yêu cầu tư vấn
            </button>
          </div>
        </div>

        {(rows.length > 0 || price) && (
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-gray-100 bg-white">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
              <div className="h-4 w-1 rounded-full bg-primary" />
              <h3 className="text-sm font-semibold text-gray-800">Thông tin dự án</h3>
            </div>
            <dl className="space-y-3 px-4 py-3 text-sm">
              {rows.map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="shrink-0 text-gray-400">{label}</dt>
                  <dd className="text-right font-medium text-gray-800">{value}</dd>
                </div>
              ))}
              {price && (
                <div className="border-t border-gray-50 pt-3">
                  <dt className="mb-1.5 text-gray-400">Khoảng giá</dt>
                  <dd className="text-base font-bold text-primary">{price}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </aside>
  );
}

/** Thanh liên hệ cố định ở đáy màn hình trên điện thoại (cột phải bị ẩn). */
export function ProjectMobileCta({ project, onContact }: { project: Project; onContact: () => void }) {
  const price = projectPriceLabel(project);
  const phone = project.contact?.phone;
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-3 border-t border-gray-200 bg-white px-4 py-3 lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-gray-800">{project.name}</p>
          {price && <p className="text-xs font-bold text-primary">{price}</p>}
        </div>
        {phone && (
          <a
            href={`tel:${phone}`}
            aria-label={`Gọi ${phone}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary text-primary"
          >
            <Phone className="h-4 w-4" />
          </a>
        )}
        <button
          type="button"
          onClick={onContact}
          className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          Liên hệ
        </button>
      </div>
      <div className="h-20 lg:hidden" />
    </>
  );
}
