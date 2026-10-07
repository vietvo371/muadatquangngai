'use client';

import { useEffect, useRef } from 'react';
import { urlParam, useUrlState } from '@/hooks/useUrlState';

/**
 * Thanh mục của trang dự án: bấm là cuộn tới mục, cuộn tới đâu thì mục đó sáng lên.
 *
 * Mục đang xem lưu trên URL (?muc=vi-tri) — gửi link cho người khác là họ mở ra đúng khối Vị
 * trí, F5 cũng giữ nguyên chỗ. Trước đây mục chỉ nằm trong state, F5 là về đầu trang.
 */

export const PROJECT_SECTION_IDS = {
  overview: 'tong-quan',
  units: 'mo-ban',
  location: 'vi-tri',
  faq: 'hoi-dap',
} as const;

export type ProjectSectionKey = keyof typeof PROJECT_SECTION_IDS;

const SECTION_VALUES = Object.values(PROJECT_SECTION_IDS);
type SectionId = (typeof SECTION_VALUES)[number];

/** Khai báo ở cấp module để tham chiếu không đổi giữa các lần render (useUrlState yêu cầu). */
const URL_PARAMS = { section: urlParam.oneOf<SectionId>('muc', SECTION_VALUES, PROJECT_SECTION_IDS.overview) };

export interface ProjectSectionTab {
  key: ProjectSectionKey;
  label: string;
  sub: string;
}

function scrollToSection(id: string, behavior: ScrollBehavior) {
  document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' });
}

export function ProjectSectionNav({ tabs }: { tabs: ProjectSectionTab[] }) {
  const [{ section }, setUrl] = useUrlState(URL_PARAMS);
  const restored = useRef(false);

  // Mở link có sẵn ?muc= thì cuộn thẳng tới mục đó một lần, sau khi các khối đã dựng xong.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (section !== PROJECT_SECTION_IDS.overview) {
      requestAnimationFrame(() => scrollToSection(section, 'auto'));
    }
  }, [section]);

  // Cuộn tới đâu, mục đó sáng lên — và URL cập nhật theo (replace, không tạo lịch sử).
  useEffect(() => {
    const els = tabs
      .map((t) => document.getElementById(PROJECT_SECTION_IDS[t.key]))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          if (visible.target.id !== section) setUrl({ section: visible.target.id as SectionId });
          return;
        }
        // Cuộn ngược lên trên cả mục đầu tiên (vùng ảnh, tiêu đề): không mục nào nằm giữa màn
        // hình nên không có gì "giao" — trả đèn về mục đầu thay vì giữ nguyên mục cuối đã xem.
        // Đo trực tiếp thay vì đọc `entries`: nhảy thẳng từ cuối trang lên đầu thì mục đầu chưa
        // từng "giao" nên không có trong entries.
        const first = els[0];
        const firstBelowMiddle = first.getBoundingClientRect().top > window.innerHeight * 0.5;
        if (firstBelowMiddle && section !== first.id) setUrl({ section: first.id as SectionId });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [tabs, section, setUrl]);

  return (
    <div className="flex overflow-x-auto border-b border-gray-100">
      {tabs.map((tab) => {
        const id = PROJECT_SECTION_IDS[tab.key];
        const active = section === id;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setUrl({ section: id });
              scrollToSection(id, 'smooth');
            }}
            className={`flex flex-col items-start whitespace-nowrap border-b-2 px-5 py-3 transition-colors ${
              active ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <span className="text-sm font-semibold">{tab.label}</span>
            <span className="text-[11px] font-normal text-gray-400">{tab.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
