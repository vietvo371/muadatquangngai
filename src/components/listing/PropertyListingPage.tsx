'use client';

import { Suspense, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { FeaturedPropertyCard } from '@/components/property/FeaturedPropertyCard';
import { ListingGridCard } from '@/components/listing/ListingGridCard';
import { FilterState, DEFAULT_FILTERS } from '@/components/search/FilterSidebar';
import { FilterHorizontal } from '@/components/search/FilterHorizontal';
import { PropertyCardSkeleton } from '@/components/property/PropertyCardSkeleton';
import { SearchX, Search as SearchIcon, X, Map as MapIcon, List } from 'lucide-react';
import { useProperties } from '@/hooks/useProperties';
import {
  parseFiltersFromSearchParams,
  buildSearchParamsFromState,
  type ListingView,
} from '@/lib/filter-url-sync';
import type { MapBounds } from '@/components/map/PropertyMapView';
import { ListingPagination } from '@/components/listing/ListingPagination';

// Bản đồ Goong nạp phía client.
const PropertyMapView = dynamic(
  () => import('@/components/map/PropertyMapView').then((m) => m.PropertyMapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full animate-pulse items-center justify-center bg-gray-100 text-sm text-gray-400">
        Đang tải bản đồ...
      </div>
    ),
  }
);

export type ListingType = 'sell' | 'rent';

/**
 * Phần khác nhau giữa /mua-ban và /cho-thue gom về một chỗ — hai trang dùng chung toàn bộ
 * giao diện, chỉ khác `type` và vài dòng chữ.
 */
const LISTING_COPY: Record<
  ListingType,
  { pathname: string; breadcrumb: string; heading: string; emptyText: string; dotsId: string; dotsColor: string }
> = {
  sell: {
    pathname: '/mua-ban',
    breadcrumb: 'Mua bán nhà đất',
    heading: 'Mua bán nhà đất tại Quảng Ngãi',
    emptyText: 'Không có bất động sản nào phù hợp với bộ lọc của bạn. Thử thay đổi bộ lọc để xem thêm kết quả.',
    dotsId: 'empty-dots-sale',
    dotsColor: '#1075b1',
  },
  rent: {
    pathname: '/cho-thue',
    breadcrumb: 'Cho thuê nhà đất',
    heading: 'Cho thuê nhà đất tại Quảng Ngãi',
    emptyText: 'Không có bất động sản cho thuê nào phù hợp với bộ lọc của bạn. Thử thay đổi bộ lọc để xem thêm kết quả.',
    dotsId: 'empty-dots-rent',
    dotsColor: '#e03131',
  },
};

// 30 tin mỗi trang ở chế độ danh sách. Chế độ bản đồ lấy nhiều hơn để marker phủ đủ kết quả
// (API chặn trần ở 100).
const PER_PAGE = 30;
const PER_PAGE_MAP = 100;
const SKELETON_COUNT = 6;

// Giá trị sort của SortBar → tham số API. "Phù hợp nhất" = thứ tự mặc định; "Xem nhiều nhất"
// API gọi là `popular`.
const API_SORT: Record<string, string> = { relevant: 'newest', views_desc: 'popular' };

