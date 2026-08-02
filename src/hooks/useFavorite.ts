'use client';

import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import axios from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';

interface SavedPropertiesState {
  ids: Set<number>;
  loaded: boolean;
  loading: boolean;
  setIds: (ids: Array<number | string>) => void;
  add: (id: number) => void;
  remove: (id: number) => void;
  reset: () => void;
  setLoading: (value: boolean) => void;
}

/**
 * Cache toàn cục (không persist) các property_id user đã lưu — nạp 1 lần/phiên qua
 * GET /api/v2/my/saved/ids, dùng để tô đậm nút tim ❤️ ở mọi PropertyCard + trang chi tiết
 * mà không phải fetch riêng cho từng card.
 */
export const useSavedPropertiesStore = create<SavedPropertiesState>((set) => ({
  ids: new Set(),
  loaded: false,
  loading: false,
  setIds: (ids) => set({ ids: new Set(ids.map(Number)), loaded: true, loading: false }),
  add: (id) => set((s) => ({ ids: new Set(s.ids).add(id) })),
  remove: (id) =>
    set((s) => {
      const next = new Set(s.ids);
      next.delete(id);
      return { ids: next };
    }),
  reset: () => set({ ids: new Set(), loaded: false, loading: false }),
  setLoading: (value) => set({ loading: value }),
}));

let fetchPromise: Promise<void> | null = null;

function ensureSavedIdsLoaded() {
  const state = useSavedPropertiesStore.getState();
  if (state.loaded || state.loading) return fetchPromise ?? Promise.resolve();

  useSavedPropertiesStore.getState().setLoading(true);
  fetchPromise = axios
    .get('/api/v2/my/saved/ids')
    .then((res) => {
      useSavedPropertiesStore.getState().setIds(res.data?.data ?? []);
    })
    .catch(() => {
      useSavedPropertiesStore.getState().setLoading(false);
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

/**
 * Hook dùng chung cho nút tim ❤️ (PropertyCard + trang chi tiết): tự nạp danh sách đã lưu
 * khi user đăng nhập, toggle optimistic qua POST/DELETE /api/v2/my/saved/:id, rollback +
 * toast lỗi nếu request thất bại.
 */
export function useFavorite(propertyId: number | string | undefined | null) {
  const id = propertyId != null ? Number(propertyId) : undefined;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const ids = useSavedPropertiesStore((s) => s.ids);
  const add = useSavedPropertiesStore((s) => s.add);
  const remove = useSavedPropertiesStore((s) => s.remove);
  const reset = useSavedPropertiesStore((s) => s.reset);

  useEffect(() => {
    if (isAuthenticated) {
      ensureSavedIdsLoaded();
    } else {
      reset();
    }
  }, [isAuthenticated, reset]);

  const isSaved = id !== undefined && !Number.isNaN(id) && ids.has(id);

  const toggle = useCallback(async () => {
    if (id === undefined || Number.isNaN(id)) return;

    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu tin');
      return;
    }

    const wasSaved = useSavedPropertiesStore.getState().ids.has(id);

    if (wasSaved) {
      remove(id);
      try {
        await axios.delete(`/api/v2/my/saved/${id}`);
      } catch {
        add(id);
        toast.error('Bỏ lưu tin thất bại, vui lòng thử lại');
      }
    } else {
      add(id);
      try {
        await axios.post(`/api/v2/my/saved/${id}`);
        toast.success('Đã lưu tin đăng!');
      } catch (err) {
        remove(id);
        const message =
          (isAxiosError(err) && err.response?.data?.message) || 'Lưu tin thất bại, vui lòng thử lại';
        toast.error(message);
      }
    }
  }, [id, isAuthenticated, add, remove]);

  return { isSaved, toggle, savedCount: ids.size };
}
