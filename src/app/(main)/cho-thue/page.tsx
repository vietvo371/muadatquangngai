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
    id: '4',
    title: 'Căn hộ chung cư mini cho thuê 35m2 đầy đủ nội thất',
    slug: 'can-ho-chung-cu-mini-cho-thue-35m2-day-du-noi-that',
    price: 5000000,
    priceUnit: 'per_month' as const,
    area: 35,
    type: 'rent' as const,
    thumbnail: '/images/image_data/Haus-Coastal.jpg',
    location: 'Quảng Ngãi, Trần Phú',
    bedrooms: 1,
    bathrooms: 1,
    isVip: 'vip' as const,
    user: { name: 'Phạm Thị D', avatar: null },
  },
  {
    id: '7',
    title: 'Nhà trọ 1PN cho thuê 20m2 gần trường đại học',
    slug: 'nha-tro-1pn-cho-thue-20m2-gan-truong-dai-hoc',
    price: 2000000,
    priceUnit: 'per_month' as const,
    area: 20,
    type: 'rent' as const,
    thumbnail: '/images/image_data/nha-pho-de-palace-river.jpg',
    location: 'Quảng Ngãi, Trần Phú',
    bedrooms: 1,
    bathrooms: 1,
    isVip: 'normal' as const,
    user: { name: 'Nguyễn Văn E', avatar: null },
  },
  {
    id: '8',
    title: 'Văn phòng cho thuê 50m2 tại trung tâm thành phố',
    slug: 'van-phong-cho-thue-50m2-tai-trung-tam-thanh-pho',
    price: 15000000,
    priceUnit: 'per_month' as const,
    area: 50,
    type: 'rent' as const,
    thumbnail: '/images/image_data/du-lich-binh-son-quang-ngai-phan-van-travel-1.webp',
    location: 'Quảng Ngãi, Lê Lợi',
    bedrooms: 0,
    bathrooms: 1,
    isVip: 'vip_plus' as const,
    user: { name: 'Trần Văn F', avatar: null },
  },
  {
    id: '9',
    title: 'Mặt bằng kinh doanh 80m2 mặt tiền đường lớn',
    slug: 'mat-bang-kinh-doanh-80m2-mat-tien-duong-lon',
    price: 30000000,
    priceUnit: 'per_month' as const,
    area: 80,
    type: 'rent' as const,
    thumbnail: '/images/image_data/shutterstock2065827521lyson-1701400873758.jpg',
    location: 'Quảng Ngãi, Nghĩa Lộ',
    bedrooms: 0,
    bathrooms: 1,
    isVip: 'diamond' as const,
    user: { name: 'Lê Thị G', avatar: null },
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
          <span className="text-gray-900">Cho thuê nhà đất</span>
        </div>

        <div className="flex gap-8 items-start">
          
          {/* Left Sidebar Filters */}
          <FilterSidebar />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight">Cho thuê nhà đất tại Quảng Ngãi</h1>
              <p className="text-[14px] text-gray-500 mt-1">Cập nhật danh sách bất động sản cho thuê mới nhất hôm nay</p>
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

export default function ChoThuePage() {
  return (
    <Suspense fallback={<PropertyListingLoading />}>
      <PropertyListingContent />
    </Suspense>
  );
}
