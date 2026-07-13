import { DEFAULT_FILTERS, type FilterState } from '@/components/search/FilterSidebar';

// Đồng bộ 2 chiều giữa FilterState (+ searchQuery/sort/page) và URL query string, để F5/back-
// forward/chia sẻ link giữ đúng kết quả đã lọc — khớp hành vi chuẩn của các trang BĐS lớn.
// Chỉ ghi các field khác giá trị mặc định vào URL để URL luôn gọn (?category=6&price_min=...).

export interface UrlSyncedState {
  filters: FilterState;
  searchQuery: string;
  sort: string;
  page: number;
}

export const DEFAULT_SORT = 'newest';

export function parseFiltersFromSearchParams(searchParams: URLSearchParams | null): UrlSyncedState {
  const get = (key: string) => searchParams?.get(key) ?? null;

  const category = get('category');
  const district = get('khu_vuc');
  const priceMin = get('price_min');
  const priceMax = get('price_max');
  const areaMin = get('area_min');
  const areaMax = get('area_max');
  const bedrooms = get('bedrooms');
  const bathrooms = get('bathrooms');
  const direction = get('direction');
  const legal = get('legal');
  const q = get('q');
  const sort = get('sort');
  const pageParam = get('page');

  return {
    filters: {
      types: category ? category.split(',').filter(Boolean) : DEFAULT_FILTERS.types,
      district: district && /^\d+$/.test(district) ? Number(district) : DEFAULT_FILTERS.district,
      priceMin: priceMin && /^\d+$/.test(priceMin) ? Number(priceMin) : DEFAULT_FILTERS.priceMin,
      priceMax: priceMax && /^\d+$/.test(priceMax) ? Number(priceMax) : DEFAULT_FILTERS.priceMax,
      areaMin: areaMin && /^\d+$/.test(areaMin) ? Number(areaMin) : DEFAULT_FILTERS.areaMin,
      areaMax: areaMax && /^\d+$/.test(areaMax) ? Number(areaMax) : DEFAULT_FILTERS.areaMax,
      bedrooms: bedrooms || DEFAULT_FILTERS.bedrooms,
      bathrooms: bathrooms || DEFAULT_FILTERS.bathrooms,
      direction: direction || DEFAULT_FILTERS.direction,
      legal: legal || DEFAULT_FILTERS.legal,
    },
    searchQuery: q || '',
    sort: sort || DEFAULT_SORT,
    page: pageParam && /^\d+$/.test(pageParam) ? Number(pageParam) : 1,
  };
}

export function buildSearchParamsFromState(state: UrlSyncedState): URLSearchParams {
  const { filters, searchQuery, sort, page } = state;
  const params = new URLSearchParams();

  if (filters.types.length > 0) params.set('category', filters.types.join(','));
  if (filters.district !== '') params.set('khu_vuc', String(filters.district));
  if (filters.priceMin !== '') params.set('price_min', String(filters.priceMin));
  if (filters.priceMax !== '') params.set('price_max', String(filters.priceMax));
  if (filters.areaMin !== '') params.set('area_min', String(filters.areaMin));
  if (filters.areaMax !== '') params.set('area_max', String(filters.areaMax));
  if (filters.bedrooms !== 'any') params.set('bedrooms', filters.bedrooms);
  if (filters.bathrooms !== 'any') params.set('bathrooms', filters.bathrooms);
  if (filters.direction) params.set('direction', filters.direction);
  if (filters.legal) params.set('legal', filters.legal);
  if (searchQuery.trim()) params.set('q', searchQuery.trim());
  if (sort !== DEFAULT_SORT) params.set('sort', sort);
  if (page > 1) params.set('page', String(page));

  return params;
}
