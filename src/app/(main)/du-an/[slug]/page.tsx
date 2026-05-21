'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin, Building, Home, Calendar, CheckCircle,
  Share2, Heart, ChevronRight, ChevronLeft, X,
  Ruler, LayoutGrid, GraduationCap, ShoppingCart, Trees, Cross, Clock,
} from 'lucide-react';
import { formatPrice, timeAgo } from '@/lib/formatters';
import { ContactDialog } from '@/components/shared/ContactDialog';
import { useProjects } from '@/hooks/useProjects';

const mockProject = {
  id: '1',
  slug: 'de-palace-river-nam-song-tra-khuc',
  name: 'De Palace River - Nam Sông Trà Khúc',
  developer: 'Công ty CP Địa Ốc Quảng Ngãi',
  status: 'selling',
  type: 'apartment',
  address: 'Đầu cầu Thạch Bích, TP Quảng Ngãi, Quảng Ngãi',
  province: 'Quảng Ngãi',
  district: 'TP Quảng Ngãi',
  ward: 'Phường Trương Quang Trọng',
  totalArea: '2.5 ha',
  totalUnits: 256,
  totalBlocks: 2,
  totalFloors: 18,
  handoverDate: '2025-12-31',
  priceFrom: 4500000000,
  priceTo: 8500000000,
  legal: 'Sổ hồng / Sổ đỏ',
  constructionProgress: 75,
  gallery: [
    '/images/image_data/nha-pho-de-palace-river.jpg',
    '/images/image_data/Starlight---suc-hut-den-tu-vi-tri-dac-dia-nhat-trung-tam-Quang-Ngai-suc-hut-3-1733900371-424-width1000height563.jpg',
    '/images/image_data/Haus-Coastal.jpg',
    '/images/image_data/banner_hero.jpg',
    '/images/image_data/thi_tran_9b705.jpg',
  ],
  overview: `De Palace River là khu căn hộ cao cấp tọa lạc ngay đầu cầu Thạch Bích, ven sông Trà Khúc thơ mộng — vị trí đắc địa bậc nhất TP Quảng Ngãi.

Dự án được phát triển bởi Công ty CP Địa Ốc Quảng Ngãi, đơn vị có bề dày kinh nghiệm phát triển bất động sản tại tỉnh Quảng Ngãi. Với tổng quy mô 2.5 ha, De Palace River gồm 2 block cao 18 tầng, cung cấp 256 căn hộ thiết kế hiện đại, view sông thoáng đãng.

**Vị trí:**
- Ngay đầu cầu Thạch Bích, cách trung tâm TP 3 phút
- Cạnh sông Trà Khúc, tầm nhìn panorama
- Kết nối dễ dàng đến các tuyến đường chính

**Tiện ích nội khu:**
- Hồ bơi vô cực view sông
- Phòng gym & spa cao cấp
- Khu vui chơi trẻ em
- Sảnh đón 5 sao, bảo vệ 24/7
- Bãi đỗ xe thông minh`,
  utilities: [
    'Hồ bơi', 'Gym & Spa', 'Bảo vệ 24/7', 'Camera an ninh',
    'Thang máy', 'Bãi đỗ xe', 'Công viên', 'Siêu thị nội khu',
  ],
  floorPlans: [
    { type: '2 phòng ngủ', area: '72m²', count: 120, priceFrom: 4500000000 },
    { type: '3 phòng ngủ', area: '95m²', count: 100, priceFrom: 6200000000 },
    { type: 'Penthouse', area: '180m²', count: 36, priceFrom: 8500000000 },
  ],
  faq: [
    {
      q: 'Giá mua bán dự án De Palace River hiện nay?',
      a: 'Giá từ 4,5 tỷ đến 8,5 tỷ tùy căn hộ. Liên hệ để nhận bảng giá chi tiết mới nhất.',
    },
    {
      q: 'Địa chỉ dự án De Palace River ở đâu?',
      a: 'Dự án tọa lạc tại đầu cầu Thạch Bích, TP Quảng Ngãi, tỉnh Quảng Ngãi.',
    },
    {
      q: 'Chủ đầu tư dự án De Palace River là ai?',
      a: 'Chủ đầu tư là Công ty CP Địa Ốc Quảng Ngãi.',
    },
  ],
  mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3849.012!2d108.7859137!3d15.1319266!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3169ad3732456f77%3A0xce93b603f79b6e4e!2sDe+Palace+River+-+Nam+S%C3%B4ng+Tr%C3%A0!5e0!3m2!1svi!2svn!4v1700000000000!5m2!1svi!2svn',
  nearbyPlaces: {
    school: [
      { name: 'Trường Tiểu học Trương Quang Trọng', address: 'P. Trương Quang Trọng, TP Quảng Ngãi', dist: '0,8 km', time: '2 phút' },
      { name: 'THCS Lê Hồng Phong', address: 'P. Nghĩa Lộ, TP Quảng Ngãi', dist: '1,2 km', time: '3 phút' },
      { name: 'THPT Lê Trung Đình', address: 'P. Nguyễn Nghiêm, TP Quảng Ngãi', dist: '1,5 km', time: '3 phút' },
      { name: 'Trường Mầm non Hướng Dương', address: 'P. Trương Quang Trọng, TP Quảng Ngãi', dist: '0,5 km', time: '1 phút' },
    ],
    supermarket: [
      { name: 'Co.opmart Quảng Ngãi', address: 'Đường Nguyễn Du, TP Quảng Ngãi', dist: '2,0 km', time: '4 phút' },
      { name: 'Siêu thị Go! Quảng Ngãi', address: 'Đường Lê Lợi, TP Quảng Ngãi', dist: '2,5 km', time: '5 phút' },
    ],
    park: [
      { name: 'Công viên Thiên Bút', address: 'P. Lê Hồng Phong, TP Quảng Ngãi', dist: '1,8 km', time: '4 phút' },
      { name: 'Quảng trường Nguyễn Tự Tân', address: 'TP Quảng Ngãi', dist: '2,2 km', time: '5 phút' },
    ],
    hospital: [
      { name: 'Bệnh viện Đa khoa Quảng Ngãi', address: 'Đường Hùng Vương, TP Quảng Ngãi', dist: '2,1 km', time: '4 phút' },
      { name: 'Bệnh viện Y học cổ truyền QN', address: 'TP Quảng Ngãi', dist: '3,0 km', time: '6 phút' },
    ],
  },
  keywords: [
    'Bán căn hộ De Palace River',
    'Căn hộ view sông Trà Khúc',
    'Bán căn hộ TP Quảng Ngãi',
    'Cho thuê căn hộ Quảng Ngãi',
    'Căn hộ cao cấp Quảng Ngãi',
  ],
  relatedListings: [
    {
      id: 'r1',
      title: 'Bán căn hộ 3PN De Palace River tầng 12 view sông',
      price: '6,5 tỷ',
      area: '95m²',
      address: 'TP Quảng Ngãi, Quảng Ngãi',
      postedAt: 'Đăng hôm nay',
      image: '/images/image_data/nha-pho-de-palace-river.jpg',
      href: '/mua-ban/ban-can-ho-de-palace-river',
    },
    {
      id: 'r2',
      title: 'Cho thuê căn hộ 2PN De Palace River đầy đủ nội thất',
      price: '8 triệu/tháng',
      area: '72m²',
      address: 'TP Quảng Ngãi, Quảng Ngãi',
      postedAt: 'Hôm qua',
      image: '/images/image_data/Haus-Coastal.jpg',
      href: '/cho-thue/thue-can-ho-de-palace-river',
    },
    {
      id: 'r3',
      title: 'Bán căn hộ Penthouse De Palace River view toàn thành phố',
      price: '8,5 tỷ',
      area: '180m²',
      address: 'TP Quảng Ngãi, Quảng Ngãi',
      postedAt: '2 ngày trước',
      image: '/images/image_data/Starlight---suc-hut-den-tu-vi-tri-dac-dia-nhat-trung-tam-Quang-Ngai-suc-hut-3-1733900371-424-width1000height563.jpg',
      href: '/mua-ban/ban-penthouse-de-palace-river',
    },
  ],
  contact: {
    name: 'Nguyễn Văn Việt',
    title: 'Chuyên viên tư vấn dự án',
    phone: '0905123456',
  },
};

