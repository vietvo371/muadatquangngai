import Image from 'next/image';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { SectionHeading } from '@/components/home/SectionHeading';
import { SearchBar } from '@/components/home/SearchBar';
import { ProjectCard } from '@/components/home/ProjectCard';
import { ListingsSection } from '@/components/home/ListingsSection';
import { NewsCarousel } from '@/components/home/NewsCarousel';
import { PartnerCarousel } from '@/components/home/PartnerCarousel';
import { BannerSection } from '@/components/home/BannerSection';

/* ─────────────────────── DATA ─────────────────────── */

const featuredProjects = [
  {
    id: 1,
    name: 'De Palace River - Nam Sông Trà Khúc',
    area: '1,6 ha',
    address: 'Đầu cầu Thạch Bích, Quảng Ngãi',
    status: 'Đang mở bán',
    image: '/images/image_data/nha-pho-de-palace-river.jpg',
    slug: 'de-palace-river',
    developer: 'Công ty CP Địa Ốc Quảng Ngãi',
  },
  {
    id: 2,
    name: 'Starlight - Bắc Huỳnh Thúc Kháng',
    area: '1,6 ha',
    address: 'Huỳnh Thúc Kháng, Ngọc Bảo Viên, Quảng Ngãi',
    status: 'Đang mở bán',
    image: '/images/image_data/Starlight---suc-hut-den-tu-vi-tri-dac-dia-nhat-trung-tam-Quang-Ngai-suc-hut-3-1733900371-424-width1000height563.jpg',
    slug: 'starlight-bac-huynh-thuc-khang',
    developer: 'Công ty CP Đầu tư Starlight',
  },
];

const locations = [
  {
    name: 'TP Quảng Ngãi',
    count: '100 tin đăng',
    image: '/images/image_data/thi_tran_9b705.jpg',
    href: '/mua-ban?location=quang-ngai',
    large: true,
  },
  {
    name: 'Lý Sơn',
    count: '55 tin đăng',
    image: '/images/image_data/shutterstock2065827521lyson-1701400873758.jpg',
    href: '/mua-ban?location=ly-son',
  },
  {
    name: 'Mộ Đức',
    count: '11 tin đăng',
    image: '/images/image_data/74229_youtub_e_2024_06_24_21_09_still5771_15574131.jpg',
    href: '/mua-ban?location=mo-duc',
  },
  {
    name: 'Bình Sơn',
    count: '99 tin đăng',
    image: '/images/image_data/du-lich-binh-son-quang-ngai-phan-van-travel-1.webp',
    href: '/mua-ban?location=binh-son',
  },
  {
    name: 'Măng Đen',
    count: '14 tin đăng',
    image: '/images/image_data/images.jpeg',
    href: '/mua-ban?location=mang-den',
  },
];

const newsItems = [
  {
    id: 1,
    index: '01',
    title: 'Đảo Ngọc tại Quảng Ngãi do Sun Group đầu tư',
    category: 'Dự án',
    date: '15/04/2026',
    excerpt: 'Sun Group chính thức công bố kế hoạch phát triển khu du lịch đảo Lý Sơn với tổng vốn đầu tư lên tới 5.000 tỷ đồng.',
    image: '/images/image_data/Haus-Coastal.jpg',
    href: '/tin-tuc/dao-ngoc-sun-group',
    featured: true,
  },
  {
    id: 2,
    index: '02',
    title: 'Chủ đầu tư Coastal Quảng Ngãi chính thức khởi công dự án',
    category: 'Thị trường',
    date: '12/04/2026',
    image: '/images/image_data/IMG_5828 2.jpg',
    href: '/tin-tuc/coastal-quang-ngai-khoi-cong',
    excerpt: 'Lễ khởi công được tổ chức long trọng với sự tham dự của lãnh đạo tỉnh và các đối tác chiến lược.',
  },
  {
    id: 3,
    index: '03',
    title: 'De Palace River Nam Sông Trà – Sản phẩm không dành cho số đông',
    category: 'Phân tích',
    date: '10/04/2026',
    image: '/images/image_data/nha-pho-de-palace-river.jpg',
    href: '/tin-tuc/de-palace-river-phan-tich',
    excerpt: 'Phân tích chi tiết về tiềm năng tăng giá và lợi thế vị trí của dự án ven sông Trà Khúc.',
  },
];

