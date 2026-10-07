'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Trạng thái giao diện lưu trên URL (Notion 07/10 "URL State"): tab, bộ lọc, sắp xếp, trang.
 * F5, bấm quay lại, hay gửi link cho người khác đều mở ra đúng trạng thái đang xem.
 *
 * Khai báo một lần mỗi tham số gồm: tên trên URL, cách đọc, giá trị mặc định. Giá trị bằng mặc
 * định thì KHÔNG ghi lên URL, để link luôn gọn (?tab=vi-tri thay vì ?tab=vi-tri&page=1&sort=moi).
 *
 * Giá trị trên URL là thứ ai cũng sửa tay được, nên mọi bộ đọc đều phải chịu được rác: đọc
 * không ra thì trả về mặc định, không bao giờ ném lỗi làm sập trang.
 *
 * LƯU Ý: hook này dùng useSearchParams — component gọi nó phải nằm trong <Suspense>, nếu không
 * build production sẽ hỏng cả trang.
 */

export interface UrlParam<T> {
  /** Tên tham số trên URL. */
  key: string;
  defaultValue: T;
  // Khai báo dạng phương thức (không phải thuộc tính kiểu hàm) để một UrlParam<'a' | 'b'> vẫn
  // gán được vào Record<string, UrlParam<unknown>> — TypeScript kiểm tra tham số phương thức
  // theo hai chiều, còn thuộc tính kiểu hàm thì chỉ một chiều và sẽ báo lỗi.
  /** Chuỗi trên URL → giá trị. Trả `undefined` khi chuỗi không hợp lệ (sẽ dùng mặc định). */
  parse(raw: string): T | undefined;
  /** Giá trị → chuỗi trên URL. Mặc định dùng String(). */
  serialize?(value: T): string;
}

/** Bộ đọc dựng sẵn cho các kiểu hay gặp. */
export const urlParam = {
  /** Một trong các giá trị cho trước (tab, chế độ xem, sắp xếp). */
  oneOf<T extends string>(key: string, values: readonly T[], defaultValue: T): UrlParam<T> {
    return { key, defaultValue, parse: (raw) => (values as readonly string[]).includes(raw) ? (raw as T) : undefined };
  },
  /** Số nguyên dương (số trang). */
  page(key = 'page'): UrlParam<number> {
    return {
      key,
      defaultValue: 1,
      parse: (raw) => (/^\d{1,5}$/.test(raw) && Number(raw) >= 1 ? Number(raw) : undefined),
    };
  },
  /** Chuỗi tự do (ô tìm kiếm), cắt độ dài để URL không phình vô hạn. */
  text(key: string, maxLength = 100): UrlParam<string> {
    return { key, defaultValue: '', parse: (raw) => raw.slice(0, maxLength) };
  },
  /** Danh sách chọn nhiều, ngăn bằng dấu phẩy. */
  list(key: string, isValid: (item: string) => boolean = () => true): UrlParam<string[]> {
    return {
      key,
      defaultValue: [],
      parse: (raw) => raw.split(',').map((s) => s.trim()).filter((s) => s && isValid(s)),
      serialize: (value) => value.join(','),
    };
  },
};

type ParamValues<P extends Record<string, UrlParam<unknown>>> = { [K in keyof P]: P[K]['defaultValue'] };

function isDefault<T>(value: T, defaultValue: T): boolean {
  if (Array.isArray(value) && Array.isArray(defaultValue)) {
    return value.length === defaultValue.length && value.every((v, i) => v === defaultValue[i]);
  }
  return value === defaultValue;
}

export function useUrlState<P extends Record<string, UrlParam<unknown>>>(params: P) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const values = useMemo(() => {
    const out = {} as ParamValues<P>;
    for (const name of Object.keys(params) as (keyof P)[]) {
      const def = params[name];
      const raw = searchParams?.get(def.key);
      const parsed = raw === null || raw === undefined ? undefined : def.parse(raw);
      out[name] = (parsed === undefined ? def.defaultValue : parsed) as ParamValues<P>[keyof P];
    }
    return out;
  }, [params, searchParams]);

  /**
   * Ghi một hoặc nhiều giá trị lên URL. Giữ nguyên các tham số khác đang có trên URL mà hook
   * này không quản lý. `replace` (mặc định) không tạo thêm mục lịch sử cho mỗi lần đổi bộ lọc —
   * nếu không, bấm quay lại phải bấm hàng chục lần mới ra khỏi trang.
   */
  const setValues = useCallback(
    (patch: Partial<ParamValues<P>>, options: { history?: 'replace' | 'push' } = {}) => {
      const next = new URLSearchParams(searchParams?.toString() ?? '');
      for (const name of Object.keys(patch) as (keyof P)[]) {
        const def = params[name];
        const value = patch[name];
        if (value === undefined || isDefault(value, def.defaultValue)) {
          next.delete(def.key);
        } else {
          const serialize = (def.serialize ?? String) as (v: unknown) => string;
          next.set(def.key, serialize(value));
        }
      }
      const query = next.toString();
      const base = pathname ?? '';
      const url = query ? `${base}?${query}` : base;
      if (options.history === 'push') router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [params, pathname, router, searchParams]
  );

  return [values, setValues] as const;
}
