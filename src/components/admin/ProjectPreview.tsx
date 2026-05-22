'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  MapPin, Building, Home, Calendar, CheckCircle,
  Share2, Heart, ChevronRight, ChevronLeft, X,
  Ruler, LayoutGrid, GraduationCap, ShoppingCart, Trees, Cross, Clock,
  DollarSign
} from 'lucide-react';
import { formatPrice } from '@/lib/formatters';

interface PreviewProjectData {
  name: string;
  slug: string;
  investor: string;
  category: string;
  type: string;
  min_price: number;
  max_price: number;
  total_area: number;
  total_units: number;
  total_blocks: number;
  total_floors: number;
  legal: string;
  handover_date: string;
  construction_progress: number;
  location: string;
  description: string;
  utilities: string[];
  status: string;
  thumbnail?: string;
}

interface ProjectPreviewProps {
  data: PreviewProjectData;
}

const typeMap: Record<string, string> = {
  townhouse: 'Nhà phố',
  villa: 'Biệt thự',
  apartment: 'Căn hộ chung cư',
  commercial: 'Thương mại / Shophouse',
  land: 'Đất nền',
};

const statusConfig = {
  upcoming: { label: 'Sắp mở bán', bg: 'bg-amber-100 border-amber-200', text: 'text-amber-700' },
  selling:  { label: 'Đang mở bán', bg: 'bg-green-100 border-green-200', text: 'text-green-700' },
  completed:{ label: 'Đã bàn giao', bg: 'bg-gray-100 border-gray-200',  text: 'text-gray-600'  },
  paused:   { label: 'Tạm dừng',    bg: 'bg-red-100 border-red-200',   text: 'text-red-700'   },
  draft:     { label: 'Bản nháp',    bg: 'bg-gray-100 border-gray-200',  text: 'text-gray-600'  },
  published: { label: 'Đã xuất bản',  bg: 'bg-green-100 border-green-200', text: 'text-green-700' },
  archived:  { label: 'Đã lưu trữ',  bg: 'bg-yellow-100 border-yellow-200', text: 'text-yellow-700' },
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

export default function ProjectPreview({ data }: ProjectPreviewProps) {
  const [mainImg, setMainImg] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [liked, setLiked] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [nearbyCat, setNearbyCat] = useState<NearbyCategory>('school');

  // Fallback defaults for empty values
  const projectName = data.name || 'Tên dự án mẫu';
  const projectTypeName = typeMap[data.type] || 'Căn hộ chung cư';
  const status = statusConfig[data.status as keyof typeof statusConfig] || statusConfig['selling'];
  
  // Gallery formulation matching client detail page behavior
  const gallery = [
    data.thumbnail || '/images/image_data/nha-pho-de-palace-river.jpg',
    '/images/image_data/Starlight---suc-hut-den-tu-vi-tri-dac-dia-nhat-trung-tam-Quang-Ngai-suc-hut-3-1733900371-424-width1000height563.jpg',
    '/images/image_data/Haus-Coastal.jpg',
    '/images/image_data/banner_hero.jpg',
    '/images/image_data/thi_tran_9b705.jpg',
  ];

  const totalArea = data.total_area ? `${data.total_area} ha` : '2.5 ha';
  const totalUnits = data.total_units || 256;
  const totalBlocks = data.total_blocks || 2;
  const totalFloors = data.total_floors || 18;
  const handoverDate = data.handover_date || '2026-12-31';
  const legalStatus = data.legal || 'Sổ hồng / Sổ đỏ';
  const developer = data.investor || 'Công ty CP Địa Ốc Quảng Ngãi';
  const progress = data.construction_progress || 0;
  const address = data.location || 'Đầu cầu Thạch Bích, TP Quảng Ngãi, Quảng Ngãi';

  // Extract district from location
  const districtName = data.location?.split(',').slice(-2, -1)[0]?.trim() || 'TP Quảng Ngãi';

  const nearbyPlaces = {
    school: [
      { name: `Trường Tiểu học ${districtName}`, address: `${districtName}, Quảng Ngãi`, dist: '0.8 km', time: '2 phút' },
      { name: `Trường THCS Lê Hồng Phong`, address: `${districtName}, Quảng Ngãi`, dist: '1.2 km', time: '3 phút' },
      { name: `Trường Mầm non quốc tế`, address: `${districtName}, Quảng Ngãi`, dist: '0.5 km', time: '1 phút' },
    ],
    supermarket: [
      { name: 'Co.opmart Quảng Ngãi', address: 'Đường Nguyễn Du, TP Quảng Ngãi', dist: '2.0 km', time: '4 phút' },
      { name: 'Siêu thị Go! Quảng Ngãi', address: 'Đường Lê Lợi, TP Quảng Ngãi', dist: '2.5 km', time: '5 phút' },
    ],
    park: [
      { name: 'Công viên Ba Tơ', address: 'TP Quảng Ngãi', dist: '1.5 km', time: '3 phút' },
      { name: 'Quảng trường đường Phạm Văn Đồng', address: 'TP Quảng Ngãi', dist: '2.2 km', time: '5 phút' },
    ],
    hospital: [
      { name: 'Bệnh viện Đa khoa Tỉnh Quảng Ngãi', address: 'Đường Hùng Vương, TP Quảng Ngãi', dist: '2.1 km', time: '4 phút' },
    ],
  };

  const faqList = [
    {
      q: `Giá mua bán dự án ${projectName} hiện nay?`,
      a: `Giá từ ${data.min_price ? formatPrice(data.min_price) : 'Liên hệ'} đến ${data.max_price ? formatPrice(data.max_price) : 'Liên hệ'} tùy thuộc vào vị trí, diện tích và loại hình căn hộ. Liên hệ với chúng tôi để nhận bảng giá chi tiết mới nhất.`,
    },
    {
      q: `Địa chỉ dự án ${projectName} ở đâu?`,
      a: `Dự án tọa lạc tại ${address}.`,
    },
    {
      q: `Chủ đầu tư dự án ${projectName} là ai?`,
      a: `Chủ đầu tư dự án là ${developer}.`,
    },
  ];

  return (
    <div className="sticky top-6 rounded-2xl border border-gray-200 bg-gray-50 shadow-md overflow-hidden">
      {/* Mock Browser Header */}
      <div className="bg-gray-100/90 px-4 py-3 border-b border-gray-200 flex items-center gap-3 shrink-0 select-none">
        <div className="flex gap-1.5 shrink-0">
          <span className="w-3.5 h-3.5 rounded-full bg-red-400"></span>
          <span className="w-3.5 h-3.5 rounded-full bg-amber-400"></span>
          <span className="w-3.5 h-3.5 rounded-full bg-green-400"></span>
        </div>
        <div className="bg-white rounded-lg px-3 py-1 flex-1 text-center text-[11px] font-semibold text-gray-400 border border-gray-200/60 truncate shadow-xs select-none max-w-sm mx-auto">
          https://batdongsanquangngai.vn/du-an/{data.slug || 'slug-du-an'}
        </div>
        <span className="text-[10px] font-extrabold text-primary border border-primary/20 px-2 py-0.5 rounded bg-primary/5 select-none shrink-0 uppercase tracking-wider">
          LIVE PREVIEW
        </span>
      </div>

      {/* Main Preview Container simulating the Client Viewport */}
      <div className="max-h-[78vh] overflow-y-auto bg-gray-50/50 p-5 space-y-5">
        
        {/* Breadcrumb matching Client */}
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
          <span className="hover:text-primary transition-colors cursor-pointer">Trang chủ</span>
          <ChevronRight className="h-3 w-3" />
          <span className="hover:text-primary transition-colors cursor-pointer">Dự án</span>
          <ChevronRight className="h-3 w-3" />
          <span className="hover:text-primary transition-colors cursor-pointer">Quảng Ngãi</span>
          <ChevronRight className="h-3 w-3" />
          <span className="hover:text-primary transition-colors cursor-pointer">{districtName}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-800 font-medium line-clamp-1">{projectName}</span>
        </div>

        {/* Title row matching Client */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight mb-1">
              {projectName}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{address}</span>
              <span className="text-primary font-semibold hover:underline cursor-pointer ml-1">Xem bản đồ</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                liked ? 'border-primary/20 bg-primary-light text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current text-primary' : ''}`} />
              <span>Lưu</span>
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-gray-300 transition-colors">
              <Share2 className="h-3.5 w-3.5" />
              <span>Chia sẻ</span>
            </button>
          </div>
        </div>

        {/* Layout Row (2 columns: Left Main Content [67%] + Right Sidebar [33%]) */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          
          {/* ── LEFT / MAIN CONTENT ── */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            
            {/* Gallery Block matching Client */}
            <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-xs">
              <div className="flex gap-1 h-[240px] md:h-[300px]">
                {/* Main image preview */}
                <div className="relative flex-1 overflow-hidden group">
                  <Image
                    src={gallery[mainImg]}
                    alt={projectName}
                    fill
                    className="object-cover"
                    sizes="(max-w-7xl) 50vw"
                    priority
                    unoptimized
                  />
                  <div className={`absolute top-3 left-3 ${status.bg} ${status.text} text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm uppercase tracking-wide`}>
                    {status.label}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/55 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full select-none">
                    {mainImg + 1} / {gallery.length}
                  </div>
                </div>

                {/* Vertical Thumbnails column */}
                <div className="hidden sm:flex flex-col gap-1 w-24 md:w-32 shrink-0">
                  {gallery.slice(1, 4).map((img, idx) => {
                    const actualIdx = idx + 1;
                    return (
                      <button
                        key={idx}
                        onClick={() => setMainImg(actualIdx)}
                        className={`relative flex-1 overflow-hidden transition-all border-2 ${
                          mainImg === actualIdx ? 'border-primary ring-1 ring-primary/30' : 'border-transparent opacity-85 hover:opacity-100'
                        }`}
                      >
                        <Image
                          src={img}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="120px"
                          unoptimized
                        />
                        {idx === 2 && gallery.length > 4 && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold">
                            +{gallery.length - 4}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick stats grid under Gallery */}
              <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100 bg-white">
                {[
                  { icon: LayoutGrid, label: 'Diện tích', value: totalArea },
                  { icon: Building, label: 'Block', value: `${totalBlocks} block` },
                  { icon: Home, label: 'Căn hộ', value: `${totalUnits} căn` },
                  { icon: Calendar, label: 'Bàn giao', value: isNaN(new Date(handoverDate).getTime()) ? '2026' : new Date(handoverDate).getFullYear().toString() },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex flex-col items-center py-2.5 px-1.5 text-center select-none">
                    <Icon className="h-4 w-4 text-primary mb-1 shrink-0" />
                    <span className="text-xs font-bold text-gray-800 line-clamp-1">{value}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Tab Nav System */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
              <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-none bg-gray-50/50">
                {tabs.map((tab, idx) => (
                  <button
                    key={tab.label}
                    onClick={() => setActiveTab(idx)}
                    className={`flex flex-col items-start px-4.5 py-2.5 whitespace-nowrap border-b-2 transition-all text-left shrink-0 ${
                      activeTab === idx
                        ? 'border-primary text-primary bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50/40'
                    }`}
                  >
                    <span className="text-xs font-bold">{tab.label}</span>
                    <span className="text-[9px] text-gray-400 font-normal">{tab.sub}</span>
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="p-4.5">
                
                {/* ── TAB 0: TỔNG QUAN ── */}
                {activeTab === 0 && (
                  <div className="space-y-5">
                    
                    {/* Project Specifications Grid */}
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 mb-3 border-l-2 border-primary pl-2 uppercase tracking-wide text-[11px]">
                        Thông số Tổng quan
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                        {[
                          ['Chủ đầu tư', developer],
                          ['Loại hình', projectTypeName],
                          ['Tổng diện tích', totalArea],
                          ['Số block', `${totalBlocks} block`],
                          ['Số tầng', `${totalFloors} tầng`],
                          ['Số căn hộ', `${totalUnits} căn`],
                          ['Pháp lý', legalStatus],
                          ['Bàn giao', isNaN(new Date(handoverDate).getTime()) ? 'Liên hệ' : new Date(handoverDate).toLocaleDateString('vi-VN')],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-start py-1 border-b border-gray-50">
                            <span className="text-gray-400 shrink-0 w-24 font-medium">{k}</span>
                            <span className="font-semibold text-gray-800 truncate">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price Range Box matching Client */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 shadow-2xs">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Khoảng giá dự kiến</p>
                      <p className="text-base font-black text-primary flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-primary shrink-0" />
                        <span>
                          {data.min_price || data.max_price
                            ? `${formatPrice(data.min_price)} – ${formatPrice(data.max_price)}`
                            : 'Chưa cập nhật'}
                        </span>
                      </p>
                    </div>

                    {/* Description Paragraph */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 mb-2 border-l-2 border-primary pl-2 uppercase tracking-wide text-[11px]">
                        Mô tả dự án
                      </h3>
                      <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50/20 p-2.5 rounded-lg border border-gray-50 font-medium">
                        {data.description || 'Chưa có thông tin mô tả chi tiết cho dự án này.'}
                      </div>
                    </div>

                    {/* Utilities Badge Box */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 mb-2 border-l-2 border-primary pl-2 uppercase tracking-wide text-[11px]">
                        Tiện ích dự án
                      </h3>
                      {data.utilities && data.utilities.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {data.utilities.map((util) => (
                            <span
                              key={util}
                              className="flex items-center gap-1 text-[10px] font-bold bg-primary-light text-primary border border-primary/5 px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              <CheckCircle className="h-3 w-3 shrink-0" />
                              <span>{util}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 font-medium italic">Không ghi nhận tiện ích nổi bật nào.</p>
                      )}
                    </div>

                    {/* Floor Plans Type List */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 mb-2 border-l-2 border-primary pl-2 uppercase tracking-wide text-[11px]">
                        Loại căn hộ điển hình
                      </h3>
                      <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden bg-white">
                        {[
                          { type: '2 phòng ngủ', area: '72m²', count: Math.floor(totalUnits * 0.45), priceFrom: data.min_price || 3000000000 },
                          { type: '3 phòng ngủ', area: '95m²', count: Math.floor(totalUnits * 0.4), priceFrom: Math.floor((data.min_price || 3000000000) * 1.35) },
                          { type: 'Penthouse', area: '180m²', count: Math.floor(totalUnits * 0.15), priceFrom: data.max_price || 8000000000 },
                        ].map((fp) => (
                          <div key={fp.type} className="flex items-center justify-between px-3.5 py-2.5 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <Ruler className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <div>
                                <p className="text-xs font-bold text-gray-800">{fp.type}</p>
                                <p className="text-[10px] text-gray-400 font-semibold">{fp.area} · {fp.count} căn</p>
                              </div>
                            </div>
                            <p className="text-xs font-black text-primary">{formatPrice(fp.priceFrom)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Construction Progress Bar */}
                    <div className="bg-gray-50/40 p-3 rounded-xl border border-gray-100">
                      <h3 className="text-xs font-bold text-gray-900 mb-2 border-l-2 border-primary pl-2 uppercase tracking-wide text-[11px]">
                        Tiến độ xây dựng
                      </h3>
                      <div className="flex justify-between text-[11px] mb-1.5 font-bold">
                        <span className="text-gray-500">Hoàn thành thực tế</span>
                        <span className="text-primary">{progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 font-semibold mt-1.5">
                        Dự kiến bàn giao: {isNaN(new Date(handoverDate).getTime()) ? 'Chưa rõ' : new Date(handoverDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── TAB 1: VỊ TRÍ ── */}
                {activeTab === 1 && (
                  <div className="space-y-4">
                    <h2 className="text-xs font-bold text-gray-900 border-l-2 border-primary pl-2 uppercase tracking-wide text-[11px]">
                      Vị trí địa lý & Bản đồ
                    </h2>
                    <div className="flex items-start gap-1.5 text-xs text-gray-600 font-semibold">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span>{address}</span>
                    </div>

                    {/* Simulation Google Map Iframe Placeholder */}
                    <div className="w-full h-44 rounded-xl overflow-hidden border border-gray-200 bg-blue-50/40 relative flex items-center justify-center shadow-inner">
                      <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(16,117,177,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,117,177,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
                      <div className="z-10 flex flex-col items-center gap-1.5 p-3 text-center">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-xs">
                          <MapPin className="w-5 h-5 animate-bounce text-primary" />
                        </div>
                        <span className="text-xs font-bold text-gray-800">Bản đồ vệ tinh {projectName}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{address}</span>
                      </div>
                    </div>

                    {/* Nearby Utility Facilities Tabs */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                      <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50">
                        {nearbyTabs.map(({ key, label, Icon }) => (
                          <button
                            key={key}
                            onClick={() => setNearbyCat(key)}
                            className={`flex items-center gap-1 px-3 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
                              nearbyCat === key
                                ? 'border-primary text-primary bg-white'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>

                      <p className="px-3.5 py-1.5 text-[10px] text-gray-500 bg-gray-50 border-b border-gray-100 font-semibold select-none">
                        Có {nearbyPlaces[nearbyCat].length} điểm {nearbyTabs.find(t => t.key === nearbyCat)?.label.toLowerCase()} trong vòng 5 km
                      </p>

                      <div className="divide-y divide-gray-50">
                        {nearbyPlaces[nearbyCat].map((p) => (
                          <div key={p.name} className="flex items-center justify-between px-3.5 py-2.5 hover:bg-gray-50/50 transition-colors">
                            <div>
                              <p className="text-xs font-bold text-gray-800">{p.name}</p>
                              <p className="text-[10px] text-gray-400 font-medium mt-0.5">{p.address}</p>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              <p className="text-xs font-bold text-gray-700">{p.dist}</p>
                              <p className="text-[9px] text-gray-400 flex items-center gap-0.5 justify-end font-semibold">
                                <Clock className="h-2.5 w-2.5" /> {p.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: FAQ ── */}
                {activeTab === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-xs font-bold text-gray-900 border-l-2 border-primary pl-2 uppercase tracking-wide text-[11px]">
                      Các câu hỏi thường gặp
                    </h2>

                    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white">
                      {faqList.map((item, idx) => (
                        <div key={idx} className="transition-colors">
                          <button
                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                            className="w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-gray-50/80 transition-colors focus:outline-none"
                          >
                            <span className="w-1 h-3.5 mt-0.5 bg-primary rounded-full shrink-0" />
                            <span className="flex-1 text-xs font-bold text-gray-800 leading-snug">{item.q}</span>
                          </button>
                          {openFaq === idx && (
                            <div className="px-4 pb-3.5 text-xs text-gray-600 leading-relaxed border-t border-gray-50 pt-2 font-medium bg-gray-50/10">
                              {item.a}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Helpful Rating Mock */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 flex-wrap gap-2 text-[10px]">
                        <div className="flex items-center gap-1.5 text-gray-500 font-semibold">
                          <span>Thông tin hữu ích không?</span>
                          <button className="px-2.5 py-0.5 rounded border border-gray-300 text-gray-700 bg-white hover:border-primary hover:text-primary transition-colors">Có</button>
                          <button className="px-2.5 py-0.5 rounded border border-gray-300 text-gray-700 bg-white hover:border-primary hover:text-primary transition-colors">Không</button>
                        </div>
                        <button className="font-extrabold text-primary border border-primary px-3 py-1 rounded bg-white hover:bg-primary-light transition-all">
                          Đặt câu hỏi
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Related Buy/Sell Listings bottom block matching Client */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 select-none">
                  <div className="w-1 h-3.5 bg-primary rounded-full" />
                  <h3 className="text-xs font-bold text-gray-900">Tin mua bán nổi bật tại {projectName}</h3>
                </div>
                <span className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer">
                  Xem tất cả <ChevronRight className="h-3 w-3" />
                </span>
              </div>
              <div className="divide-y divide-gray-50 bg-white">
                {[
                  {
                    id: 'r1',
                    title: `Bán căn hộ 3PN ${projectName} tầng 12 view đẹp cực thoáng`,
                    price: data.min_price ? formatPrice(Math.floor((data.min_price + data.max_price || data.min_price * 2) / 2)) : '6.5 tỷ',
                    area: '95m²',
                    postedAt: 'Đăng hôm nay',
                    image: gallery[0],
                  },
                  {
                    id: 'r2',
                    title: `Cho thuê căn hộ 2PN ${projectName} full nội thất cao cấp dọn vào ngay`,
                    price: '8 triệu/tháng',
                    area: '72m²',
                    postedAt: 'Hôm qua',
                    image: gallery[2],
                  },
                ].map((item) => (
                  <div key={item.id} className="flex gap-3 p-3.5 hover:bg-gray-50/50 transition-colors group cursor-pointer">
                    <div className="relative w-20 h-14 shrink-0 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="80px"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition-colors leading-snug mb-1">
                        {item.title}
                      </p>
                      <p className="text-xs font-bold text-primary">
                        {item.price} <span className="text-gray-400 font-normal">·</span> <span className="text-gray-500 font-normal">{item.area}</span>
                      </p>
                      <p className="text-[9px] text-gray-400 mt-0.5 font-medium">{item.postedAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="w-full lg:w-64 shrink-0 space-y-4 select-none">
            
            {/* Consultant Contact Card matching Client */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-xs">
              <div className="bg-primary px-4 py-3.5">
                <p className="text-white font-bold text-xs">Liên hệ tư vấn miễn phí</p>
                <p className="text-white/80 text-[10px] mt-0.5 font-medium leading-relaxed">Nhận bảng giá và chính sách chiết khấu mới nhất</p>
              </div>

              <div className="p-3.5 space-y-3 bg-white">
                <div className="flex items-center gap-3 pb-3.5 border-b border-gray-50">
                  <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary font-black text-xs shrink-0 select-none">
                    V
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">Nguyễn Văn Việt</p>
                    <p className="text-[10px] text-gray-400 font-semibold">Chuyên viên tư vấn dự án</p>
                  </div>
                </div>

                <button className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/95 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-2xs">
                  Liên hệ tôi
                </button>
              </div>
            </div>

            {/* Quick Summary Info Card matching Client sidebar */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-xs">
              <div className="px-3.5 py-2.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/20">
                <div className="w-1 h-3.5 bg-primary rounded-full" />
                <h3 className="text-xs font-bold text-gray-800">Thông tin dự án</h3>
              </div>
              <div className="px-3.5 py-3 space-y-2.5 text-xs bg-white">
                {[
                  ['Chủ đầu tư', developer],
                  ['Loại hình', projectTypeName],
                  ['Tổng diện tích', totalArea],
                  ['Số căn hộ', `${totalUnits} căn`],
                  ['Pháp lý', legalStatus],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2.5 py-0.5 border-b border-gray-50/50 pb-1.5 last:border-b-0 last:pb-0">
                    <span className="text-gray-400 shrink-0 font-medium">{k}</span>
                    <span className="font-semibold text-gray-800 text-right truncate max-w-[130px]">{v}</span>
                  </div>
                ))}

                <div className="border-t border-gray-100 pt-2.5 mt-1">
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wide mb-0.5">Giá từ</p>
                  <p className="text-sm font-black text-primary">
                    {data.min_price ? formatPrice(data.min_price) : 'Liên hệ trực tiếp'}
                  </p>
                </div>
              </div>
            </div>

          </aside>

        </div>
      </div>
    </div>
  );
}
