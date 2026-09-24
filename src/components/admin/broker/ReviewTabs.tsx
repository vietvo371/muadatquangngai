'use client';

import type { ReviewStatus } from '@/lib/broker-api';

const TABS: Array<{ value: ReviewStatus; label: string }> = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Bị từ chối' },
];

export function ReviewTabs({ value, counts, onChange }: { value: ReviewStatus; counts?: Record<string, number>; onChange: (v: ReviewStatus) => void }) {
  return (
    <div className="flex w-fit flex-wrap gap-1.5 rounded-full border border-gray-150 bg-gray-50 p-1">
      {TABS.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
            value === t.value ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100/60 hover:text-gray-900'
          }`}
        >
          {t.label}
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${value === t.value ? 'bg-white/20 text-white' : 'bg-gray-200/80 text-gray-600'}`}>
            {counts?.[t.value] ?? 0}
          </span>
        </button>
      ))}
    </div>
  );
}
