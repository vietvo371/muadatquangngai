'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  DATA_SOURCE_OPTIONS, DEFAULT_REPORT_QUERY, REPORT_MONTH_OPTIONS,
  type PriceReportOptions, type PriceReportQuery,
} from '@/lib/price-report-api';

const BILLION = 1_000_000_000;

const selectClass =
  'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none';
const inputClass =
  'h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none';

interface PriceReportFiltersProps {
  query: PriceReportQuery;
  options: PriceReportOptions | undefined;
  onChange: (next: PriceReportQuery) => void;
  /** Trang chi tiết khu vực đã cố định khu vực nên ẩn bộ chọn Tỉnh / Phường-Xã. */
  hideLocation?: boolean;
}

/** Ô số chỉ báo lên khi rời ô hoặc nhấn Enter — tránh gọi lại báo cáo sau mỗi phím gõ. */
function RangeInput({ value, placeholder, onCommit, label }: {
  value: string; placeholder: string; label: string; onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) { setSynced(value); setDraft(value); }

  const commit = () => { if (draft !== value) onCommit(draft.trim()); };
  return (
    <input type="number" min={0} step="any" inputMode="decimal" aria-label={label} placeholder={placeholder}
      className={inputClass} value={draft}
      onChange={(e) => setDraft(e.target.value)} onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); }} />
  );
}

const toBillion = (vnd: string) => (vnd === '' ? '' : String(Number(vnd) / BILLION));
const fromBillion = (billion: string) =>
  billion === '' || !Number.isFinite(Number(billion)) ? '' : String(Math.round(Number(billion) * BILLION));

export function PriceReportFilters({ query, options, onChange, hideLocation }: PriceReportFiltersProps) {
  const set = (patch: Partial<PriceReportQuery>) => onChange({ ...query, ...patch });
  const areas = (options?.areas ?? []).filter((a) => !query.province || a.province_id === query.province);
  const isDefault = JSON.stringify({ ...query, area: hideLocation ? '' : query.area, province: hideLocation ? '' : query.province })
    === JSON.stringify(DEFAULT_REPORT_QUERY);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {!hideLocation && (
          <>
            <Field label="Tỉnh">
              <select className={selectClass} value={query.province} aria-label="Tỉnh"
                onChange={(e) => set({ province: e.target.value, area: '' })}>
                <option value="">Tất cả tỉnh</option>
                {options?.provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Thành phố / Phường / Xã">
              <select className={selectClass} value={query.area} aria-label="Phường/Xã"
                onChange={(e) => set({ area: e.target.value })}>
                <option value="">Toàn bộ khu vực</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
          </>
        )}
        <Field label="Loại BĐS">
          <select className={selectClass} value={query.category} aria-label="Loại BĐS"
            onChange={(e) => set({ category: e.target.value })}>
            <option value="">Tất cả loại</option>
            {options?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Nguồn dữ liệu">
          <select className={selectClass} value={query.source} aria-label="Nguồn dữ liệu"
            onChange={(e) => set({ source: e.target.value })}>
            {DATA_SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Diện tích (m²)">
          <div className="flex items-center gap-2">
            <RangeInput label="Diện tích từ" placeholder="Từ" value={query.area_min} onCommit={(v) => set({ area_min: v })} />
            <span className="text-gray-400">–</span>
            <RangeInput label="Diện tích đến" placeholder="Đến" value={query.area_max} onCommit={(v) => set({ area_max: v })} />
          </div>
        </Field>
        <Field label="Khoảng giá (tỷ)">
          <div className="flex items-center gap-2">
            <RangeInput label="Giá từ" placeholder="Từ" value={toBillion(query.price_min)}
              onCommit={(v) => set({ price_min: fromBillion(v) })} />
            <span className="text-gray-400">–</span>
            <RangeInput label="Giá đến" placeholder="Đến" value={toBillion(query.price_max)}
              onCommit={(v) => set({ price_max: fromBillion(v) })} />
          </div>
        </Field>
        <Field label="Thời gian">
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-gray-100 p-1" role="group" aria-label="Thời gian">
            {REPORT_MONTH_OPTIONS.map((m) => (
              <button key={m} type="button" onClick={() => set({ months: m })} aria-pressed={query.months === m}
                className={`h-8 rounded-md text-sm font-medium transition ${
                  query.months === m ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}>
                {m} th
              </button>
            ))}
          </div>
        </Field>
        <div className="flex items-end">
          <button type="button" disabled={isDefault}
            onClick={() => onChange({ ...DEFAULT_REPORT_QUERY, ...(hideLocation ? { province: query.province, area: query.area } : {}) })}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
            <RotateCcw className="h-4 w-4" /> Đặt lại bộ lọc
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // div thay vì label: một label bọc nhóm nút sẽ kích hoạt nút đầu tiên khi bấm vào chữ.
    // Mỗi ô bên trong đã có aria-label riêng.
    <div className="min-w-0">
      <span className="mb-1.5 block text-xs font-medium text-gray-500">{label}</span>
      {children}
    </div>
  );
}