const statusConfig = {
  upcoming: { label: 'Sắp mở bán', bg: 'bg-amber-100', text: 'text-amber-700' },
  selling:  { label: 'Đang mở bán', bg: 'bg-green-100', text: 'text-green-700' },
  completed:{ label: 'Đã bàn giao', bg: 'bg-gray-100',  text: 'text-gray-600'  },
  paused:   { label: 'Tạm dừng',    bg: 'bg-red-100',   text: 'text-red-700'   },
};

const tabs = [
  { label: 'Tổng quan', sub: 'Giới thiệu về dự án' },
  { label: 'Vị trí', sub: 'Bản đồ dự án' },
  { label: 'Câu hỏi thường gặp', sub: 'Hỗ trợ thắc mắc' },
];

type NearbyCategory = 'school' | 'supermarket' | 'park' | 'hospital';

const nearbyTabs: { key: NearbyCategory; label: string; Icon: React.ElementType }[] = [
  { key: 'school',      label: 'Trường học',  Icon: GraduationCap },
  { key: 'supermarket', label: 'Siêu thị',    Icon: ShoppingCart  },
  { key: 'park',        label: 'Công viên',   Icon: Trees         },
  { key: 'hospital',    label: 'Bệnh viện',   Icon: Cross         },
];

interface NearbyProject {
  name: string;
  address: string;
  mapUrl: string;
  nearbyPlaces: Record<NearbyCategory, { name: string; address: string; dist: string; time: string }[]>;
}

