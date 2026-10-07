'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, ApiError, toApiError } from '@/lib/api-client';
import { adaptList, adaptPagination, adaptProject, adaptUnit } from '@/lib/project/adapters';
import type { Pagination, Project, Unit } from '@/lib/project/types';

/**
 * Tải dữ liệu trang chi tiết dự án qua API Client + Adapter (Notion 07/10).
 *
 * Nguồn sự thật duy nhất: slug trên URL → API → Adapter → component. Không có dữ liệu mẫu,
 * không có giá trị dự phòng. Đổi slug giữa chừng (bấm sang dự án khác) thì yêu cầu cũ bị huỷ,
 * để kết quả về muộn của dự án cũ không ghi đè lên dự án mới.
 *
 * "Đang tải" được SUY RA (kết quả đang giữ không thuộc yêu cầu hiện tại) chứ không đặt bằng
 * setState ngay đầu effect — cách đó bắt React render thêm một lượt mỗi lần đổi yêu cầu.
 */

export type DetailState =
  | { status: 'loading' }
  | { status: 'ready'; project: Project }
  | { status: 'not-found' }
  | { status: 'error'; error: ApiError };

export function useProjectDetail(slug: string | undefined, { enabled = true } = {}) {
  const [reloadKey, setReloadKey] = useState(0);
  const requestKey = `${slug ?? ''}|${reloadKey}`;
  const [result, setResult] = useState<{ key: string; state: DetailState } | null>(null);

  useEffect(() => {
    if (!slug || !enabled) return;
    const controller = new AbortController();
    const key = `${slug}|${reloadKey}`;

    apiGet<{ data?: unknown }>(`/api/v2/projects/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then((res) => {
        const project = adaptProject(res?.data);
        setResult({ key, state: project ? { status: 'ready', project } : { status: 'not-found' } });
      })
      .catch((error: unknown) => {
        const apiError = toApiError(error);
        if (apiError.code === 'ABORTED') return;
        setResult({
          key,
          state: apiError.code === 'NOT_FOUND' ? { status: 'not-found' } : { status: 'error', error: apiError },
        });
      });

    return () => controller.abort();
  }, [slug, enabled, reloadKey]);

  const state: DetailState = result?.key === requestKey ? result.state : { status: 'loading' };
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { state, reload };
}

type UnitsState =
  | { status: 'loading' }
  | { status: 'ready'; units: Unit[]; pagination: Pagination }
  | { status: 'error'; error: ApiError };

export const UNITS_PER_PAGE = 6;

const EMPTY_UNITS: UnitsState = { status: 'ready', units: [], pagination: adaptPagination(null) };

/** Căn/lô đang rao bán thuộc dự án, có phân trang. */
export function useProjectUnits(projectId: string | null, page: number) {
  const [reloadKey, setReloadKey] = useState(0);
  // Bản xem trước trong trang quản trị không có id thật — không có tin đăng nào để tải.
  const hasRealId = projectId !== null && /^\d+$/.test(projectId);
  const requestKey = `${projectId}|${page}|${reloadKey}`;
  const [result, setResult] = useState<{ key: string; state: UnitsState } | null>(null);

  useEffect(() => {
    if (!hasRealId) return;
    const controller = new AbortController();
    const key = `${projectId}|${page}|${reloadKey}`;

    apiGet<{ data?: unknown; meta?: unknown }>(`/api/v2/projects/${projectId}/units`, {
      params: { page, per_page: UNITS_PER_PAGE },
      signal: controller.signal,
    })
      .then((res) => {
        const units = adaptList(res?.data, adaptUnit);
        setResult({ key, state: { status: 'ready', units, pagination: adaptPagination(res?.meta, units.length) } });
      })
      .catch((error: unknown) => {
        const apiError = toApiError(error);
        if (apiError.code !== 'ABORTED') setResult({ key, state: { status: 'error', error: apiError } });
      });

    return () => controller.abort();
  }, [hasRealId, projectId, page, reloadKey]);

  const state: UnitsState = !hasRealId
    ? EMPTY_UNITS
    : result?.key === requestKey
      ? result.state
      : { status: 'loading' };
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { state, reload };
}
