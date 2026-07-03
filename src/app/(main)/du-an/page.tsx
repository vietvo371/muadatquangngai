'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  MapPin,
  Building,
  ChevronRight,
  ChevronLeft,
  Search,
  RotateCcw,
} from 'lucide-react';
import { formatPrice, slugify } from '@/lib/formatters';
import { ProjectListCard } from '@/components/project/ProjectListCard';
import { ContactDialog } from '@/components/shared/ContactDialog';
import { useProjects } from '@/hooks/useProjects';

const PAGE_SIZE = 4;

const projects = [
  {
    id: '1',
    slug: 'de-palace-river-nam-song-tra-khuc',
    name: 'De Palace River - Nam Sông Trà Khúc',
    developer: 'Công ty CP Địa Ốc Quảng Ngãi',
    thumbnail: '/images/image_data/nha-pho-de-palace-river.jpg',
    status: 'selling',
    type: 'apartment',
    district: 'tp-quang-ngai',
    address: 'Đầu cầu Thạch Bích, TP Quảng Ngãi',
    priceFrom: 4500000000,
    priceTo: 8500000000,
    totalUnits: 256,
    totalBlocks: 2,
    totalFloors: 18,
    handoverDate: '2025-12-31',
    description: 'Khu căn hộ cao cấp ven sông Trà Khúc, tầm view đẹp, tiện ích đầy đủ. Vị trí đắc địa ngay đầu cầu Thạch Bích, kết nối giao thông thuận tiện.',
    area: '2.5 ha',
    featured: true,
  },
  {
    id: '2',
    slug: 'starlight-bac-huynh-thuc-khang',
    name: 'Starlight - Bắc Huỳnh Thúc Kháng',
    developer: 'Công ty CP Đầu tư Starlight',
    thumbnail: '/images/image_data/Starlight---suc-hut-den-tu-vi-tri-dac-dia-nhat-trung-tam-Quang-Ngai-suc-hut-3-1733900371-424-width1000height563.jpg',
    status: 'upcoming',
    type: 'apartment',
    district: 'tp-quang-ngai',
    address: 'Huỳnh Thúc Kháng, Ngọc Bảo Viên, TP Quảng Ngãi',
    priceFrom: 3200000000,
    priceTo: 6000000000,
    totalUnits: 400,
    totalBlocks: 3,
    totalFloors: 22,
    handoverDate: '2026-06-30',
    description: 'Dự án căn hộ cao cấp tại vị trí đắc địa bậc nhất trung tâm Quảng Ngãi, tiện ích hiện đại, không gian sống xanh.',
    area: '3.2 ha',
    featured: true,
  },
  {
    id: '3',
    slug: 'kdc-nghia-giang',
    name: 'Khu dân cư Nghĩa Giang',
    developer: 'Công ty TNHH Đầu tư Nghĩa Giang',
    thumbnail: '/images/image_data/z7727089471705_b45383cbfb0c02dbb327ef0ea9fd2f7e.jpg',
    status: 'selling',
    type: 'land',
    district: 'tu-nghia',
    address: 'Nghĩa Thuận, Tư Nghĩa, Quảng Ngãi',
    priceFrom: 300000000,
    priceTo: 800000000,
    totalUnits: 150,
    totalBlocks: 1,
    totalFloors: 1,
    handoverDate: '2025-06-30',
    description: 'Khu đất nền phân lô sổ đỏ từng nền, hạ tầng hoàn chỉnh, giá hợp lý, pháp lý rõ ràng.',
    area: '5 ha',
    featured: false,
  },
  {
    id: '4',
    slug: 'nha-pho-phan-dinh-phung',
    name: 'Nhà phố thương mại Phan Đình Phùng',
    developer: 'Công ty CP Xây dựng Hoàng Long',
    thumbnail: '/images/image_data/banner_hero.jpg',
    status: 'selling',
    type: 'townhouse',
    district: 'tp-quang-ngai',
    address: 'Phan Đình Phùng, TP Quảng Ngãi',
    priceFrom: 4500000000,
    priceTo: 7000000000,
    totalUnits: 40,
    totalBlocks: 1,
    totalFloors: 5,
    handoverDate: '2025-03-31',
    description: 'Nhà phố thương mại mặt tiền đường lớn, vị trí kinh doanh sầm uất trung tâm TP Quảng Ngãi.',
    area: '0.8 ha',
    featured: false,
  },
  {
    id: '5',
    slug: 'haus-coastal-duc-pho',
    name: 'Haus Coastal - Đức Phổ',
    developer: 'Công ty CP BĐS Haus',
    thumbnail: '/images/image_data/Haus-Coastal.jpg',
    status: 'upcoming',
    type: 'villa',
    district: 'duc-pho',
    address: 'Ven biển Sa Huỳnh, TX Đức Phổ, Quảng Ngãi',
    priceFrom: 8000000000,
    priceTo: 20000000000,
    totalUnits: 60,
    totalBlocks: 1,
    totalFloors: 3,
    handoverDate: '2027-01-01',
    description: 'Biệt thự nghỉ dưỡng ven biển Sa Huỳnh, phong cách kiến trúc Địa Trung Hải, không gian sống đẳng cấp.',
    area: '4 ha',
    featured: true,
  },
];