const mapApiProperty = (apiProp: any) => {
  const unit = apiProp.price_unit;
  return {
    id: apiProp.id,
    title: apiProp.title,
    slug: apiProp.slug,
    price: Number(apiProp.price),
    priceUnit:
      unit === 'month' || unit === 'per_month' ? 'per_month' : unit === 'per_m2' || unit === 'm2' ? 'per_m2' : 'total',
    priceDisplayFormat: apiProp.price_display_format,
    area: Number(apiProp.area),
    type: apiProp.type,
    category: apiProp.category?.name || '',
    thumbnail: apiProp.thumbnail || '/images/image_data/Haus-Coastal.jpg',
    location: apiProp.location?.district
      ? `${apiProp.location.district.name}, Quảng Ngãi`
      : apiProp.address || 'Quảng Ngãi',
    latitude: apiProp.location?.latitude != null ? Number(apiProp.location.latitude) : null,
    longitude: apiProp.location?.longitude != null ? Number(apiProp.location.longitude) : null,
    bedrooms: Number(apiProp.bedrooms || 0),
    bathrooms: Number(apiProp.bathrooms || 0),
    facade: apiProp.facade != null ? Number(apiProp.facade) : null,
    floors: apiProp.floors != null ? Number(apiProp.floors) : null,
    legal: apiProp.legal ?? null,
    furniture: apiProp.furniture ?? null,
    direction: apiProp.direction ?? null,
    parking: !!apiProp.parking,
    description: apiProp.description ?? null,
    // Ảnh cho khu 1 lớn + 2 nhỏ / slider: chỉ ảnh (bỏ video, tour 360), theo sort_order API đã sắp.
    images: Array.isArray(apiProp.media)
      ? apiProp.media.filter((m: any) => m.type === 'image' && m.url).map((m: any) => m.url as string)
      : [],
    // Nhãn "Video" / "Virtual tour" chỉ bật khi tin có media loại đó thật.
    hasVideo: Array.isArray(apiProp.media) && apiProp.media.some((m: any) => m.type === 'video'),
    hasTour: Array.isArray(apiProp.media) && apiProp.media.some((m: any) => m.type === 'virtual_tour'),
    features: Array.isArray(apiProp.features) ? apiProp.features : [],
    isVip: apiProp.is_vip || 'normal',
    user: {
      name: apiProp.owner?.name || 'Môi giới',
      avatar: apiProp.owner?.avatar || null,
    },
    created_at: apiProp.created_at,
    views: apiProp.view_count || 0,
  };
};

