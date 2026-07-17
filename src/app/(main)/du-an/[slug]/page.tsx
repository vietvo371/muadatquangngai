'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { sanitizeRichText } from '@/lib/sanitize-html';
import { visibleFloorPlans, minFloorPlanArea } from '@/lib/floor-plans';
import { DEFAULT_PROJECT_TYPE, isLandLikeProjectType, getProjectTypeLabel } from '@/lib/project-type';

const getDistrictQueryValue = (district?: string): string => {
  if (!district) return 'all';
  const clean = district
    .toLowerCase()
    .replace(/huyện/g, '')
    .replace(/thành phố/g, '')
    .replace(/thị xã/g, '')
    .replace(/tp\./g, '')
    .replace(/tx\./g, '')
    .trim();
  
  const slug = clean
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
    
  if (slug === 'quang-ngai' || slug === 'tp-quang-ngai') return 'tp-quang-ngai';
  return slug;
};

const mockProject = {
  id: '1',
  slug: 'de-palace-river-nam-song-tra-khuc',
  name: 'De Palace River - Nam Sông Trà Khúc',
  developer: 'Công ty Cổ phần Đầu tư Xây dựng Thương mại Trần Gia Hân',
  status: 'selling',
  type: DEFAULT_PROJECT_TYPE,
  address: 'Khu Nam Sông Trà Khúc, Phường Lê Hồng Phong, TP. Quảng Ngãi',
  province: 'Quảng Ngãi',
  district: 'TP Quảng Ngãi',
  ward: 'Phường Lê Hồng Phong',
  totalArea: '2.6 ha',
  totalUnits: 55,
  totalBlocks: 3,
  totalFloors: 4,
  handoverDate: '2028-06-30',
  priceFrom: 3800000000,
  priceTo: 8500000000,
  legal: 'Sổ hồng sở hữu lâu dài',
  constructionProgress: 45,
  gallery: [
    '/images/namsongtrakhuc/phoi-canh-tong-the.png',
    '/images/namsongtrakhuc/noi-khu-san-vuon.png',
    '/images/namsongtrakhuc/phoi-canh-duong-ven-song.png',
    '/images/namsongtrakhuc/phoi-canh-nha-pho-thuong-mai.png',
    '/images/namsongtrakhuc/mat-bang-dinh-vi.jpg',
  ],
  overview: `De Palace River là khu nhà phố thương mại cao cấp tọa lạc tại Khu Nam Sông Trà Khúc, Phường Lê Hồng Phong, TP. Quảng Ngãi — vị trí đắc địa bậc nhất với tầm nhìn ôm trọn sông Trà Khúc thơ mộng.

Dự án được phát triển bởi Công ty Cổ phần Đầu tư Xây dựng Thương mại Trần Gia Hân. Với tổng quy mô 2,6 ha, De Palace River gồm 3 block, cung cấp 55 căn nhà phố thương mại thiết kế hoàn thiện mặt ngoài chuẩn phong cách Châu Âu sang trọng, tinh tế. Dự kiến bàn giao vào tháng 06/2028.

**Vị trí:**
- Khu Nam Sông Trà Khúc, Phường Lê Hồng Phong, TP. Quảng Ngãi
- Mặt tiền ven sông Trà Khúc, tầm nhìn panorama
- Kết nối dễ dàng đến trung tâm thành phố và các tuyến đường chính

**Tiện ích nội khu:**
- Bến du thuyền ven sông
- Quảng trường nhạc nước
- Clubhouse 5 sao
- Công viên bờ sông, đường dạo bộ ven sông
- Bảo vệ 3 lớp 24/7`,
  utilities: [
    'Bến du thuyền ven sông', 'Quảng trường nhạc nước', 'Clubhouse 5 sao',
    'Công viên bờ sông', 'Đường dạo bộ ven sông', 'Bảo vệ 3 lớp 24/7',
    'Bãi đỗ xe thông minh', 'Camera an ninh',
  ],
  floorPlans: [
    { type: 'Nhà phố thương mại', area: '120m²', count: 30, priceFrom: 3800000000 },
    { type: 'Nhà phố góc', area: '150m²', count: 15, priceFrom: 5500000000 },
    { type: 'Nhà phố mặt tiền sông', area: '180m²', count: 10, priceFrom: 8500000000 },
  ],
  floorPlansTitle: 'Loại nhà phố điển hình',
  floorPlansUnitLabel: 'căn',
  unitWord: 'căn',
  faq: [
    {
      q: 'Giá mua bán dự án De Palace River hiện nay?',
      a: 'Giá từ 3,8 tỷ tùy vị trí và diện tích nhà phố. Liên hệ để nhận bảng giá chi tiết mới nhất.',
    },
    {
      q: 'Địa chỉ dự án De Palace River ở đâu?',
      a: 'Dự án tọa lạc tại Khu Nam Sông Trà Khúc, Phường Lê Hồng Phong, TP. Quảng Ngãi.',
    },
    {
      q: 'Chủ đầu tư dự án De Palace River là ai?',
      a: 'Chủ đầu tư là Công ty Cổ phần Đầu tư Xây dựng Thương mại Trần Gia Hân.',
    },
    {
      q: 'Dự án De Palace River khi nào bàn giao?',
      a: 'Dự kiến bàn giao vào tháng 06/2028.',
    },
  ],
  mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3849.012!2d108.7859137!3d15.1319266!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3169ad3732456f77%3A0xce93b603f79b6e4e!2sDe+Palace+River+-+Nam+S%C3%B4ng+Tr%C3%A0!5e0!3m2!1svi!2svn!4v1700000000000!5m2!1svi!2svn',
  nearbyPlaces: {
    school: [
      { name: 'Trường Tiểu học Lê Hồng Phong', address: 'P. Lê Hồng Phong, TP Quảng Ngãi', dist: '0,8 km', time: '2 phút' },
      { name: 'THCS Lê Hồng Phong', address: 'P. Nghĩa Lộ, TP Quảng Ngãi', dist: '1,2 km', time: '3 phút' },
      { name: 'THPT Lê Trung Đình', address: 'P. Nguyễn Nghiêm, TP Quảng Ngãi', dist: '1,5 km', time: '3 phút' },
      { name: 'Trường Mầm non Hướng Dương', address: 'P. Lê Hồng Phong, TP Quảng Ngãi', dist: '0,5 km', time: '1 phút' },
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
    'Bán nhà phố De Palace River',
    'Nhà phố thương mại view sông Trà Khúc',
    'Nhà phố Nam Sông Trà Khúc',
    'Bán nhà phố thương mại Quảng Ngãi',
    'Trần Gia Hân Quảng Ngãi',
  ],
  relatedListings: [
    {
      id: 'r1',
      title: 'Bán nhà phố thương mại De Palace River mặt tiền ven sông',
      price: '6,5 tỷ',
      area: '120m²',
      address: 'TP Quảng Ngãi, Quảng Ngãi',
      postedAt: 'Đăng hôm nay',
      image: '/images/namsongtrakhuc/phoi-canh-nha-pho-thuong-mai.png',
      href: '/mua-ban/ban-shophouse-de-palace-river',
    },
    {
      id: 'r2',
      title: 'Bán nhà phố góc De Palace River view sông',
      price: '7,2 tỷ',
      area: '150m²',
      address: 'TP Quảng Ngãi, Quảng Ngãi',
      postedAt: 'Hôm qua',
      image: '/images/namsongtrakhuc/noi-khu-san-vuon.png',
      href: '/mua-ban/ban-shophouse-goc-de-palace-river',
    },
    {
      id: 'r3',
      title: 'Bán nhà phố mặt tiền sông De Palace River',
      price: '8,5 tỷ',
      area: '180m²',
      address: 'TP Quảng Ngãi, Quảng Ngãi',
      postedAt: '2 ngày trước',
      image: '/images/namsongtrakhuc/phoi-canh-duong-ven-song.png',
      href: '/mua-ban/ban-shophouse-mat-tien-song-de-palace-river',
    },
  ],
  contact: {
    name: 'Trung Nguyen',
    title: 'Chuyên viên tư vấn - Hợp Nghĩa Land',
    phone: '0905123456',
  },
};

const statusConfig = {
  upcoming: { label: 'Sắp mở bán', bg: 'bg-amber-100', text: 'text-amber-700' },
  selling:  { label: 'Đang mở bán', bg: 'bg-green-100', text: 'text-green-700' },
  completed:{ label: 'Đã bàn giao', bg: 'bg-gray-100',  text: 'text-gray-600'  },
  paused:   { label: 'Tạm dừng',    bg: 'bg-red-100',   text: 'text-red-700'   },
  draft:     { label: 'Bản nháp',    bg: 'bg-gray-100',  text: 'text-gray-600'  },
  published: { label: 'Đã xuất bản',  bg: 'bg-green-100', text: 'text-green-700' },
  archived:  { label: 'Đã lưu trữ',  bg: 'bg-yellow-100', text: 'text-yellow-700' },
};

interface FloorPlanConfig {
  title: string;
  unitLabel: string;
  plans: {
    type: string;
    area: string;
    count: number;
    priceFrom: number;
  }[];
}

const getFloorPlansConfig = (
  type: string,
  unitsCount: number,
  minPrice: number,
  maxPrice: number
): FloorPlanConfig => {
  const pMin = minPrice || 3000000000;
  const pMax = maxPrice || 8000000000;
  const count = unitsCount && unitsCount > 0 ? unitsCount : 100;

  switch (type) {
    case 'khu-do-thi-moi':
    case 'khu-dan-cu':
      return {
        title: 'Loại lô đất điển hình',
        unitLabel: 'lô',
        plans: [
          { type: 'Lô liền kề', area: '100m²', count: Math.floor(count * 0.55), priceFrom: pMin },
          { type: 'Lô góc thương mại', area: '150m²', count: Math.floor(count * 0.30), priceFrom: Math.floor(pMin * 1.25) },
          { type: 'Lô biệt thự vườn', area: '250m²', count: Math.floor(count * 0.15), priceFrom: pMax },
        ],
      };
    case 'biet-thu-lien-ke-du-an':
    case 'khu-nghi-duong-sinh-thai':
      return {
        title: 'Loại biệt thự điển hình',
        unitLabel: 'căn',
        plans: [
          { type: 'Biệt thự song lập', area: '200m²', count: Math.floor(count * 0.50), priceFrom: pMin },
          { type: 'Biệt thự đơn lập', area: '320m²', count: Math.floor(count * 0.35), priceFrom: Math.floor(pMin * 1.40) },
          { type: 'Biệt thự mặt tiền', area: '450m²', count: Math.floor(count * 0.15), priceFrom: pMax },
        ],
      };
    case 'shophouse-du-an':
      return {
        title: 'Loại mặt bằng điển hình',
        unitLabel: 'căn',
        plans: [
          { type: 'Kiot thương mại', area: '50m²', count: Math.floor(count * 0.50), priceFrom: pMin },
          { type: 'Shophouse dịch vụ', area: '110m²', count: Math.floor(count * 0.35), priceFrom: Math.floor(pMin * 1.30) },
          { type: 'Văn phòng thông tầng', area: '220m²', count: Math.floor(count * 0.15), priceFrom: pMax },
        ],
      };
    case 'nha-o-xa-hoi':
    default:
      return {
        title: 'Loại căn hộ điển hình',
        unitLabel: 'căn',
        plans: [
          { type: 'Căn 2 phòng ngủ', area: '72m²', count: Math.floor(count * 0.45), priceFrom: pMin },
          { type: 'Căn 3 phòng ngủ', area: '95m²', count: Math.floor(count * 0.40), priceFrom: Math.floor(pMin * 1.35) },
          { type: 'Penthouse', area: '180m²', count: Math.floor(count * 0.15), priceFrom: pMax },
        ],
      };
  }
};

const tabs = [
  { label: 'Tổng quan', sub: 'Giới thiệu về dự án' },
  { label: 'Vị trí', sub: 'Bản đồ dự án' },
  { label: 'Câu hỏi thường gặp', sub: 'Hỗ trợ thắc mắc' },
];

// id neo cho từng section (khớp thứ tự với `tabs`) — dùng cho tab cuộn + scrollspy
const SECTION_IDS = ['du-an-tong-quan', 'du-an-vi-tri', 'du-an-faq'];

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
  let imagesArr = apiProject.images;
  if (typeof imagesArr === 'string') {
    imagesArr = imagesArr.split(',').map((img: string) => img.trim()).filter(Boolean);
  }
  
  let gallery = imagesArr && imagesArr.length > 0
    ? imagesArr
    : (apiProject.media && apiProject.media.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? apiProject.media.map((m: any) => m.url || m)
      : []);
  
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
  
  const unitsCount = apiProject.scale?.total_units || apiProject.total_units || 256;
  const floorPlansConfig = getFloorPlansConfig(
    apiProject.type || DEFAULT_PROJECT_TYPE,
    unitsCount,
    priceFrom,
    priceTo
  );
  const floorPlans = apiProject.floor_plans || floorPlansConfig.plans;
  const unitWord = isLandLikeProjectType(apiProject.type || DEFAULT_PROJECT_TYPE) ? 'lô' : 'căn';

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
    developer: apiProject.developer || apiProject.investor || 'Chưa cập nhật',
    status: apiProject.status || 'selling',
    type: apiProject.type || DEFAULT_PROJECT_TYPE,
    address: apiProject.location?.address || apiProject.address || 'Quảng Ngãi',
    province: provinceName,
    district: districtName,
    ward: wardName,
    totalArea: apiProject.scale?.total_area ? `${apiProject.scale.total_area} ha` : (apiProject.total_area ? `${apiProject.total_area} ha` : 'Đang cập nhật'),
    totalUnits: apiProject.scale?.total_units || apiProject.total_units || 0,
    totalBlocks: apiProject.scale?.total_blocks || apiProject.total_blocks || 0,
    totalFloors: apiProject.scale?.total_floors || apiProject.total_floors || 0,
    handoverDate: apiProject.handover_date || '2026-12-31',
    priceFrom: priceFrom,
    priceTo: priceTo,
    legal: apiProject.legal || 'Đang cập nhật',
    constructionProgress: apiProject.construction_progress || 0,
    constructionNote: apiProject.construction_note || '',
    gallery,
    overview: apiProject.description || `Dự án ${apiProject.name} là khu dự án đẳng cấp hàng đầu tọa lạc tại ${districtName}, tỉnh Quảng Ngãi. Dự án có quy mô đồng bộ, thiết kế hiện đại, thông minh, ngập tràn mảng xanh và tiện ích cao cấp.`,
    utilities: (() => {
      const utils = apiProject.utilities;
      if (Array.isArray(utils)) return utils;
      if (typeof utils === 'string') {
        try {
          const parsed = JSON.parse(utils);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          return utils.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      return [
        'Hồ bơi', 'Gym & Spa', 'Bảo vệ 24/7', 'Camera an ninh',
        'Thang máy', 'Bãi đỗ xe', 'Công viên',
      ];
    })(),
    floorPlans,
    floorPlansTitle: floorPlansConfig.title,
    floorPlansUnitLabel: floorPlansConfig.unitLabel,
    unitWord,
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
      name: apiProject.agent?.name || apiProject.owner?.name || 'Nguyễn Văn Việt',
      title: apiProject.agent ? 'Môi giới phụ trách' : 'Chuyên viên tư vấn dự án',
      phone: apiProject.agent?.phone || apiProject.owner?.phone || '0905123456',
    },
    relatedListings: apiProject.related_listings || apiProject.relatedListings || [],
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
    address: apiProp.location?.district ? `${apiProp.location.district.name}, Quảng Ngãi` : apiProp.address || 'Quảng Ngãi',
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

export default function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams?.slug;
  const searchParams = useSearchParams();
  const isPreview = searchParams?.get('preview') === '1';
  const { fetchProjectDetail, fetchProjectUnits, isLoading } = useProjects();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [projectData, setProjectData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [unitsData, setUnitsData] = useState<any[]>([]);
  
  const [mainImg, setMainImg] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  // Landing-page style: các section nằm trên cùng 1 trang, click tab sẽ cuộn mượt tới section
  // tương ứng. Dùng id + scrollIntoView; class scroll-mt-24 trên section lo phần chừa nav sticky.
  const scrollToSection = (i: number) => {
    setActiveTab(i);
    document.getElementById(SECTION_IDS[i])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const [liked, setLiked] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);
  const DESC_COLLAPSED_HEIGHT = 340;

  useEffect(() => {
    if (descRef.current) {
      setDescOverflows(descRef.current.scrollHeight > DESC_COLLAPSED_HEIGHT + 20);
    }
  }, [projectData?.overview]);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Mortgage loan calculator state
  const [propertyValue, setPropertyValue] = useState<number>(3000000000);
  const [loanRatio, setLoanRatio] = useState<number>(70);
  const [loanTerm, setLoanTerm] = useState<number>(15);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [paymentMethod, setPaymentMethod] = useState<'declining' | 'equal'>('declining');

  useEffect(() => {
    if (projectData && projectData.priceFrom) {
      setPropertyValue(projectData.priceFrom);
    }
  }, [projectData]);

  // Scrollspy: highlight tab tương ứng với section đang trong khung nhìn
  useEffect(() => {
    if (!projectData) return;
    const els = SECTION_IDS.map((id) => document.getElementById(id));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = els.findIndex((el) => el === entry.target);
            if (idx >= 0) setActiveTab(idx);
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    els.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectData]);

  // Chế độ preview (nhúng iframe từ trang quản trị): không gọi API,
  // nhận dữ liệu nháp qua postMessage để hiển thị đúng template thật.
  useEffect(() => {
    if (!isPreview) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== 'project-preview' || !e.data.payload) return;
      const mapped = mapApiProjectDetail(e.data.payload);
      setProjectData(mapped);
      setUnitsData(mapped.relatedListings || []);
    };
    window.addEventListener('message', onMessage);
    // Báo cho cửa sổ cha biết iframe đã sẵn sàng nhận dữ liệu
    window.parent?.postMessage({ type: 'preview-ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, [isPreview]);

  useEffect(() => {
    if (isPreview) return;
    const loadData = async () => {
      const res = await fetchProjectDetail(slug);
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
    if (slug) {
      loadData();
    }
  }, [slug, isPreview, fetchProjectDetail, fetchProjectUnits]);

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
          <Link href={`/du-an?district=${getDistrictQueryValue(projectData.district)}`} className="hover:text-primary transition-colors">{projectData.district}</Link>
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
                    referrerPolicy="no-referrer"
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
                        referrerPolicy="no-referrer"
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
                    <Image src={img} alt="" fill referrerPolicy="no-referrer" className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
                {[
                  { icon: LayoutGrid, label: 'Diện tích', value: projectData.totalArea },
                  { icon: Building, label: 'Block', value: `${projectData.totalBlocks} block` },
                  { icon: Home, label: isLandLikeProjectType(projectData.type) ? 'Lô đất' : 'Căn hộ', value: `${projectData.totalUnits} ${projectData.unitWord}` },
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

            {/* Tab nav — kiểu landing page: click sẽ cuộn tới section tương ứng */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {tabs.map((tab, i) => (
                  <button
                    key={tab.label}
                    onClick={() => scrollToSection(i)}
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

                {/* Section 0 — Tổng quan */}
                <div id={SECTION_IDS[0]} className="scroll-mt-24">
                  <div className="space-y-6">
                    {/* Thông tin dự án */}
                    <div>
                      <h2 className="text-base font-bold text-gray-900 mb-3">Tổng quan {projectData.name}</h2>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm mb-5">
                        {[
                          ['Chủ đầu tư', projectData.developer],
                          ['Loại hình', getProjectTypeLabel(projectData.type)],
                          ['Tổng diện tích', projectData.totalArea],
                          ['Số block', `${projectData.totalBlocks} block`],
                          ['Số tầng', `${projectData.totalFloors} tầng`],
                          [isLandLikeProjectType(projectData.type) ? 'Số lô đất' : 'Số lượng', `${projectData.totalUnits} ${projectData.unitWord}`],
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
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-5 flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Khoảng giá dự kiến</p>
                          <p className="text-xl font-bold text-primary">
                            {projectData.priceFrom || projectData.priceTo
                              ? `${formatPrice(projectData.priceFrom)} – ${formatPrice(projectData.priceTo)}`
                              : 'Chưa cập nhật'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 mb-1">Đơn giá dự tính</p>
                          <p className="text-sm font-bold text-cta">
                            {(() => {
                              // Đơn giá dự tính = Giá thấp nhất của dự án ÷ Diện tích nhỏ nhất
                              // của loại mặt bằng điển hình đang hiển thị — lấy động từ mục
                              // "Loại mặt bằng điển hình" (Admin quản lý), không hardcode.
                              const minArea = minFloorPlanArea(projectData.floorPlans);
                              if (!projectData.priceFrom || minArea <= 0) return 'Đang cập nhật';

                              const pricePerM2 = projectData.priceFrom / minArea;
                              const millionPerM2 = pricePerM2 / 1000000;
                              if (millionPerM2 < 0.1) {
                                return `từ ${(millionPerM2 * 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} nghìn/m²`;
                              }
                              return `từ ${millionPerM2.toLocaleString('vi-VN', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} triệu/m²`;
                            })()}
                          </p>
                        </div>
                      </div>

                      {/* Mô tả — HTML từ RichTextEditor (H2/H3, ảnh chèn...), sanitize trước khi
                          render. whitespace-pre-line vẫn giữ để mô tả cũ (text thường, chưa qua
                          editor mới) xuống dòng đúng dù không có thẻ <br>. Thu gọn + nút "Xem thêm"
                          khi nội dung dài (nhiều mục như "2. Vị trí ... có gì nổi bật?") để tránh
                          chiếm quá nhiều chỗ ngay từ đầu trang. */}
                      <div className="relative">
                        <div
                          ref={descRef}
                          className={`text-sm text-gray-600 leading-relaxed whitespace-pre-line [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-[15px] [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-2.5 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline [&_img]:rounded-lg [&_img]:my-2 [&_img]:max-w-full overflow-hidden transition-[max-height] duration-300 ${
                            !descExpanded && descOverflows ? 'max-h-[340px]' : 'max-h-none'
                          }`}
                          dangerouslySetInnerHTML={{ __html: sanitizeRichText(projectData.overview) }}
                        />
                        {!descExpanded && descOverflows && (
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                        )}
                      </div>
                      {descOverflows && (
                        <button
                          type="button"
                          onClick={() => setDescExpanded((v) => !v)}
                          className="mt-2 text-sm font-semibold text-primary hover:underline"
                        >
                          {descExpanded ? 'Thu gọn' : 'Xem thêm'}
                        </button>
                      )}
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
                      <h3 className="text-sm font-bold text-gray-900 mb-3">{projectData.floorPlansTitle || 'Loại căn hộ'}</h3>
                      <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {visibleFloorPlans(projectData.floorPlans).map((fp: any) => (
                          <div key={fp.type} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <Ruler className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{fp.type}</p>
                                <p className="text-xs text-gray-400">{fp.area} · {fp.count} {projectData.floorPlansUnitLabel || 'căn'}</p>
                              </div>
                            </div>
                            <p className="text-sm font-bold text-primary">{formatPrice(fp.priceFrom)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <hr className="border-gray-100 my-5" />

                    {/* Công cụ tính lãi suất vay mua nhà */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4.5 space-y-4">
                      <h3 className="text-sm font-bold text-gray-900 border-l-2 border-primary pl-2 uppercase tracking-wide text-[11px] flex items-center justify-between">
                        <span>Công cụ tính lãi suất vay ngân hàng</span>
                        <span className="text-[10px] text-primary font-semibold lowercase bg-primary/5 px-2 py-0.5 rounded border border-primary/10 select-none">
                          Liên kết 8+ ngân hàng Quảng Ngãi
                        </span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Cột trái: Nhập liệu */}
                        <div className="space-y-3.5">
                          {/* Tổng giá trị nhà đất */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Giá trị bất động sản (VNĐ)</label>
                            <input
                              type="text"
                              value={propertyValue.toLocaleString('vi-VN')}
                              onChange={(e) => {
                                const val = parseInt(e.target.value.replace(/\./g, ''));
                                setPropertyValue(isNaN(val) ? 0 : val);
                              }}
                              className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none bg-white"
                            />
                            <p className="text-[10px] text-primary font-medium">Bằng chữ: {formatPrice(propertyValue)}</p>
                          </div>

                          {/* Tỷ lệ vay */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                              <span>Tỷ lệ vay vốn</span>
                              <span className="text-primary font-semibold">{loanRatio}%</span>
                            </div>
                            <input
                              type="range"
                              min="30"
                              max="85"
                              value={loanRatio}
                              onChange={(e) => setLoanRatio(Number(e.target.value))}
                              className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                            />
                            <div className="flex justify-between text-[9px] text-gray-400 font-semibold">
                              <span>Tối thiểu 30%</span>
                              <span>Tối đa 85%</span>
                            </div>
                          </div>

                          {/* Thời gian vay */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                              <span>Thời gian vay</span>
                              <span className="text-primary font-semibold">{loanTerm} năm ({loanTerm * 12} tháng)</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="25"
                              value={loanTerm}
                              onChange={(e) => setLoanTerm(Number(e.target.value))}
                              className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                            />
                            <div className="flex justify-between text-[9px] text-gray-400 font-semibold">
                              <span>1 năm</span>
                              <span>25 năm</span>
                            </div>
                          </div>

                          {/* Lãi suất */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Lãi suất vay năm (% / năm)</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.1"
                                min="1"
                                max="20"
                                value={interestRate}
                                onChange={(e) => setInterestRate(Number(e.target.value))}
                                className="w-24 h-9 px-3 text-xs font-semibold rounded-lg border border-gray-200 focus:border-primary outline-none bg-white"
                              />
                              <span className="text-xs text-gray-500 font-medium">% / năm (ưu đãi trung bình tại Quảng Ngãi)</span>
                            </div>
                          </div>

                          {/* Phương thức trả nợ */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Phương thức trả nợ</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setPaymentMethod('declining')}
                                className={`h-9 text-[11px] font-bold rounded-lg border transition-all ${
                                  paymentMethod === 'declining'
                                    ? 'border-primary bg-primary-light text-primary'
                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50 bg-white'
                                }`}
                              >
                                Dư nợ giảm dần
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaymentMethod('equal')}
                                className={`h-9 text-[11px] font-bold rounded-lg border transition-all ${
                                  paymentMethod === 'equal'
                                    ? 'border-primary bg-primary-light text-primary'
                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50 bg-white'
                                }`}
                              >
                                Chia đều mỗi tháng
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Cột phải: Kết quả tính toán */}
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-4 flex flex-col justify-between">
                          {(() => {
                            const loanAmount = propertyValue * (loanRatio / 100);
                            const monthlyInterest = interestRate / 12 / 100;
                            const totalMonths = loanTerm * 12;
                            
                            let firstMonthPayment = 0;
                            let firstMonthInterest = 0;
                            let monthlyPrincipal = 0;
                            let totalInterest = 0;
                            
                            if (paymentMethod === 'declining') {
                              monthlyPrincipal = loanAmount / totalMonths;
                              firstMonthInterest = loanAmount * monthlyInterest;
                              firstMonthPayment = monthlyPrincipal + firstMonthInterest;
                              
                              let remainingDebt = loanAmount;
                              for (let i = 0; i < totalMonths; i++) {
                                const interest = remainingDebt * monthlyInterest;
                                totalInterest += interest;
                                remainingDebt -= monthlyPrincipal;
                              }
                            } else {
                              const p = loanAmount;
                              const r = monthlyInterest;
                              const n = totalMonths;
                              if (r > 0) {
                                firstMonthPayment = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                              } else {
                                firstMonthPayment = p / n;
                              }
                              totalInterest = (firstMonthPayment * n) - p;
                              firstMonthInterest = p * r;
                              monthlyPrincipal = firstMonthPayment - firstMonthInterest;
                            }

                            const totalPaid = loanAmount + totalInterest;

                            return (
                              <>
                                <div className="space-y-3">
                                  <div className="pb-2.5 border-b border-gray-200/50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Cần chuẩn bị tự có ({100 - loanRatio}%)</p>
                                    <p className="text-xs font-bold text-gray-700">{(propertyValue - loanAmount).toLocaleString('vi-VN')} đ</p>
                                  </div>

                                  <div className="pb-2.5 border-b border-gray-200/50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Số tiền được ngân hàng giải ngân ({loanRatio}%)</p>
                                    <p className="text-xs font-bold text-primary">{loanAmount.toLocaleString('vi-VN')} đ</p>
                                  </div>

                                  <div className="pb-2.5 border-b border-gray-200/50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Trả tháng đầu tiên (Gốc + Lãi)</p>
                                    <p className="text-sm font-extrabold text-cta">{Math.round(firstMonthPayment).toLocaleString('vi-VN')} đ</p>
                                    <p className="text-[9px] text-gray-400 font-medium mt-0.5 leading-normal">
                                      Trong đó: Gốc {Math.round(monthlyPrincipal).toLocaleString('vi-VN')} đ + Lãi {Math.round(firstMonthInterest).toLocaleString('vi-VN')} đ
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Tổng tiền lãi phải trả toàn bộ thời hạn</p>
                                    <p className="text-xs font-bold text-gray-700">{Math.round(totalInterest).toLocaleString('vi-VN')} đ</p>
                                  </div>
                                </div>

                                <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/5 text-center">
                                  <p className="text-[9px] font-bold text-primary uppercase tracking-wider mb-0.5">Tổng số tiền trả góp (Gốc + Lãi)</p>
                                  <p className="text-sm font-extrabold text-primary">{Math.round(totalPaid).toLocaleString('vi-VN')} đ</p>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 1 — Vị trí */}
                <div id={SECTION_IDS[1]} className="scroll-mt-24 pt-10 mt-10 border-t border-gray-100">
                  <NearbyTab project={projectData} />
                </div>

                {/* Section 2 — FAQ */}
                <div id={SECTION_IDS[2]} className="scroll-mt-24 pt-10 mt-10 border-t border-gray-100">
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
                </div>
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
                {unitsData.length > 0 ? (
                  unitsData.map((item: any) => (
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
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <p className="text-sm font-semibold">Chưa có tin đăng mua bán nào tại dự án này.</p>
                    <p className="text-xs text-gray-400 mt-1">Hãy là người đầu tiên đăng tin bán hoặc cho thuê tại {projectData.name}!</p>
                  </div>
                )}
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
                    ['Loại hình', getProjectTypeLabel(projectData.type)],
                    ['Tỉnh / TP', projectData.province],
                    ['Quận / Huyện', projectData.district],
                    ['Tổng diện tích', projectData.totalArea],
                    [isLandLikeProjectType(projectData.type) ? 'Số lô đất' : 'Số lượng', `${projectData.totalUnits} ${projectData.unitWord}`],
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
                referrerPolicy="no-referrer"
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
                  <img src={img} alt={`Thumb ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