const statusConfig = {
  upcoming: { label: 'Sắp mở bán', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400' },
  selling:  { label: 'Đang mở bán', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  completed:{ label: 'Đã bàn giao', bg: 'bg-gray-100',  text: 'text-gray-600',  dot: 'bg-gray-400'  },
  paused:   { label: 'Tạm dừng',    bg: 'bg-yellow-100',text: 'text-yellow-700',dot: 'bg-yellow-400' },
  draft:     { label: 'Bản nháp',    bg: 'bg-gray-100',  text: 'text-gray-600',  dot: 'bg-gray-400'  },
  published: { label: 'Đã xuất bản',  bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  archived:  { label: 'Đã lưu trữ',  bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-400' },
};

const typeConfig: Record<string, string> = {
  apartment: 'Căn hộ chung cư',
  villa: 'Biệt thự',
  townhouse: 'Nhà phố',
  commercial: 'Thương mại',
  land: 'Đất nền',
};

const districts = [
  { value: 'all', label: 'Tất cả khu vực' },
  { value: 'tp-quang-ngai', label: 'TP Quảng Ngãi' },
  { value: 'tu-nghia', label: 'Tư Nghĩa' },
  { value: 'son-tinh', label: 'Sơn Tịnh' },
  { value: 'binh-son', label: 'Bình Sơn' },
  { value: 'duc-pho', label: 'TX Đức Phổ' },
  { value: 'mo-duc', label: 'Mộ Đức' },
  { value: 'minh-long', label: 'Minh Long' },
];

const types = [
  { value: 'all', label: 'Tất cả loại hình' },
  { value: 'apartment', label: 'Căn hộ chung cư' },
  { value: 'villa', label: 'Biệt thự' },
  { value: 'townhouse', label: 'Nhà phố' },
  { value: 'land', label: 'Đất nền' },
  { value: 'commercial', label: 'Thương mại' },
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

function matchPrice(priceFrom: number, range: string) {
  if (range === 'all') return true;
  if (range === 'under1b') return priceFrom < 1_000_000_000;
  if (range === '1b-3b')   return priceFrom >= 1_000_000_000 && priceFrom < 3_000_000_000;
  if (range === '3b-5b')   return priceFrom >= 3_000_000_000 && priceFrom < 5_000_000_000;
  if (range === 'over5b')  return priceFrom >= 5_000_000_000;
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapApiProject = (apiProj: any) => {
  return {
    id: apiProj.id.toString(),
    slug: apiProj.slug,
    name: apiProj.name,
    developer: apiProj.developer || 'Chủ đầu tư',
    thumbnail: apiProj.thumbnail || '/images/image_data/nha-pho-de-palace-river.jpg',
    status: apiProj.status || 'selling',
    type: apiProj.type || 'apartment',
    district: (() => {
      const name = apiProj.location?.district?.name || apiProj.district;
      if (!name) return 'tp-quang-ngai';
      const clean = name
        .toLowerCase()
        .replace(/huyện/g, '')
        .replace(/thành phố/g, '')
        .replace(/thị xã/g, '')
        .replace(/tp\./g, '')
        .replace(/tx\./g, '')
        .trim();
      const slug = slugify(clean);
      if (slug === 'quang-ngai') return 'tp-quang-ngai';
      return slug;
    })(),
    address: apiProj.location?.address || 'Quảng Ngãi',
    priceFrom: Number(apiProj.price?.from || 0),
    priceTo: apiProj.price?.to ? Number(apiProj.price.to) : undefined,
    totalUnits: apiProj.scale?.total_units || 0,
    totalBlocks: apiProj.scale?.total_blocks || 0,
    totalFloors: apiProj.scale?.total_floors || 0,
    handoverDate: apiProj.handover_date || '2025-12-31',
    description: apiProj.description || 'Dự án bất động sản Quảng Ngãi',
    area: apiProj.scale?.total_area ? `${apiProj.scale.total_area} ha` : 'N/A',
    featured: true,
  };
};

function DuAnPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [slide, setSlide] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);

  // Khởi tạo bộ lọc trực tiếp từ URL Query Parameters nếu có (ngăn mất dữ liệu khi F5)
  const [typeFilter, setTypeFilter] = useState(() => searchParams?.get('type') || 'all');
  const [districtFilter, setDistrictFilter] = useState(() => searchParams?.get('district') || 'all');
  const [statusFilter, setStatusFilter] = useState(() => searchParams?.get('status') || 'all');
  const [priceFilter, setPriceFilter] = useState(() => searchParams?.get('price') || 'all');
  const [search, setSearch] = useState(() => searchParams?.get('q') || '');
  const [page, setPage] = useState(() => Number(searchParams?.get('page') || '1'));

  // Đồng bộ hóa trạng thái bộ lọc ngược lại URL Search Params bất cứ khi nào thay đổi
  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (districtFilter !== 'all') params.set('district', districtFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (priceFilter !== 'all') params.set('price', priceFilter);
    if (search.trim()) params.set('q', search.trim());
    if (page > 1) params.set('page', String(page));

    const currentPath = pathname || '/du-an';
    const queryString = params.toString();
    const newUrl = queryString ? `${currentPath}?${queryString}` : currentPath;
    router.replace(newUrl, { scroll: false });
  }, [typeFilter, districtFilter, statusFilter, priceFilter, search, page, pathname, router]);

  // Real API integration state
  const { fetchProjects } = useProjects();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [apiProjects, setApiProjects] = useState<any[]>([]);
  const [useRealApi, setUseRealApi] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      const res = await fetchProjects();
      if (res.success && res.data && res.data.length > 0) {
        setApiProjects(res.data.map(mapApiProject));
        setUseRealApi(true);
      } else {
        setUseRealApi(false);
      }
    };
    loadProjects();
  }, [fetchProjects]);

  const resetFilters = () => {
    setTypeFilter('all'); setDistrictFilter('all');
    setStatusFilter('all'); setPriceFilter('all');
    setSearch(''); setPage(1);
  };

  const isDirty = typeFilter !== 'all' || districtFilter !== 'all' || statusFilter !== 'all' || priceFilter !== 'all' || search !== '';

  const activeProjectsList = useMemo(() => {
    return useRealApi ? apiProjects : projects;
  }, [useRealApi, apiProjects]);

  const filtered = useMemo(() => {
    return activeProjectsList.filter((p) => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (districtFilter !== 'all' && p.district !== districtFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!matchPrice(p.priceFrom, priceFilter)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.address.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [activeProjectsList, typeFilter, districtFilter, statusFilter, priceFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const featured = useMemo(() => {
    return activeProjectsList.filter((p) => p.featured).slice(0, 4);
  }, [activeProjectsList]);

  const sliderProjects = useMemo(() => {
    return activeProjectsList.filter((p) => p.featured);
  }, [activeProjectsList]);

  const prevSlide = () => setSlide((s) => (s - 1 + sliderProjects.length) % sliderProjects.length);
  const nextSlide = () => setSlide((s) => (s + 1) % sliderProjects.length);
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══ HERO SLIDER ══ */}
      <div className="relative w-full h-[320px] md:h-[420px] overflow-hidden bg-gray-900 select-none">
        {sliderProjects.map((p, i) => (
          <div
            key={p.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === slide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <Image
              src={p.thumbnail}
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
                {(() => {
                  const st = statusConfig[p.status as keyof typeof statusConfig] || statusConfig['selling'];
                  return (
                    <span className={`inline-flex items-center gap-1.5 ${st.bg} ${st.text} text-xs font-semibold px-3 py-1 rounded-full mb-3`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  );
                })()}
                <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg leading-tight mb-1">
                  {p.name}
                </h2>
                <p className="text-white/80 text-sm flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {p.address}
                </p>
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
            <p className="text-sm text-gray-500 mb-4">
              Tìm thấy <span className="font-semibold text-gray-900">{filtered.length}</span> dự án tại Quảng Ngãi
            </p>

            <div className="flex flex-col gap-4">
              {paginated.map((project) => (
                <ProjectListCard
                  key={project.id}
                  project={project}
                  status={statusConfig[project.status as keyof typeof statusConfig] || statusConfig['selling']}
                  typeLabel={typeConfig[project.type]}
                />
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
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="hidden xl:block w-64 shrink-0 space-y-4">
            {/* Dự án nổi bật */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <h3 className="text-sm font-semibold text-gray-800">Dự án nổi bật</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {featured.map((project) => {
                  const st = statusConfig[project.status as keyof typeof statusConfig] || statusConfig['selling'];
                  return (
                    <Link
                      key={project.id}
                      href={`/du-an/${project.slug}`}
                      className="flex gap-3 p-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="relative w-20 h-16 shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={project.thumbnail}
                          alt={project.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="80px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-primary transition-colors leading-snug mb-1">
                          {project.name}
                        </p>
                        <p className={`text-xs font-medium ${st.text}`}>{st.label}</p>
                        <p className="mt-0.5 text-xs font-bold text-primary">{formatPrice(project.priceFrom)}</p>
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