// Mapper functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapApiProjectDetail = (apiProject: any) => {
  let gallery = apiProject.media && apiProject.media.length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? apiProject.media.map((m: any) => m.url || m)
    : [];
  
  if (gallery.length === 0 && apiProject.thumbnail) {
    gallery = [apiProject.thumbnail];
  }
  
  if (gallery.length === 0) {
    gallery = [
      '/images/image_data/nha-pho-de-palace-river.jpg',
      '/images/image_data/Starlight---suc-hut-den-tu-vi-tri-dac-dia-nhat-trung-tam-Quang-Ngai-suc-hut-3-1733900371-424-width1000height563.jpg',
      '/images/image_data/Haus-Coastal.jpg',
    ];
  }

  const districtName = apiProject.location?.district?.name || apiProject.district || 'TP Quảng Ngãi';
  const provinceName = apiProject.location?.province?.name || apiProject.province || 'Quảng Ngãi';
  const wardName = apiProject.location?.ward?.name || apiProject.ward || 'Phường Trương Quang Trọng';

  const priceFrom = apiProject.price?.from || apiProject.price_from || 3000000000;
  const priceTo = apiProject.price?.to || apiProject.price_to || 8000000000;
  
  const floorPlans = apiProject.floor_plans || [
    { type: '2 phòng ngủ', area: '72m²', count: Math.floor((apiProject.scale?.total_units || 256) * 0.45), priceFrom: priceFrom },
    { type: '3 phòng ngủ', area: '95m²', count: Math.floor((apiProject.scale?.total_units || 256) * 0.4), priceFrom: Math.floor(priceFrom * 1.35) },
    { type: 'Penthouse', area: '180m²', count: Math.floor((apiProject.scale?.total_units || 256) * 0.15), priceFrom: priceTo },
  ];

  const faq = apiProject.faq || [
    {
      q: `Giá mua bán dự án ${apiProject.name} hiện nay?`,
      a: `Giá từ ${formatPrice(priceFrom)} đến ${formatPrice(priceTo)} tùy thuộc vào vị trí, diện tích và loại hình căn hộ. Liên hệ với chúng tôi để nhận bảng giá chi tiết mới nhất.`,
    },
    {
      q: `Địa chỉ dự án ${apiProject.name} ở đâu?`,
      a: `Dự án tọa lập tại ${apiProject.location?.address || apiProject.address || 'Quảng Ngãi'}.`,
    },
    {
      q: `Chủ đầu tư dự án ${apiProject.name} là ai?`,
      a: `Chủ đầu tư dự án là ${apiProject.developer || 'Đơn vị uy tín tại Quảng Ngãi'}.`,
    },
  ];

  const nearbyPlaces = apiProject.nearby_places || {
    school: [
      { name: `Trường Tiểu học ${districtName}`, address: `${districtName}, Quảng Ngãi`, dist: '0,8 km', time: '2 phút' },
      { name: `Trường THCS Lê Hồng Phong`, address: `${districtName}, Quảng Ngãi`, dist: '1,2 km', time: '3 phút' },
      { name: `Trường Mầm non quốc tế`, address: `${districtName}, Quảng Ngãi`, dist: '0,5 km', time: '1 phút' },
    ],
    supermarket: [
      { name: 'Co.opmart Quảng Ngãi', address: 'Đường Nguyễn Du, TP Quảng Ngãi', dist: '2,0 km', time: '4 phút' },
      { name: 'Siêu thị Go! Quảng Ngãi', address: 'Đường Lê Lợi, TP Quảng Ngãi', dist: '2,5 km', time: '5 phút' },
    ],
    park: [
      { name: 'Công viên Ba Tơ', address: 'TP Quảng Ngãi', dist: '1,5 km', time: '3 phút' },
      { name: 'Quảng trường đường Phạm Văn Đồng', address: 'TP Quảng Ngãi', dist: '2,2 km', time: '5 phút' },
    ],
    hospital: [
      { name: 'Bệnh viện Đa khoa Tỉnh Quảng Ngãi', address: 'Đường Hùng Vương, TP Quảng Ngãi', dist: '2,1 km', time: '4 phút' },
    ],
  };

  return {
    id: apiProject.id.toString(),
    uuid: apiProject.uuid,
    slug: apiProject.slug,
    name: apiProject.name,
    developer: apiProject.developer || 'Chủ đầu tư uy tín',
    status: apiProject.status || 'selling',
    type: apiProject.type || 'apartment',
    address: apiProject.location?.address || apiProject.address || 'Quảng Ngãi',
    province: provinceName,
    district: districtName,
    ward: wardName,
    totalArea: apiProject.scale?.total_area ? `${apiProject.scale.total_area} ha` : '2.5 ha',
    totalUnits: apiProject.scale?.total_units || 256,
    totalBlocks: apiProject.scale?.total_blocks || 2,
    totalFloors: apiProject.scale?.total_floors || 18,
    handoverDate: apiProject.handover_date || '2026-12-31',
    priceFrom: priceFrom,
    priceTo: priceTo,
    legal: apiProject.legal || 'Sổ hồng / Sổ đỏ',
    constructionProgress: apiProject.construction_progress || 75,
    gallery,
    overview: apiProject.description || `Dự án ${apiProject.name} là khu dự án đẳng cấp hàng đầu tọa lạc tại ${districtName}, tỉnh Quảng Ngãi. Dự án có quy mô đồng bộ, thiết kế hiện đại, thông minh, ngập tràn mảng xanh và tiện ích cao cấp.`,
    utilities: apiProject.utilities && apiProject.utilities.length > 0 ? apiProject.utilities : [
      'Hồ bơi', 'Gym & Spa', 'Bảo vệ 24/7', 'Camera an ninh',
      'Thang máy', 'Bãi đỗ xe', 'Công viên',
    ],
    floorPlans,
    faq,
    mapUrl: apiProject.map_url || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3849.012!2d108.7859137!3d15.1319266!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3169ad3732456f77%3A0xce93b603f79b6e4e!2sDe+Palace+River+-+Nam+S%C3%B4ng+Tr%C3%A0!5e0!3m2!1svi!2svn!4v1700000000000!5m2!1svi!2svn',
    nearbyPlaces,
    keywords: apiProject.keywords || [
      `Dự án ${apiProject.name}`,
      `Bán căn hộ ${apiProject.name}`,
      `Bán đất nền ${apiProject.name}`,
      `Mua dự án ${districtName}`,
    ],
    contact: {
      name: apiProject.owner?.name || 'Nguyễn Văn Việt',
      title: 'Chuyên viên tư vấn dự án',
      phone: apiProject.owner?.phone || '0905123456',
    },
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapApiUnit = (apiProp: any) => {
  let priceStr = '';
  if (apiProp.price) {
    priceStr = formatPrice(Number(apiProp.price));
    if (apiProp.price_unit === 'month' || apiProp.price_unit === 'per_month') {
      priceStr += '/tháng';
    }
  } else {
    priceStr = 'Thỏa thuận';
  }

  return {
    id: apiProp.id.toString(),
    title: apiProp.title,
    price: priceStr,
    area: apiProp.area ? `${apiProp.area}m²` : 'Không xác định',
    address: apiProp.district ? `${apiProp.district.name}, Quảng Ngãi` : apiProp.address || 'Quảng Ngãi',
    postedAt: timeAgo(apiProp.published_at || apiProp.created_at),
    image: apiProp.thumbnail || '/images/image_data/Haus-Coastal.jpg',
    href: apiProp.type === 'rent' ? `/cho-thue/${apiProp.slug}` : `/mua-ban/${apiProp.slug}`,
  };
};

function NearbyTab({ project }: { project: NearbyProject }) {
  const [cat, setCat] = useState<NearbyCategory>('school');
  const places = project.nearbyPlaces[cat] || [];
  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-gray-900">Vị trí dự án {project.name}</h2>
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <MapPin className="h-4 w-4 text-primary shrink-0" />
        <span>{project.address}</span>
      </div>

      {/* Google Maps iframe */}
      <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200">
        <iframe
          src={project.mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Category tabs */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100">
          {nearbyTabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setCat(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                cat === key
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <p className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
          Có {places.length} {nearbyTabs.find(t => t.key === cat)?.label.toLowerCase()} trong vòng 5 km
        </p>

        <div className="divide-y divide-gray-50">
          {places.map((p) => (
            <div key={p.name} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.address}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-sm font-semibold text-gray-700">{p.dist}</p>
                <p className="text-xs text-gray-400 flex items-center gap-0.5 justify-end">
                  <Clock className="h-3 w-3" /> {p.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const { fetchProjectDetail, fetchProjectUnits, isLoading } = useProjects();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [projectData, setProjectData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [unitsData, setUnitsData] = useState<any[]>([]);
  
  const [mainImg, setMainImg] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [liked, setLiked] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const res = await fetchProjectDetail(params.slug);
      if (res.success && res.data) {
        const mapped = mapApiProjectDetail(res.data);
        setProjectData(mapped);

        // Fetch related units/listings of the project
        const unitsRes = await fetchProjectUnits(res.data.id);
        if (unitsRes.success && unitsRes.data && unitsRes.data.length > 0) {
          setUnitsData(unitsRes.data.map(mapApiUnit));
        } else {
          setUnitsData(mapped.relatedListings || mockProject.relatedListings);
        }
      } else {
        // Fallback to static mock project data
        setProjectData(mockProject);
        setUnitsData(mockProject.relatedListings);
      }
    };
    if (params?.slug) {
      loadData();
    }
  }, [params?.slug, fetchProjectDetail, fetchProjectUnits]);

  // Loading skeleton state
  if (isLoading || !projectData) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb skeleton */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1152px] mx-auto px-4 py-3 flex items-center gap-2">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        <div className="max-w-[1152px] mx-auto px-4 py-6">
          {/* Title skeleton */}
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2 flex-1">
              <div className="h-8 w-1/2 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left content skeleton */}
            <div className="flex-1 space-y-6">
              <div className="h-[300px] md:h-[400px] bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
              <div className="space-y-3">
                <div className="h-6 w-1/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>

            {/* Right sidebar skeleton */}
            <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
              <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const status = statusConfig[projectData.status as keyof typeof statusConfig] || statusConfig['selling'];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1152px] mx-auto px-4 py-2.5 flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/du-an" className="hover:text-primary transition-colors">Dự án</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/du-an" className="hover:text-primary transition-colors">Quảng Ngãi</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/du-an" className="hover:text-primary transition-colors">{projectData.district}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-800 font-medium line-clamp-1">{projectData.name}</span>
        </div>
      </div>

      <div className="max-w-[1152px] mx-auto px-4 py-5">

        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-1">
              {projectData.name}
            </h1>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{projectData.address}</span>
              <Link href="#" className="text-primary font-medium ml-1 hover:underline">Xem bản đồ</Link>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${liked ? 'border-primary/20 bg-primary-light text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">Lưu</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 transition-colors">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Chia sẻ</span>
            </button>
          </div>
        </div>

        <div className="flex gap-6 items-start">

          {/* ── LEFT / MAIN ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Gallery */}
            <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
              <div className="flex gap-1 h-[280px] md:h-[360px]">
                {/* Main image */}
                <div 
                  onClick={() => {
                    setLightboxIndex(mainImg);
                    setIsLightboxOpen(true);
                  }}
                  className="relative flex-1 overflow-hidden cursor-pointer group"
                >
                  <Image
                    src={projectData.gallery[mainImg]}
                    alt={projectData.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 60vw"
                    priority
                  />
                  <div className={`absolute top-3 left-3 ${status.bg} ${status.text} text-xs font-semibold px-3 py-1 rounded-full`}>
                    {status.label}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                    {mainImg + 1} / {projectData.gallery.length}
                  </div>
                </div>
                {/* Thumbnails column */}
                <div className="hidden sm:flex flex-col gap-1 w-32 md:w-40">
                  {projectData.gallery.slice(1, 4).map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => {
                        setLightboxIndex(i + 1);
                        setIsLightboxOpen(true);
                      }}
                      className={`relative flex-1 overflow-hidden transition-opacity cursor-pointer group ${mainImg === i + 1 ? 'ring-2 ring-primary' : 'hover:opacity-90'}`}
                    >
                      <Image
                        src={img}
                        alt=""
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="160px"
                      />
                      {i === 2 && projectData.gallery.length > 4 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm font-semibold">
                          +{projectData.gallery.length - 4}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thumbnail row mobile */}
              <div className="flex gap-2 p-3 overflow-x-auto sm:hidden">
                {projectData.gallery.map((img: string, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      setMainImg(i);
                      setLightboxIndex(i);
                      setIsLightboxOpen(true);
                    }} 
                    className={`relative w-16 h-12 shrink-0 rounded-md overflow-hidden ${mainImg === i ? 'ring-2 ring-primary' : ''}`}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
                {[
                  { icon: LayoutGrid, label: 'Diện tích', value: projectData.totalArea },
                  { icon: Building, label: 'Block', value: `${projectData.totalBlocks} block` },
                  { icon: Home, label: 'Căn hộ', value: `${projectData.totalUnits} căn` },
                  { icon: Calendar, label: 'Bàn giao', value: isNaN(new Date(projectData.handoverDate).getTime()) ? '2026' : new Date(projectData.handoverDate).getFullYear().toString() },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex flex-col items-center py-3 px-2 text-center">
                    <Icon className="h-4 w-4 text-primary mb-1" />
                    <span className="text-xs md:text-sm font-semibold text-gray-800">{value}</span>
                    <span className="text-[10px] md:text-xs text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tab nav */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {tabs.map((tab, i) => (
                  <button
                    key={tab.label}
                    onClick={() => setActiveTab(i)}
                    className={`flex flex-col items-start px-5 py-3 whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === i
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <span className="text-sm font-semibold">{tab.label}</span>
                    <span className="text-[11px] text-gray-400 font-normal">{tab.sub}</span>
                  </button>
                ))}
              </div>

              <div className="p-5">

                {/* Tab 0 — Tổng quan */}
                {activeTab === 0 && (
                  <div className="space-y-6">
                    {/* Thông tin dự án */}
                    <div>
                      <h2 className="text-base font-bold text-gray-900 mb-3">Tổng quan {projectData.name}</h2>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm mb-5">
                        {[
                          ['Chủ đầu tư', projectData.developer],
                          ['Loại hình', 'Căn hộ chung cư'],
                          ['Tổng diện tích', projectData.totalArea],
                          ['Số block', `${projectData.totalBlocks} block`],
                          ['Số tầng', `${projectData.totalFloors} tầng`],
                          ['Số căn hộ', `${projectData.totalUnits} căn`],
                          ['Pháp lý', projectData.legal],
                          ['Bàn giao', isNaN(new Date(projectData.handoverDate).getTime()) ? 'Liên hệ' : new Date(projectData.handoverDate).toLocaleDateString('vi-VN')],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-start gap-2">
                            <span className="text-gray-400 shrink-0 w-28">{k}</span>
                            <span className="font-medium text-gray-800">{v}</span>
                          </div>
                        ))}
                      </div>

                      {/* Giá */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-5">
                        <p className="text-xs text-gray-400 mb-1">Giá bán</p>
                        <p className="text-xl font-bold text-primary">
                          {formatPrice(projectData.priceFrom)}
                          <span className="text-base font-normal text-gray-400 mx-2">–</span>
                          {formatPrice(projectData.priceTo)}
                        </p>
                      </div>

                      {/* Mô tả */}
                      <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                        {projectData.overview}
                      </div>
                    </div>

                    {/* Tiện ích */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Tiện ích dự án</h3>
                      <div className="flex flex-wrap gap-2">
                        {projectData.utilities.map((u: string) => (
                          <span key={u} className="flex items-center gap-1.5 text-xs bg-primary-light text-primary px-3 py-1.5 rounded-lg font-medium">
                            <CheckCircle className="h-3.5 w-3.5" />
                            {u}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Mặt bằng */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Loại căn hộ</h3>
                      <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {projectData.floorPlans.map((fp: any) => (
                          <div key={fp.type} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <Ruler className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{fp.type}</p>
                                <p className="text-xs text-gray-400">{fp.area} · {fp.count} căn</p>
                              </div>
                            </div>
                            <p className="text-sm font-bold text-primary">{formatPrice(fp.priceFrom)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tiến độ */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Tiến độ xây dựng</h3>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-500">Hoàn thành</span>
                        <span className="font-semibold text-gray-700">{projectData.constructionProgress}%</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${projectData.constructionProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Dự kiến bàn giao: {isNaN(new Date(projectData.handoverDate).getTime()) ? 'Liên hệ' : new Date(projectData.handoverDate).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                )}

                {/* Tab 1 — Vị trí */}
                {activeTab === 1 && (
                  <NearbyTab project={projectData} />
                )}

                {/* Tab 2 — FAQ */}
                {activeTab === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-base font-bold text-gray-900">Các câu hỏi thường gặp</h2>

                    {/* FAQ list */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {projectData.faq.map((item: any, i: number) => (
                        <div key={i}>
                          <button
                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="w-1 h-4 mt-0.5 bg-primary rounded-full shrink-0" />
                            <span className="flex-1 text-sm font-semibold text-gray-800">{item.q}</span>
                          </button>
                          {openFaq === i && (
                            <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50">
                              {item.a}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Footer */}
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 flex-wrap gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>Những thông tin trên có hữu ích không?</span>
                          <button className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-700 hover:border-primary hover:text-primary transition-colors">Có</button>
                          <button className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-700 hover:border-primary hover:text-primary transition-colors">Không</button>
                        </div>
                        <button
                          onClick={() => setContactOpen(true)}
                          className="text-sm font-semibold text-primary border border-primary px-4 py-1.5 rounded hover:bg-primary-light transition-colors"
                        >
                          Đặt câu hỏi về dự án
                        </button>
                      </div>
                    </div>

                    {/* Tìm kiếm theo từ khóa */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Tìm kiếm theo từ khóa</h3>
                      <div className="flex flex-wrap gap-2">
                        {projectData.keywords.map((kw: string) => (
                          <Link
                            key={kw}
                            href={`/mua-ban?q=${encodeURIComponent(kw)}`}
                            className="text-sm text-gray-600 bg-gray-100 hover:bg-primary-light hover:text-primary px-4 py-1.5 rounded-full transition-colors"
                          >
                            {kw}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Related listings */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-primary rounded-full" />
                  <h3 className="text-sm font-bold text-gray-900">Tin mua bán tại {projectData.name}</h3>
                </div>
                <Link href="/mua-ban" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                  Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {unitsData.map((item: any) => (
                  <Link key={item.id} href={item.href} className="flex gap-3 p-4 hover:bg-gray-50 transition-colors group">
                    <div className="relative w-24 h-18 shrink-0 rounded-lg overflow-hidden" style={{ height: '72px' }}>
                      <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="96px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-primary transition-colors leading-snug mb-1">
                        {item.title}
                      </p>
                      <p className="text-sm font-bold text-primary">{item.price} <span className="text-gray-400 font-normal">·</span> <span className="text-gray-500 font-normal">{item.area}</span></p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.address} · {item.postedAt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="sticky top-[76px] hidden w-72 shrink-0 self-start lg:block xl:w-80">
            <div className="space-y-4">

              {/* Contact card */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="bg-primary px-5 py-4">
                  <p className="text-white font-semibold text-sm">Liên hệ tư vấn miễn phí</p>
                  <p className="text-white/80 text-xs mt-0.5">Nhận thông tin chi tiết và các ưu đãi mới nhất của dự án</p>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-50">
                    <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {projectData.contact.name.split(' ').pop()?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{projectData.contact.name}</p>
                      <p className="text-xs text-gray-400">{projectData.contact.title}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setContactOpen(true)}
                    className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    Liên hệ tôi
                  </button>
                </div>
              </div>

              {/* Project info card */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-1 h-4 bg-primary rounded-full" />
                  <h3 className="text-sm font-semibold text-gray-800">Thông tin dự án</h3>
                </div>
                <div className="px-4 py-3 space-y-3 text-sm">
                  {[
                    ['Chủ đầu tư', projectData.developer],
                    ['Loại hình', 'Căn hộ chung cư'],
                    ['Tỉnh / TP', projectData.province],
                    ['Quận / Huyện', projectData.district],
                    ['Tổng diện tích', projectData.totalArea],
                    ['Số căn hộ', `${projectData.totalUnits} căn`],
                    ['Pháp lý', projectData.legal],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <span className="text-gray-400 shrink-0">{k}</span>
                      <span className="font-medium text-gray-800 text-right">{v}</span>
                    </div>
                  ))}

                  <div className="border-t border-gray-50 pt-3">
                    <p className="text-gray-400 mb-1.5">Giá từ</p>
                    <p className="text-base font-bold text-primary">{formatPrice(projectData.priceFrom)}</p>
                  </div>
                </div>
              </div>

            </div>
          </aside>

        </div>
      </div>

      {/* Mobile sticky CTA — only visible when sidebar is hidden */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 truncate">{projectData.name}</p>
          <p className="text-xs text-primary font-bold">{formatPrice(projectData.priceFrom)} – {formatPrice(projectData.priceTo)}</p>
        </div>
        <button
          onClick={() => setContactOpen(true)}
          className="shrink-0 bg-primary hover:bg-primary-dark text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          Liên hệ tôi
        </button>
      </div>

      {/* Bottom padding so content isn't hidden behind mobile CTA */}
      <div className="lg:hidden h-20" />

      <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} projectName={projectData.name} />

      {/* ══ GALLERY LIGHTBOX MODAL ══ */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col justify-between p-4 select-none animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto z-10 pt-2">
            <span className="text-white/80 text-sm font-semibold tracking-wider">
              {lightboxIndex + 1} / {projectData.gallery.length}
            </span>
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-full"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex items-center justify-center w-full max-w-7xl mx-auto flex-1 my-4 relative">
            <div 
              className="relative flex-1 max-w-5xl h-[65vh] md:h-[75vh] flex items-center justify-center mx-2 group/slider"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Overlay Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev - 1 + projectData.gallery.length) % projectData.gallery.length);
                }}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-black/50 hover:bg-black/75 text-white p-2.5 md:p-3.5 rounded-full transition-all hover:scale-105 active:scale-95 z-20 shadow-lg border border-white/10"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 h-6" />
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={projectData.gallery[lightboxIndex]}
                alt={`Slide ${lightboxIndex + 1}`}
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
              />

              {/* Right Overlay Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev + 1) % projectData.gallery.length);
                }}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-black/50 hover:bg-black/75 text-white p-2.5 md:p-3.5 rounded-full transition-all hover:scale-105 active:scale-95 z-20 shadow-lg border border-white/10"
                aria-label="Ảnh sau"
              >
                <ChevronRight className="w-5 h-5 md:w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Bottom Thumbnails */}
          <div className="w-full max-w-4xl mx-auto z-10 pb-2">
            <div className="hidden md:flex justify-center gap-2.5 overflow-x-auto py-2 max-w-full scrollbar-hide">
              {projectData.gallery.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(idx);
                  }}
                  className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === lightboxIndex 
                      ? 'border-[#1075b1] scale-105 shadow-md' 
                      : 'border-transparent opacity-50 hover:opacity-90'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
