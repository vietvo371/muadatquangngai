'use client';

import { useState, useCallback } from 'react';

export interface UploadProgressItem {
  name: string;
  percent: number;
}

/**
 * Tiến trình upload thật theo từng file (feedback I.8) — dùng chung cho ImageUploader,
 * VideoUploader, FloorPlanUploader vì cả 3 cần y hệt cùng 1 kiểu state (map id -> {name,
 * percent}), chỉ khác phần hiển thị.
 */
export function useUploadProgress() {
  const [items, setItems] = useState<Record<string, UploadProgressItem>>({});

  const start = useCallback((id: string, name: string) => {
    setItems((prev) => ({ ...prev, [id]: { name, percent: 0 } }));
  }, []);

  const update = useCallback((id: string, percent: number) => {
    setItems((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], percent } } : prev));
  }, []);

  const finish = useCallback((id: string) => {
    setItems((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  return { items, start, update, finish };
}
