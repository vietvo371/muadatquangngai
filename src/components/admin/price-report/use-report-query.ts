'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { parseReportQuery, toQueryParams, type PriceReportQuery } from '@/lib/price-report-api';

/** Bộ lọc Báo cáo giá lưu trên URL — link chi tiết khu vực giữ nguyên bộ lọc, gửi link cho người khác được. */
export function useReportQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const query = useMemo(() => parseReportQuery(new URLSearchParams(searchParams?.toString() ?? '')), [searchParams]);

  const setQuery = useCallback((next: PriceReportQuery) => {
    const qs = new URLSearchParams(toQueryParams(next));
    if (qs.get('months') === '12') qs.delete('months');
    if (qs.get('source') === 'listing') qs.delete('source');
    const suffix = qs.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  }, [pathname, router]);

  return { query, setQuery };
}

/** Chuỗi query giữ bộ lọc hiện tại (trừ khu vực) để gắn vào link. */
export function carryFilters(query: PriceReportQuery): string {
  const qs = new URLSearchParams(toQueryParams({ ...query, area: '' }));
  if (qs.get('months') === '12') qs.delete('months');
  if (qs.get('source') === 'listing') qs.delete('source');
  const suffix = qs.toString();
  return suffix ? `?${suffix}` : '';
}
