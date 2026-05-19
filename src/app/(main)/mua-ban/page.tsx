'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PropertyCard } from '@/components/property/PropertyCard';
import { FilterSidebar } from '@/components/search/FilterSidebar';
import { SortBar } from '@/components/search/SortBar';
import { ActiveFilterChips } from '@/components/search/ActiveFilterChips';
import { PropertyCardSkeleton } from '@/components/property/PropertyCardSkeleton';
import { MapPin, ArrowRight, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const mockProperties = [
  {
    id: '1',
    title: 'Căn hộ cao cấp 2PN view biển Mỹ Khê',
    slug: 'can-ho-cao-cap-2pn-view-bien-my-khe',
    price: 2800000000,
    priceUnit: 'total' as const,
    area: 75,
    type: 'sale' as const,
    thumbnail: '/images/image_data/Haus-Coastal.jpg',
    location: 'Quảng Ngãi, TP Quảng Ngãi',
    bedrooms: 2,
    bathrooms: 2,
    isVip: 'vip' as const,
    user: { name: 'Nguyễn Văn A', avatar: null },
  },
  {
    id: '2',
    title: 'Nhà mặt phố 4 tầng mặt tiền 5m Quang Trung',
    slug: 'nha-mat-pho-4-tang-mat-tien-5m-quang-trung',
    price: 6500000000,
    priceUnit: 'total' as const,
    area: 120,
    type: 'sale' as const,
    thumbnail: '/images/image_data/nha-pho-de-palace-river.jpg',
    location: 'Quảng Ngãi, Quảng Phú',
    bedrooms: 5,
    bathrooms: 4,
    isVip: 'vip_plus' as const,
    user: { name: 'Trần Thị B', avatar: null },
  },
  {
    id: '3',
    title: 'Đất nền dự án ven biển 500m2 có sổ đỏ',
    slug: 'dat-nen-du-an-ven-bien-500m2-co-so-do',
    price: 1800000000,
    priceUnit: 'total' as const,
    area: 500,
    type: 'sale' as const,
    thumbnail: '/images/image_data/shutterstock2065827521lyson-1701400873758.jpg',
    location: 'Quảng Ngãi, Tịnh An',
    bedrooms: 0,
    bathrooms: 0,
    isVip: 'diamond' as const,
    user: { name: 'Lê Văn C', avatar: null },
  },
  {
    id: '4',
    title: 'Villa 3 tầng view biển 300m2 có hồ bơi',
    slug: 'villa-3-tang-view-bien-300m2-co-ho-boi',
    price: 15000000000,
    priceUnit: 'total' as const,
    area: 300,
    type: 'sale' as const,
    thumbnail: '/images/image_data/nha-pho-de-palace-river.jpg',
    location: 'Quảng Ngãi, Tịnh Hà',
    bedrooms: 4,
    bathrooms: 5,
    isVip: 'diamond' as const,
    user: { name: 'Hoàng Văn E', avatar: null },
  },
  {
    id: '5',
    title: 'Căn hộ 2PN chung cư Vincom diện tích 85m2',
    slug: 'can-ho-2pn-chung-cu-vincom-dien-tich-85m2',
    price: 3500000000,
    priceUnit: 'total' as const,
    area: 85,
    type: 'sale' as const,
    thumbnail: '/images/image_data/Starlight---suc-hut-den-tu-vi-tri-dac-dia-nhat-trung-tam-Quang-Ngai-suc-hut-3-1733900371-424-width1000height563.jpg',
    location: 'Quảng Ngãi, Trần Phú',
    bedrooms: 2,
    bathrooms: 2,
    isVip: 'vip' as const,
    user: { name: 'Vũ Thị F', avatar: null },
  },
];

function PropertyListingContent() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading] = useState(false);

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="max-w-[1200px] mx-auto px-4">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-6 font-medium">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900">Mua bán nhà đất</span>
        </div>

        <div className="flex gap-8 items-start">
          
          {/* Left Sidebar Filters */}
          <FilterSidebar />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight">Bán nhà đất tại Quảng Ngãi</h1>
              <p className="text-[14px] text-gray-500 mt-1">Cập nhật danh sách bất động sản bán mới nhất hôm nay</p>
            </div>

            {/* Sort & Filters Toolbar */}
            <div className="mb-6">
              <SortBar />
              <ActiveFilterChips />
            </div>

            {/* Properties Grid */}
            {isLoading ? (
              <div className={viewMode === 'grid'
                ? 'grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5'
                : 'space-y-4'
              }>
                {[...Array(6)].map((_, i) => (
                  <PropertyCardSkeleton key={i} variant={viewMode} />
                ))}
              </div>
            ) : mockProperties.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-gray-100">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary-light flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Không tìm thấy tin đăng</h3>
                <p className="text-[14px] text-gray-500 mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <button className="px-5 py-2 rounded-lg border border-primary text-primary hover:bg-primary-light font-medium text-[14px] transition-colors">
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? 'grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5'
                : 'space-y-4'
              }>
                {mockProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} variant={viewMode} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {mockProperties.length > 0 && (
              <div className="flex justify-center mt-10">
                <div className="flex items-center gap-1.5">
                  <button className="w-9 h-9 rounded-lg border border-gray-200 text-gray-400 flex items-center justify-center cursor-not-allowed">
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </button>
                  <button className="w-9 h-9 rounded-lg bg-primary text-white font-medium shadow-sm">1</button>
                  <button className="w-9 h-9 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">2</button>
                  <button className="w-9 h-9 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">3</button>
                  <button className="w-9 h-9 rounded-lg text-gray-400 font-medium" disabled>…</button>
                  <button className="w-9 h-9 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">10</button>
                  <button className="w-9 h-9 rounded-lg border border-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function PropertyListingLoading() {
  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="max-w-[1200px] mx-auto px-4 flex gap-8">
        <div className="w-[260px] hidden lg:block bg-gray-200 rounded-2xl h-[500px] animate-pulse" />
        <div className="flex-1">
          <div className="h-10 w-1/3 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MuaBanPage() {
  return (
    <Suspense fallback={<PropertyListingLoading />}>
      <PropertyListingContent />
    </Suspense>
  );
}