const utilities = [
  {
    name: 'Xem tuổi xây nhà',
    sub: 'Chọn năm sinh hợp mệnh',
    icon: '/images/icons/icon-tuoi-xay-nha.svg',
    href: '#',
    accent: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    name: 'Chi phí xây nhà',
    sub: 'Tính toán ngân sách chi tiết',
    icon: '/images/icons/icon-chi-phi-xay-nha.svg',
    href: '#',
    accent: '#10B981',
    bg: '#ECFDF5',
  },
  {
    name: 'Tính lãi suất vay',
    sub: 'So sánh lãi suất ngân hàng',
    icon: '/images/icons/icon-lai-suat.svg',
    href: '#',
    accent: '#F97316',
    bg: '#FFF7ED',
  },
  {
    name: 'Tư vấn phong thuỷ',
    sub: 'Hướng nhà hợp phong thuỷ',
    icon: '/images/icons/icon-phong-thuy.svg',
    href: '#',
    accent: '#7C3AED',
    bg: '#F5F3FF',
  },
];

const partners = [
  { name: 'Địa Ốc Quảng Ngãi', logo: '/images/doanh_nghiep/4.png' },
  { name: 'Thiên Minh Capital', logo: '/images/doanh_nghiep/5.png' },
  { name: 'Hoàng Hồ Group', logo: '/images/doanh_nghiep/6.png' },
  { name: 'Cát Tường Group', logo: '/images/doanh_nghiep/2.png' },
  { name: 'Starlight Invest', logo: '/images/doanh_nghiep/1.png' },
  { name: 'Haus Coastal', logo: '/images/doanh_nghiep/3.png' },
];


const pressNews = [
  {
    id: 1,
    title: 'Mua bán nhà đất ở 4 khu vực quan trọng tại Quảng Ngãi',
    category: 'Thị trường',
    date: '15/04/2026',
    image: '/images/image_data/thi_tran_9b705.jpg',
    href: '/tin-tuc/mua-ban-nha-dat-quang-ngai',
  },
  {
    id: 2,
    title: 'Bất chấp triều cổ giảm, giá nhà đổi vẫn tăng mạnh',
    category: 'Phân tích',
    date: '14/04/2026',
    image: '/images/image_data/Haus-Coastal.jpg',
    href: '/tin-tuc/gia-nha-tang-manh',
  },
  {
    id: 3,
    title: 'Lợi ích cho cả hai bên muốn hoà giải muốn bất động sản 6 tháng',
    category: 'Pháp lý',
    date: '13/04/2026',
    image: '/images/image_data/du-lich-binh-son-quang-ngai-phan-van-travel-1.webp',
    href: '/tin-tuc/phap-ly-bat-dong-san',
  },
  {
    id: 4,
    title: 'Công ty mẹ Batdongsan.com.vn lãi 92 tỷ, tăng trưởng ổn định',
    category: 'Doanh nghiệp',
    date: '12/04/2026',
    image: '/images/image_data/nha-pho-de-palace-river.jpg',
    href: '/tin-tuc/cong-ty-me-bds',
  },
  {
    id: 5,
    title: 'Starlight Quảng Ngãi – điểm sáng thị trường BDS miền Trung',
    category: 'Dự án',
    date: '11/04/2026',
    image: '/images/image_data/Starlight---suc-hut-den-tu-vi-tri-dac-dia-nhat-trung-tam-Quang-Ngai-suc-hut-3-1733900371-424-width1000height563.jpg',
    href: '/tin-tuc/starlight-quang-ngai',
  },
  {
    id: 6,
    title: 'Lý Sơn – Hòn đảo bất động sản tiếp theo cần theo dõi năm 2026',
    category: 'Phân tích',
    date: '10/04/2026',
    image: '/images/image_data/shutterstock2065827521lyson-1701400873758.jpg',
    href: '/tin-tuc/ly-son-bat-dong-san-2026',
  },
];

