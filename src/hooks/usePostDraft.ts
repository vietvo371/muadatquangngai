'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Lưu bản nháp tin đăng (spec mục 13).
 *
 * Dùng localStorage thay vì lưu server: bản nháp là dữ liệu dở dang của riêng phiên soạn
 * thảo, chưa cần đồng bộ đa thiết bị, và tránh tạo hàng loạt bản ghi rác trong bảng
 * properties mỗi khi có người mở form rồi bỏ ngang.
 *
 * Thời điểm lưu theo spec: sau một khoảng không thao tác (debounce), khi chuyển bước, và
 * trước khi rời trang.
 */

const DRAFT_KEY = 'bds:dang-tin:draft';
const DRAFT_VERSION = 1;
const AUTOSAVE_DELAY_MS = 1500;

interface DraftEnvelope<T> {
  version: number;
  savedAt: string;
  step: number;
  data: T;
}

export interface PostDraft<T> {
  /** Bản nháp tìm thấy lúc mở trang — null nếu không có. Không tự áp dụng, để user chọn. */
  found: DraftEnvelope<T> | null;
  /**
   * Đã đọc xong localStorage hay chưa. Cần cờ này vì lượt render đầu `found` luôn null
   * (việc đọc nằm trong effect) — nếu bật autosave dựa vào `found` là đủ thì form rỗng
   * sẽ kịp ghi đè lên bản nháp cũ trước khi đọc xong.
   */
  checked: boolean;
  /** Ghi ngay lập tức, dùng khi chuyển bước hoặc trước khi rời trang. */
  saveNow: (data: T, step: number) => void;
  /** Xoá bản nháp — gọi khi đăng tin thành công hoặc user chọn bỏ nháp. */
  clear: () => void;
  /** Đánh dấu đã xử lý xong bản nháp tìm thấy (tiếp tục hoặc bỏ) để ẩn thông báo. */
  dismiss: () => void;
}

export function usePostDraft<T>(enabled = true): PostDraft<T> {
  const [found, setFound] = useState<DraftEnvelope<T> | null>(null);
  const [checked, setChecked] = useState(false);

  // Đọc bản nháp đúng một lần lúc mount. Đọc trong effect chứ không phải lúc khởi tạo
  // state để tránh lệch nội dung giữa server render và client hydrate.
  useEffect(() => {
    if (!enabled) {
      setChecked(true);
      return;
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DraftEnvelope<T>;
        // Bỏ qua nháp của phiên bản form cũ — cấu trúc dữ liệu có thể đã đổi.
        if (parsed?.version === DRAFT_VERSION) setFound(parsed);
        else localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    } finally {
      setChecked(true);
    }
  }, [enabled]);

  const saveNow = useCallback((data: T, step: number) => {
    try {
      const envelope: DraftEnvelope<T> = {
        version: DRAFT_VERSION,
        savedAt: new Date().toISOString(),
        step,
        data,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(envelope));
    } catch {
      // Hết quota hoặc trình duyệt chặn — không chặn luồng đăng tin vì việc này.
    }
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* bỏ qua */
    }
    setFound(null);
  }, []);

  const dismiss = useCallback(() => setFound(null), []);

  return { found, checked, saveNow, clear, dismiss };
}

/**
 * Tự lưu sau khi ngừng thao tác một lúc, và lưu nốt lần cuối khi rời trang.
 * Tách riêng khỏi usePostDraft để phần đọc/ghi thủ công không bị buộc vào vòng debounce.
 */
export function useDraftAutosave<T>(
  data: T,
  step: number,
  save: (data: T, step: number) => void,
  enabled: boolean
) {
  // Giữ giá trị mới nhất trong ref để handler beforeunload luôn đọc được bản cuối cùng
  // mà không phải gắn/gỡ listener sau mỗi lần gõ phím.
  const latest = useRef({ data, step });
  latest.current = { data, step };

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => save(data, step), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [data, step, save, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onLeave = () => save(latest.current.data, latest.current.step);
    window.addEventListener('beforeunload', onLeave);
    return () => {
      window.removeEventListener('beforeunload', onLeave);
      onLeave(); // rời trang bằng điều hướng nội bộ cũng phải lưu
    };
  }, [save, enabled]);
}
