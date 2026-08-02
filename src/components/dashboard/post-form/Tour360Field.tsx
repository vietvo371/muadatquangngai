'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isValidTour360Url } from '@/lib/property-form-config';

interface Tour360FieldProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  disabled?: boolean;
}

/**
 * Link Tour 360 Matterport/Kuula (feedback I.12) — chỉ 1 link, không có file để upload nên
 * không cần dropzone như VideoUploader, chỉ 1 ô nhập + nút "Thêm" theo đúng hình dạng nhánh
 * YouTube của VideoUploader (input thường, không phải shadcn Input, giữ đúng convention).
 */
export function Tour360Field({ value, onChange, disabled = false }: Tour360FieldProps) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addTour = () => {
    const url = draft.trim();
    if (!url) return;
    if (!isValidTour360Url(url)) {
      setError('Chỉ chấp nhận link Matterport (matterport.com) hoặc Kuula (kuula.co).');
      return;
    }
    setError(null);
    onChange(url);
    setDraft('');
  };

  if (value) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex-1 min-w-0 truncate">
          {value}
        </a>
        <button
          type="button"
          onClick={() => onChange(undefined)}
          disabled={disabled}
          className="p-2 text-red-500 hover:bg-red-50 rounded shrink-0"
          title="Xóa"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="url"
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setError(null); }}
          placeholder="Dán link Matterport hoặc Kuula..."
          disabled={disabled}
          className="flex-1 h-11 px-3.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        />
        <Button type="button" onClick={addTour} disabled={disabled || !draft.trim()} className="h-11">
          Thêm
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
