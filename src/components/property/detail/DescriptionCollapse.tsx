'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DescriptionCollapseProps {
  description: string;
  /** Chiều cao tối đa khi thu gọn (px) — xấp xỉ 9-10 dòng ở cỡ chữ 14px. */
  collapsedHeight?: number;
}

/**
 * Mô tả tin đăng có "Xem thêm / Thu gọn".
 * Chỉ hiện nút khi nội dung thực sự cao hơn ngưỡng — tin ngắn vẫn xổ hết như cũ.
 */
export function DescriptionCollapse({ description, collapsedHeight = 220 }: DescriptionCollapseProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const measure = () => setOverflowing(el.scrollHeight > collapsedHeight + 24);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [description, collapsedHeight]);

  if (!description.trim()) return null;

  const collapsed = overflowing && !expanded;

  return (
    <div>
      <div className="relative">
        <div
          ref={contentRef}
          className="text-[14px] text-gray-600 leading-relaxed space-y-2 overflow-hidden transition-[max-height] duration-300"
          style={{ maxHeight: collapsed ? collapsedHeight : undefined }}
        >
          {description.split('\n').map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-1" />;
            const rendered = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            if (line.trim().startsWith('- ')) {
              return (
                <div key={i} className="flex gap-2">
                  <span className="text-primary mt-1 shrink-0">•</span>
                  <span dangerouslySetInnerHTML={{ __html: rendered.replace(/^-\s+/, '') }} />
                </div>
              );
            }
            return <p key={i} dangerouslySetInnerHTML={{ __html: rendered }} />;
          })}
        </div>

        {collapsed && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent"
          />
        )}
      </div>

      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-bold text-primary hover:underline"
        >
          {expanded ? 'Thu gọn' : 'Xem thêm'}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
