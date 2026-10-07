'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  Building,
  ChevronRight,
  ChevronLeft,
  Search,
  RotateCcw,
} from 'lucide-react';
import { ProjectListCard } from '@/components/project/ProjectListCard';
import { ContactDialog } from '@/components/shared/ContactDialog';
import { ErrorState } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { PROJECT_TYPE_OPTIONS } from '@/lib/project-type';
import { apiGet, toApiError, type ApiError } from '@/lib/api-client';
import { adaptList, adaptProject } from '@/lib/project/adapters';
import { projectDistrictKey } from '@/lib/project/links';
import { projectAddress } from '@/lib/project/fields';
import { formatMoney } from '@/lib/display-format';
import { urlParam, useUrlState } from '@/hooks/useUrlState';
import type { Project } from '@/lib/project/types';

const PAGE_SIZE = 4;


const types = [
  { value: 'all', label: 'Tất cả loại hình' },
  ...PROJECT_TYPE_OPTIONS,
];

const statuses = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'selling', label: 'Đang mở bán' },
  { value: 'upcoming', label: 'Sắp mở bán' },
  { value: 'completed', label: 'Đã bàn giao' },
];

const priceRanges = [
  { value: 'all', label: 'Tất cả mức giá' },
  { value: 'under1b', label: 'Dưới 1 tỷ' },
  { value: '1b-3b', label: '1 – 3 tỷ' },
  { value: '3b-5b', label: '3 – 5 tỷ' },
  { value: 'over5b', label: 'Trên 5 tỷ' },
];

function matchPrice(priceFrom: number | null, range: string) {
  if (range === 'all') return true;
  // Dự án chưa công bố giá không khớp khoảng giá nào — không xếp đại vào "Dưới 1 tỷ".
  if (priceFrom === null) return false;
  if (range === 'under1b') return priceFrom < 1_000_000_000;
  if (range === '1b-3b')   return priceFrom >= 1_000_000_000 && priceFrom < 3_000_000_000;
  if (range === '3b-5b')   return priceFrom >= 3_000_000_000 && priceFrom < 5_000_000_000;
  if (range === 'over5b')  return priceFrom >= 5_000_000_000;
  return true;
}

/**
 * Bộ lọc lưu trên URL (Notion 07/10 "URL State"). Khai báo ở cấp module để tham chiếu không
 * đổi giữa các lần render.
 */
const URL_PARAMS = {
  type: urlParam.text('type', 40),
  district: urlParam.text('district', 60),
  status: urlParam.text('status', 20),
  price: urlParam.oneOf('price', ['all', 'under1b', '1b-3b', '3b-5b', 'over5b'] as const, 'all'),
  q: urlParam.text('q'),
  page: urlParam.page('page'),
};

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; projects: Project[] }
  | { status: 'error'; error: ApiError };