function PropertyListingContent({ type }: { type: ListingType }) {
  const copy = LISTING_COPY[type];
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() || copy.pathname;

  // Tin đang hover/chọn ở danh sách hoặc trên bản đồ — dùng để đồng bộ highlight 2 chiều.
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const listTopRef = useRef<HTMLDivElement>(null);

  // Tìm theo khung nhìn bản đồ, chỉ dùng ở chế độ bản đồ toàn màn hình: `bbox` = vùng đang lọc;
  // `pendingBounds` = vùng người dùng vừa kéo tới, chờ bấm "Tìm khu vực này".
  const [bbox, setBbox] = useState<MapBounds | null>(null);
  const [pendingBounds, setPendingBounds] = useState<MapBounds | null>(null);

  const { fetchProperties, isLoading } = useProperties();
  const [apiProperties, setApiProperties] = useState<any[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [apiPagination, setApiPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: PER_PAGE,
    total: 0,
  });

  // Toàn bộ filter/search/sort/page/view khởi tạo từ URL (F5, chia sẻ link, back/forward đều giữ
  // đúng kết quả đã lọc) — xem src/lib/filter-url-sync.ts.
  const initialUrlState = useMemo(() => parseFiltersFromSearchParams(searchParams), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [page, setPage] = useState(initialUrlState.page);
  const [filters, setFilters] = useState<FilterState>(initialUrlState.filters);
  const [searchQuery, setSearchQuery] = useState(initialUrlState.searchQuery);
  const [sort, setSort] = useState(initialUrlState.sort);
  const [view, setView] = useState<ListingView>(initialUrlState.view);
  const [isFiltering, setIsFiltering] = useState(false);

  const isMapView = view === 'map';

  // Đọc lại từ URL mỗi khi query đổi do điều hướng bên ngoài (menu danh mục ở header,
  // back/forward) — component không remount nên cần effect riêng.
  useEffect(() => {
    const next = parseFiltersFromSearchParams(searchParams);
    setFilters(next.filters);
    setSearchQuery(next.searchQuery);
    setSort(next.sort);
    setPage(next.page);
    setView(next.view);
  }, [searchParams]);

  // Ghi state hiện tại vào URL. So sánh với URL thật trước khi replace để tự chặn vòng lặp với
  // effect đọc URL ở trên. `view` nằm trong URL nên đổi chế độ không làm mất bộ lọc.
  useEffect(() => {
    const qs = buildSearchParamsFromState({ filters, searchQuery, sort, page, view }).toString();
    if (qs === (searchParams?.toString() ?? '')) return;
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchQuery, sort, page, view]);

  useEffect(() => {
    const loadProperties = async () => {
      const apiFilters: any = {
        type,
        page,
        per_page: isMapView ? PER_PAGE_MAP : PER_PAGE,
        sort: API_SORT[sort] ?? sort,
        // Kèm tiện ích để thẻ tin hiện "Hồ bơi, Thang máy..." như thiết kế.
        with: 'features',
      };

      // Gửi ĐỦ mọi bộ lọc trên thanh chip. Trước đây ô tìm kiếm, diện tích, hướng, pháp lý,
      // phòng tắm và các loại nhà đất thứ 2 trở đi đều không được gửi — lọc mà kết quả không đổi.
      if (searchQuery.trim()) apiFilters.q = searchQuery.trim();
      if (filters.priceMin !== '') apiFilters.price_min = filters.priceMin;
      if (filters.priceMax !== '') apiFilters.price_max = filters.priceMax;
      if (filters.areaMin !== '') apiFilters.area_min = filters.areaMin;
      if (filters.areaMax !== '') apiFilters.area_max = filters.areaMax;
      if (filters.types.length > 0) apiFilters.category = filters.types.join(',');
      if (filters.district !== '') apiFilters.district = filters.district;
      if (filters.direction) apiFilters.direction = filters.direction;
      if (filters.legal) apiFilters.legal = filters.legal;
      if (filters.features.length > 0) apiFilters.features = filters.features.join(',');
      if (bbox) {
        apiFilters.min_lat = bbox.minLat;
        apiFilters.max_lat = bbox.maxLat;
        apiFilters.min_lng = bbox.minLng;
        apiFilters.max_lng = bbox.maxLng;
      }

      if (filters.bedrooms !== 'any') {
        const bedVal = parseInt(filters.bedrooms);
        if (!isNaN(bedVal)) apiFilters.bedrooms = bedVal;
      }
      if (filters.bathrooms !== 'any') {
        const bathVal = parseInt(filters.bathrooms);
        if (!isNaN(bathVal)) apiFilters.bathrooms = bathVal;
      }

      const res = await fetchProperties(apiFilters);
      // Bộ lọc trả 0 tin cũng phải cập nhật danh sách về rỗng, không giữ kết quả cũ.
      if (res.success && res.data) {
        setLoadFailed(false);
        setApiProperties(res.data.map(mapApiProperty));
        if (res.meta) {
          setApiPagination({
            current_page: res.meta.current_page || 1,
            last_page: res.meta.last_page || 1,
            per_page: res.meta.per_page || PER_PAGE,
            total: res.meta.total || 0,
          });
        }
      } else {
        setLoadFailed(true);
        setApiProperties([]);
      }
    };

    loadProperties();
  }, [type, page, filters, searchQuery, sort, bbox, isMapView, fetchProperties]);

  // Đổi trang thì đưa người dùng về đầu danh sách — 30 tin/trang, đứng nguyên cuối trang là lạc.
  const changePage = useCallback((next: number) => {
    setPage(next);
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setPage(1);
    setIsFiltering(true);
    setTimeout(() => setIsFiltering(false), 300);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const changeSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setPage(1);
  }, []);

  const changeSort = useCallback((next: string) => {
    setSort(next);
    setPage(1);
  }, []);

  // Rời chế độ bản đồ thì bỏ luôn vùng lọc theo khung nhìn — nó là khái niệm chỉ có trên bản đồ,
  // mang về danh sách sẽ thành bộ lọc vô hình không ai tắt được.
  const showListView = useCallback(() => {
    setBbox(null);
    setPendingBounds(null);
    setView('list');
  }, []);

  const showMapView = useCallback(() => setView('map'), []);

  const openDetail = useCallback(
    (id: string | number) => {
      const found = apiProperties.find((p) => String(p.id) === String(id));
      if (found) router.push(`/${found.type === 'sell' ? 'mua-ban' : 'cho-thue'}/${found.slug}`);
    },
    [apiProperties, router]
  );

  // CHỈ hiển thị tin THẬT từ API — không rơi về dữ liệu mẫu khi API lỗi/rỗng.
  const properties = apiProperties;
  const busy = isLoading || isFiltering;
  // Tin đầu tiên lên thẻ nổi bật, phần còn lại xuống lưới 3 cột (yêu cầu 23/09).
  const featured = properties[0];
  const gridProperties = properties.slice(1);

  // Thiết kế 23/09 bỏ breadcrumb và hàng "Nhận email / sắp xếp" (sắp xếp đã vào thanh chip).
  // Giữ một dòng h1 nhỏ vì đây là tiêu đề chính của trang cho công cụ tìm kiếm.
  const header = (
    <>
      <div ref={listTopRef} className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 scroll-mt-[130px]">
        <h1 className="text-[18px] font-bold tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
          {copy.heading}
        </h1>
        <span className="text-[13px] text-gray-500">{apiPagination.total} bất động sản</span>
      </div>

      {loadFailed && !busy && (
        <div className="mb-4 rounded-xl border border-cta/30 bg-white px-4 py-3 text-[13px] text-gray-700">
          Không tải được danh sách tin. Kiểm tra kết nối rồi thử lại.
        </div>
      )}
    </>
  );

  const emptyState = (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 via-white to-gray-50 p-16 text-center shadow-sm">
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]">
        <defs>
          <pattern id={copy.dotsId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill={copy.dotsColor} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${copy.dotsId})`} />
      </svg>
      <div className="relative z-10">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-light shadow-inner">
          <SearchX className="h-10 w-10 text-primary" />
        </div>
        <h3 className="mb-2 text-balance text-[20px] font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
          Không tìm thấy tin đăng
        </h3>
        <p className="mx-auto mb-6 max-w-md text-[14px] leading-relaxed text-gray-500">{copy.emptyText}</p>
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-[14px] font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg"
        >
          Xóa bộ lọc
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1440px] px-4 pb-6 lg:px-6">
        <FilterHorizontal
          filters={filters}
          onFilterChange={updateFilters}
          onReset={resetFilters}
          searchQuery={searchQuery}
          onSearchQueryChange={changeSearch}
          sort={sort}
          onSortChange={changeSort}
          context={type}
        />

        {isMapView ? (
          /* ══ CHẾ ĐỘ BẢN ĐỒ ══ bản đồ chiếm trọn bề ngang và phần lớn chiều cao, KHÔNG kèm
             lưới tin bên cạnh. Bộ lọc phía trên giữ nguyên nên đổi qua lại không mất kết quả. */
          <section className="relative h-[calc(100vh-150px)] min-h-[460px] overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            {pendingBounds && (
              <button
                type="button"
                onClick={() => { setBbox(pendingBounds); setPendingBounds(null); setPage(1); }}
                className="absolute left-1/2 top-3 z-10 flex h-9 -translate-x-1/2 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 text-[13px] font-semibold text-gray-800 shadow-lg hover:bg-gray-50"
              >
                <SearchIcon className="h-4 w-4 text-primary" />
                Tìm trong khu vực này
              </button>
            )}
            {bbox && (
              <button
                type="button"
                onClick={() => { setBbox(null); setPendingBounds(null); setPage(1); }}
                className="absolute left-1/2 top-3 z-10 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full bg-gray-900/85 px-3.5 text-[12px] font-medium text-white shadow-lg hover:bg-gray-900"
              >
                <X className="h-3.5 w-3.5" />
                Bỏ lọc theo khu vực
              </button>
            )}

            <PropertyMapView
              properties={properties}
              highlightedId={hoveredId}
              autoFit={!bbox}
              cluster
              showLayerSwitch
              onUserMove={(b) => setPendingBounds(b)}
              onMarkerClick={(id) => setHoveredId(id)}
              onMarkerOpen={openDetail}
              className="h-full w-full"
            />

            {/* Lối quay lại danh sách — pill nổi giữa cạnh dưới bản đồ. */}
            <button
              type="button"
              onClick={showListView}
              className="absolute bottom-5 left-1/2 z-10 flex h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-gray-900 px-5 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-colors hover:bg-gray-800"
            >
              <List className="h-4 w-4" />
              Hiện danh sách
            </button>
          </section>
        ) : (
          /* ══ CHẾ ĐỘ DANH SÁCH ══ */
          <>
            {header}

            {busy ? (
              <>
                <div className="mb-6 grid gap-5 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <PropertyCardSkeleton variant="horizontal" />
                  </div>
                  <div className="h-[280px] animate-pulse rounded-2xl bg-gray-200 lg:h-auto" />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(SKELETON_COUNT)].map((_, i) => (
                    <PropertyCardSkeleton key={i} variant="grid" />
                  ))}
                </div>
              </>
            ) : properties.length === 0 ? (
              emptyState
            ) : (
              <>
                {/* ── Hàng đầu: tin nổi bật 2/3 + bản đồ preview 1/3 ── */}
                <div className="mb-6 grid items-stretch gap-5 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <FeaturedPropertyCard property={featured} />
                  </div>

                  <div className="relative min-h-[280px] overflow-hidden rounded-2xl border border-gray-200 shadow-sm md:col-span-1">
                    {/* Xem trước: có nút +/- và kéo được, nhưng tắt zoom bằng con lăn để không cướp
                        thao tác cuộn trang. Muốn đầy đủ thì mở chế độ bản đồ. */}
                    <PropertyMapView
                      properties={properties}
                      highlightedId={hoveredId}
                      scrollZoom={false}
                      className="h-full w-full"
                    />
                    <button
                      type="button"
                      onClick={showMapView}
                      className="absolute left-1/2 top-3 z-10 flex max-w-[calc(100%-5.5rem)] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-gray-900 shadow-[0_4px_16px_rgba(0,0,0,0.18)] transition-colors hover:bg-gray-50"
                    >
                      <MapIcon className="h-4 w-4 text-primary" />
                      Xem tất cả kết quả trên bản đồ
                    </button>
                  </div>
                </div>

                {/* ── Tin #2 trở đi: full width, lưới 3 cột, thẻ dọc ── */}
                {gridProperties.length > 0 && (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {gridProperties.map((property, index) => (
                      <div
                        key={property.id}
                        id={`prop-${property.id}`}
                        onMouseEnter={() => setHoveredId(property.id)}
                        onMouseLeave={() => setHoveredId((cur) => (cur === property.id ? null : cur))}
                        className={`animate-fade-in-up stagger-${Math.min(index + 1, 8)} rounded-2xl opacity-0 transition-shadow ${
                          String(hoveredId) === String(property.id) ? 'ring-2 ring-primary ring-offset-2' : ''
                        }`}
                      >
                        <ListingGridCard property={property} />
                      </div>
                    ))}
                  </div>
                )}

                <ListingPagination
                  currentPage={apiPagination.current_page}
                  lastPage={apiPagination.last_page}
                  total={apiPagination.total}
                  perPage={apiPagination.per_page}
                  onChange={changePage}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PropertyListingLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
        <div className="mb-6 h-10 w-1/3 animate-pulse rounded bg-gray-200" />
        <div className="mb-6 grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PropertyCardSkeleton variant="horizontal" />
          </div>
          <div className="h-[280px] animate-pulse rounded-2xl bg-gray-200 lg:h-auto" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(SKELETON_COUNT)].map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PropertyListingPage({ type }: { type: ListingType }) {
  return (
    <Suspense fallback={<PropertyListingLoading />}>
      <PropertyListingContent type={type} />
    </Suspense>
  );
}