const quickCategories = [
  { label: 'Nhà phố', href: '/mua-ban?cat=nha-pho' },
  { label: 'Đất nền', href: '/mua-ban?cat=dat-nen' },
  { label: 'Căn hộ', href: '/mua-ban?cat=can-ho' },
  { label: 'Biệt thự', href: '/mua-ban?cat=biet-thu' },
  { label: 'Mặt bằng', href: '/cho-thue?cat=mat-bang' },
  { label: 'Dự án', href: '/du-an' },
];

/* ─────────────────────── PAGE ─────────────────────── */

export default function HomePage() {
  return (
    <div className="flex flex-col bg-white">

      {/* ══════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════ */}
      <section className="relative h-[520px] md:h-[600px] lg:h-[660px] z-10">
        {/* Background image — clipped riêng để không clip dropdown */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/images/image_data/banner_hero.jpg"
            alt="Bất động sản Quảng Ngãi"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Multi-layer gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/5" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 gap-6">
          {/* Badge */}
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white text-xs font-medium tracking-wide">Cập nhật hàng ngày · 1,200+ tin xác thực</span>
          </div>

          {/* Headline */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white drop-shadow-xl leading-tight mb-3 tracking-tight">
              Mua bán bất động sản<br className="hidden sm:block" />
              <span className="text-red-400"> Quảng Ngãi</span>
            </h1>
            <p className="text-white/75 text-sm sm:text-base font-medium tracking-widest uppercase">
              Nhanh chóng&nbsp;·&nbsp;Uy tín&nbsp;·&nbsp;Minh bạch
            </p>
          </div>

          {/* Search */}
          <div className="w-full max-w-2xl md:max-w-3xl bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl relative z-50">
            <SearchBar />
          </div>

          {/* Quick category pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {quickCategories.map((cat) => (
              <Link key={cat.label} href={cat.href}>
                <span className="bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white text-xs font-medium px-4 py-1.5 rounded-full transition-all hover:border-white/40 cursor-pointer">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 2 — DỰ ÁN NỔI BẬT
      ══════════════════════════════════ */}
      <section className="py-14 md:py-20 px-4 bg-white relative z-0">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            title="Dự án nổi bật"
            subtitle="Những dự án được quan tâm nhất tại Quảng Ngãi"
            href="/du-an"
            linkLabel="Tất cả dự án"
          />
          <div className="flex flex-col gap-5">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 3 — BDS DÀNH CHO BẠN
      ══════════════════════════════════ */}
      <ListingsSection />

      {/* ══════════════════════════════════
          SECTION 4 — BANNER (from CMS)
      ══════════════════════════════════ */}
      <section className="py-6 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <BannerSection position="homepage_hero" />
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 5 — BDS THEO ĐỊA ĐIỂM
      ══════════════════════════════════ */}
      <section className="py-14 md:py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            title="Bất động sản theo địa điểm"
            subtitle="Khám phá BDS theo từng khu vực tại Quảng Ngãi"
          />

          {/* Mosaic grid */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
            style={{ gridTemplateRows: 'repeat(2, 210px)' }}
          >
            {/* TP Quảng Ngãi — large */}
            <Link
              href={locations[0].href}
              className="relative col-span-2 row-span-2 rounded-2xl overflow-hidden group shadow-md hover:shadow-xl transition-shadow"
            >
              <Image
                src={locations[0].image}
                alt={locations[0].name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute bottom-5 left-5 text-white">
                <div className="flex items-center gap-1.5 mb-2">
                  <MapPin className="h-4 w-4 text-red-400" />
                  <p className="font-black text-2xl drop-shadow">{locations[0].name}</p>
                </div>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium border border-white/20">
                  {locations[0].count}
                </span>
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-[#1075b1]/0 group-hover:bg-[#1075b1]/10 transition-colors duration-300" />
            </Link>

            {/* Small location cards */}
            {locations.slice(1).map((loc) => (
              <Link
                key={loc.name}
                href={loc.href}
                className="relative rounded-2xl overflow-hidden group shadow-sm hover:shadow-lg transition-shadow"
              >
                <Image
                  src={loc.image}
                  alt={loc.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  sizes="25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-[#1075b1]/0 group-hover:bg-[#1075b1]/10 transition-colors duration-300" />
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="font-bold text-sm drop-shadow">{loc.name}</p>
                  <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs border border-white/15">
                    {loc.count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 6 — TIN TỨC BDS
      ══════════════════════════════════ */}
      <section className="py-14 md:py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            title="Tin tức bất động sản"
            subtitle="Cập nhật thông tin mới nhất về thị trường BDS Quảng Ngãi"
            href="/tin-tuc"
            linkLabel="Xem tất cả"
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Featured news — large */}
            <Link href={newsItems[0].href} className="group lg:col-span-3">
              <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-4 shadow-md">
                <Image
                  src={newsItems[0].image}
                  alt={newsItems[0].title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="inline-block bg-primary text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
                    {newsItems[0].category}
                  </span>
                  <h3 className="text-white font-bold text-lg leading-snug drop-shadow-sm line-clamp-2 group-hover:text-white/80 transition-colors">
                    {newsItems[0].title}
                  </h3>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-1">{newsItems[0].date}</p>
              {newsItems[0].excerpt && (
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{newsItems[0].excerpt}</p>
              )}
            </Link>

            {/* Sidebar news */}
            <div className="lg:col-span-2 flex flex-col gap-0 divide-y divide-gray-100">
              {newsItems.slice(1).map((news) => (
                <Link key={news.id} href={news.href} className="group flex gap-4 items-start py-4 first:pt-0">
                  <div className="relative w-28 h-20 rounded-xl overflow-hidden shrink-0 shadow-sm">
                    <Image
                      src={news.image}
                      alt={news.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-primary-light text-primary text-xs font-semibold px-2 py-0.5 rounded-md">
                        {news.category}
                      </span>
                      <span className="text-xs text-gray-400">{news.date}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-primary transition-colors line-clamp-3">
                      {news.title}
                    </h3>
                  </div>
                </Link>
              ))}
              <div className="pt-4">
                <Link href="/tin-tuc" className="flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all">
                  Xem tất cả tin tức <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 7 — HỖ TRỢ TIỆN ÍCH
      ══════════════════════════════════ */}
      <section className="py-14 md:py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            title="Hỗ trợ tiện ích"
            subtitle="Công cụ dành cho người mua bán bất động sản"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {utilities.map(({ name, sub, icon, href, accent, bg }) => (
              <Link
                key={name}
                href={href}
                className="group flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-white border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300"
              >
                <div
                  className="h-20 w-20 shrink-0 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-sm"
                  style={{ background: bg }}
                >
                  <Image src={icon} alt={name} width={56} height={56} className="object-contain" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 leading-snug">
                    <span className="group-hover:text-primary transition-colors">{name}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{sub}</p>
                </div>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full transition-all"
                  style={{ background: bg, color: accent }}
                >
                  Xem ngay →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 8 — DOANH NGHIỆP TIÊU BIỂU
      ══════════════════════════════════ */}
      <section className="py-12 md:py-14 px-4 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            title="Doanh nghiệp tiêu biểu"
            subtitle="Các đối tác & chủ đầu tư uy tín tại Quảng Ngãi"
          />
          <PartnerCarousel partners={partners} />
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 9 — BÁO CHÍ NÓI VỀ (CAROUSEL)
      ══════════════════════════════════ */}
      <section className="py-14 md:py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="w-8 h-1 bg-primary rounded-full mb-3" />
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
                Báo chí nói về Batdongsan.com.vn
              </h2>
              <p className="text-sm text-gray-400 mt-1">Tin tức thị trường từ các nguồn uy tín</p>
            </div>
            <Link href="/tin-tuc" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all shrink-0">
              Tất cả tin tức <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <NewsCarousel items={pressNews} />
        </div>
      </section>

    </div>
  );
}