function DuAnPageContent() {
  const [slide, setSlide] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);

  const [filters, setFilters] = useUrlState(URL_PARAMS);
  const typeFilter = filters.type || 'all';
  const districtFilter = filters.district || 'all';
  const statusFilter = filters.status || 'all';
  const priceFilter = filters.price;
  const search = filters.q;
  const page = filters.page;

  // Đổi bộ lọc nào cũng về trang 1, nếu không dễ rơi vào một trang trống.
  const setTypeFilter = (v: string) => setFilters({ type: v === 'all' ? '' : v, page: 1 });
  const setDistrictFilter = (v: string) => setFilters({ district: v === 'all' ? '' : v, page: 1 });
  const setStatusFilter = (v: string) => setFilters({ status: v === 'all' ? '' : v, page: 1 });
  const setPriceFilter = (v: string) => setFilters({ price: v as typeof filters.price, page: 1 });
  const setSearch = (v: string) => setFilters({ q: v, page: 1 });
  const setPage = (next: number | ((p: number) => number)) =>
    setFilters({ page: typeof next === 'function' ? next(page) : next });

  // Chỉ dữ liệu thật. Trước đây API lỗi hoặc trả rỗng thì trang lặng lẽ hiện một danh sách dự án
  // viết cứng trong code (tên, giá, ảnh bịa) — người xem không có cách nào biết đó là giả.
  // "Đang tải" suy ra từ việc kết quả đang giữ có thuộc lượt tải hiện tại hay không, thay vì
  // setState ngay đầu effect (bắt React render thêm một lượt).
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<{ key: number; state: LoadState } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const key = reloadKey;
    apiGet<{ data?: unknown }>('/api/v2/projects', { params: { per_page: 100 }, signal: controller.signal })
      .then((res) => setResult({ key, state: { status: 'ready', projects: adaptList(res?.data, adaptProject) } }))
      .catch((error: unknown) => {
        const apiError = toApiError(error);
        if (apiError.code !== 'ABORTED') setResult({ key, state: { status: 'error', error: apiError } });
      });
    return () => controller.abort();
  }, [reloadKey]);
  const load = useMemo<LoadState>(
    () => (result?.key === reloadKey ? result.state : { status: 'loading' }),
    [result, reloadKey]
  );

  const resetFilters = () => setFilters({ type: '', district: '', status: '', price: 'all', q: '', page: 1 });

  const isDirty = typeFilter !== 'all' || districtFilter !== 'all' || statusFilter !== 'all' || priceFilter !== 'all' || search !== '';

  const activeProjectsList = useMemo(() => (load.status === 'ready' ? load.projects : []), [load]);

  // Khu vực lấy từ chính các dự án đang có — tên xã/phường MỚI sau sáp nhập 2025. Danh sách cũ
  // gõ cứng tên huyện trước sáp nhập (Tư Nghĩa, Sơn Tịnh...) nên chọn mục nào cũng ra rỗng.
  const districts = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of activeProjectsList) {
      const key = projectDistrictKey(p.location.district);
      if (key && p.location.district && !seen.has(key)) seen.set(key, p.location.district);
    }
    const options = [...seen.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], 'vi'))
      .map(([value, label]) => ({ value, label }));
    return [{ value: 'all', label: 'Tất cả khu vực' }, ...options];
  }, [activeProjectsList]);

  const filtered = useMemo(() => {
    return activeProjectsList.filter((p) => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (districtFilter !== 'all' && projectDistrictKey(p.location.district) !== districtFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!matchPrice(p.priceFrom, priceFilter)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const address = (projectAddress(p) ?? '').toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !address.includes(q)) return false;
      }
      return true;
    });
  }, [activeProjectsList, typeFilter, districtFilter, statusFilter, priceFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // API không có cờ "nổi bật" — gọi đúng tên là dự án mới, thay vì gắn nhãn nổi bật cho tất cả.
  const featured = useMemo(() => activeProjectsList.slice(0, 4), [activeProjectsList]);

  // Băng chuyền đầu trang chỉ dùng dự án có ảnh thật.
  const sliderProjects = useMemo(() => activeProjectsList.filter((p) => p.images.length > 0), [activeProjectsList]);

  const prevSlide = () => setSlide((s) => (s - 1 + sliderProjects.length) % sliderProjects.length);
  const nextSlide = () => setSlide((s) => (s + 1) % sliderProjects.length);
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══ HERO SLIDER ══ — chỉ hiện khi có dự án có ảnh thật. */}
      {sliderProjects.length > 0 && (
      <div className="relative w-full h-[320px] md:h-[420px] overflow-hidden bg-gray-900 select-none">
        {sliderProjects.map((p, i) => (
          <div
            key={p.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === slide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <Image
              src={p.images[0]}
              alt={p.name}
              fill
              className="object-cover object-center"
              priority={i === 0}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

            {/* Slide content */}
            <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-8 md:pb-10 z-10">
              <div className="max-w-[1152px] mx-auto">
                {p.statusLabel && (
                  <span className="mb-3 inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-primary">
                    {p.statusLabel}
                  </span>
                )}
                <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg leading-tight mb-1">
                  {p.name}
                </h2>
                {projectAddress(p) && (
                  <p className="text-white/80 text-sm flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {projectAddress(p)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 right-6 md:right-10 z-20 flex items-center gap-1.5">
          {sliderProjects.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`rounded-full transition-all ${i === slide ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      </div>

      )}

      {/* ══ FILTER BAR ══ */}
      <div className="sticky top-[60px] z-30 border-b border-gray-200 bg-gray-50">
        <div className="max-w-[1152px] mx-auto px-4 py-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex flex-wrap gap-3 items-end">

          {/* Search */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <label className="text-[10px] text-gray-400 font-medium px-1 mb-0.5 block">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tên dự án, địa chỉ..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-primary text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="w-px h-8 bg-gray-100 hidden sm:block self-end mb-0.5" />

          {/* Khu vực */}
          <div className="flex flex-col">
            <label className="text-[10px] text-gray-400 font-medium px-1 mb-0.5">Khu vực</label>
            <select
              value={districtFilter}
              onChange={(e) => { setDistrictFilter(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-primary cursor-pointer font-medium min-w-[130px]"
            >
              {districts.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          {/* Loại hình */}
          <div className="flex flex-col">
            <label className="text-[10px] text-gray-400 font-medium px-1 mb-0.5">Loại hình</label>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-primary cursor-pointer font-medium min-w-[130px]"
            >
              {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Khoảng giá */}
          <div className="flex flex-col">
            <label className="text-[10px] text-gray-400 font-medium px-1 mb-0.5">Khoảng giá</label>
            <select
              value={priceFilter}
              onChange={(e) => { setPriceFilter(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-primary cursor-pointer font-medium min-w-[130px]"
            >
              {priceRanges.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Trạng thái */}
          <div className="flex flex-col">
            <label className="text-[10px] text-gray-400 font-medium px-1 mb-0.5">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-primary cursor-pointer font-medium min-w-[120px]"
            >
              {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Reset */}
          <button
            onClick={resetFilters}
            disabled={!isDirty}
            title="Đặt lại bộ lọc"
            className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors self-end"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          </div>{/* end card */}
        </div>
      </div>

      {/* ══ BREADCRUMB ══ */}
      <div className="max-w-[1152px] mx-auto px-4 pt-4 pb-1 flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-800 font-medium">Dự án bất động sản Quảng Ngãi</span>
      </div>

      {/* ══ MAIN LAYOUT ══ */}
      <div className="max-w-[1152px] mx-auto px-4 py-4">
        <div className="flex gap-6 items-start">

          {/* ── Project list ── */}
          <div className="flex-1 min-w-0">
            {load.status === 'loading' && (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-52 w-full rounded-2xl" />
                ))}
              </div>
            )}
            {load.status === 'error' && <ErrorState error={load.error} onRetry={() => setReloadKey((k) => k + 1)} />}
            {load.status === 'ready' && (
            <>
            <p className="text-sm text-gray-500 mb-4">
              Tìm thấy <span className="font-semibold text-gray-900">{filtered.length}</span> dự án tại Quảng Ngãi
            </p>

            <div className="flex flex-col gap-4">
              {paginated.map((project) => (
                <ProjectListCard key={project.id} project={project} />
              ))}
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                <Building className="h-14 w-14 mx-auto text-gray-200 mb-3" />
                <h3 className="text-base font-semibold text-gray-800 mb-1">Không tìm thấy dự án</h3>
                <p className="text-sm text-gray-400 mb-4">Thử thay đổi bộ lọc để xem thêm dự án</p>
                <button onClick={resetFilters} className="text-sm text-primary hover:underline">
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === p
                        ? 'bg-primary text-white'
                        : 'border border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
            </>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="hidden xl:block w-64 shrink-0 space-y-4">
            {/* Dự án mới cập nhật */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <h3 className="text-sm font-semibold text-gray-800">Dự án mới cập nhật</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {featured.map((project) => {
                  const price = formatMoney(project.priceFrom);
                  return (
                    <Link
                      key={project.id}
                      href={`/du-an/${project.slug}`}
                      className="flex gap-3 p-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="relative w-20 h-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {project.images[0] && (
                          <Image
                            src={project.images[0]}
                            alt={project.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="80px"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-primary transition-colors leading-snug mb-1">
                          {project.name}
                        </p>
                        {project.statusLabel && <p className="text-xs font-medium text-gray-500">{project.statusLabel}</p>}
                        {price && <p className="mt-0.5 text-xs font-bold text-primary">Từ {price}</p>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* CTA tư vấn */}
            <div className="bg-primary rounded-xl p-4 text-white">
              <h3 className="text-sm font-bold mb-1">Cần tư vấn dự án?</h3>
              <p className="text-xs text-white/80 mb-3">
                Liên hệ chuyên viên để được hỗ trợ miễn phí và nhanh nhất
              </p>
              <button
                onClick={() => setContactOpen(true)}
                className="block w-full text-center bg-white text-primary text-sm font-semibold py-2 rounded-lg hover:bg-primary-light transition-colors"
              >
                Liên hệ tôi
              </button>
            </div>
          </aside>

        </div>
      </div>

      <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}

// Default export được bọc trong Suspense để tối ưu hóa SSR và ngăn deoptimization trong Next.js App Router
export default function DuAnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-xs font-semibold text-gray-400">Đang tải danh sách dự án...</p>
        </div>
      }
    >
      <DuAnPageContent />
    </Suspense>
  );
}
