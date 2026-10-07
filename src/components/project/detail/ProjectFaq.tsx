'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatQuarter } from '@/lib/display-format';
import { projectAddress, projectPriceLabel } from '@/lib/project/fields';
import type { Project } from '@/lib/project/types';

interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Câu hỏi thường gặp, dựng TỪ dữ liệu thật của dự án: câu nào dự án chưa có dữ liệu để trả lời
 * thì không hỏi. Bản cũ trả lời bất chấp — "Chủ đầu tư là Đơn vị uy tín tại Quảng Ngãi", "Giá
 * từ 3 tỷ đến 8 tỷ" — với những dự án không hề có thông tin đó.
 */
function buildFaq(p: Project): FaqItem[] {
  const price = projectPriceLabel(p);
  const address = projectAddress(p);
  const handover = formatQuarter(p.handoverDate);

  const items: Array<FaqItem | null> = [
    price ? { question: `Giá ${p.name} hiện nay bao nhiêu?`, answer: `Khoảng giá dự kiến: ${price}. Giá thực tế tuỳ vị trí và diện tích từng ${p.unitWord}.` } : null,
    address ? { question: `${p.name} nằm ở đâu?`, answer: `Dự án toạ lạc tại ${address}.` } : null,
    p.developer ? { question: `Chủ đầu tư ${p.name} là ai?`, answer: `Chủ đầu tư dự án là ${p.developer}.` } : null,
    p.legal ? { question: `Pháp lý ${p.name} thế nào?`, answer: p.legal } : null,
    handover ? { question: `Khi nào ${p.name} bàn giao?`, answer: `Dự kiến bàn giao ${handover}.` } : null,
  ];
  return items.filter((i): i is FaqItem => i !== null);
}

export function ProjectFaq({ project, onAsk }: { project: Project; onAsk: () => void }) {
  const items = buildFaq(project);
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-gray-900">Câu hỏi thường gặp</h2>
      <div className="divide-y divide-gray-100 overflow-hidden rounded-[var(--radius-card)] border border-gray-200">
        {items.map((item, i) => (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50"
            >
              <span className="flex-1 text-sm font-semibold text-gray-800">{item.question}</span>
              <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-gray-400 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <div className="px-5 pb-4 text-sm leading-relaxed text-gray-600">{item.answer}</div>}
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 bg-gray-50 px-5 py-3">
          <span className="text-[13px] text-gray-500">
            {items.length === 0 ? 'Bạn cần thêm thông tin về dự án này?' : 'Chưa thấy câu trả lời bạn cần?'}
          </span>
          <button
            type="button"
            onClick={onAsk}
            className="rounded border border-primary px-4 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-light"
          >
            Đặt câu hỏi
          </button>
        </div>
      </div>
    </div>
  );
}
