'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SearchBar } from '@/components/search/SearchBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { MapPin, Building, Calendar, Users, Home } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';

// Mock data
const projects = [
  {
    id: '1',
    slug: 'sea-garden-da-nang',
    name: 'Sea Garden Đà Nẵng',
    developer: 'Sun Group',
    thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
    status: 'selling',
    type: 'apartment',
    province: 'Đà Nẵng',
    district: 'Sơn Trà',
    address: 'Đường Võ Nguyên Giáp, Phường Mỹ An',
    priceFrom: 3500000000,
    priceTo: 8000000000,
    totalUnits: 500,
    totalBlocks: 3,
    totalFloors: 25,
    constructionProgress: 80,
    handoverDate: '2024-12-31',
    description: 'Dự án căn hộ cao cấp view biển Mỹ Khê',
  },
  {
    id: '2',
    slug: 'green-park-quang-ngai',
    name: 'Green Park Quảng Ngãi',
    developer: 'Vingroup',
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
    status: 'upcoming',
    type: 'apartment',
    province: 'Quảng Ngãi',
    district: 'Tịnh Long',
    address: 'Đường Trần Kỳ, Tịnh Long',
    priceFrom: 1800000000,
    priceTo: 3500000000,
    totalUnits: 300,
    totalBlocks: 2,
    totalFloors: 20,
    constructionProgress: 20,
    handoverDate: '2025-06-30',
    description: 'Khu căn hộ xanh thông minh tại Quảng Ngãi',
  },
  {
    id: '3',
    slug: 'luxury-villa-hoi-an',
    name: 'Luxury Villa Hội An',
    developer: 'BRG Group',
    thumbnail: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop',
    status: 'selling',
    type: 'villa',
    province: 'Quảng Nam',
    district: 'Duy Xuyên',
    address: 'Khu du lịch sinh thái Cẩm Thanh',
    priceFrom: 15000000000,
    priceTo: 35000000000,
    totalUnits: 50,
    totalBlocks: 1,
    totalFloors: 3,
    constructionProgress: 60,
    handoverDate: '2025-03-31',
    description: 'Biệt thự cao cấp ven sông Hội An',
  },
  {
    id: '4',
    slug: 'metro-point-quang-ngai',
    name: 'Metro Point Quảng Ngãi',
    developer: 'Novaland',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
    status: 'selling',
    type: 'townhouse',
    province: 'Quảng Ngãi',
    district: 'Trần Phú',
    address: 'Đường Quang Trung, Trần Phú',
    priceFrom: 4500000000,
    priceTo: 7000000000,
    totalUnits: 120,
    totalBlocks: 4,
    totalFloors: 5,
    constructionProgress: 100,
    handoverDate: '2024-06-30',
    description: 'Shophouse liền kề ga metro tương lai',
  },
];

const statusConfig = {
  upcoming: { label: 'Sắp mở bán', color: 'bg-blue-100 text-blue-700' },
  selling: { label: 'Đang bán', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Đã bàn giao', color: 'bg-gray-100 text-gray-700' },
  paused: { label: 'Tạm dừng', color: 'bg-yellow-100 text-yellow-700' },
};

const typeConfig = {
  apartment: 'Căn hộ',
  villa: 'Biệt thự',
  townhouse: 'Nhà phố',
  commercial: 'Thương mại',
  land: 'Đất nền',
};

export default function DuAnPage() {
  const [sortBy, setSortBy] = useState('newest');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredProjects = projects.filter(p => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-white mb-4 text-center">
            Dự án bất động sản
          </h1>
          <p className="text-blue-100 text-center mb-6 max-w-2xl mx-auto">
            Khám phá các dự án bất động sản mới nhất tại Quảng Ngãi, Đà Nẵng và các tỉnh miền Trung
          </p>
          <div className="max-w-xl mx-auto">
            <SearchBar variant="hero" />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Loại dự án" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="apartment">Căn hộ</SelectItem>
              <SelectItem value="villa">Biệt thự</SelectItem>
              <SelectItem value="townhouse">Nhà phố</SelectItem>
              <SelectItem value="commercial">Thương mại</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="price_asc">Giá tăng dần</SelectItem>
              <SelectItem value="price_desc">Giá giảm dần</SelectItem>
            </SelectContent>
          </Select>

          <p className="flex-1 text-sm text-gray-500 py-2">
            <span className="font-semibold">{filteredProjects.length}</span> dự án
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredProjects.map((project) => {
            const status = statusConfig[project.status as keyof typeof statusConfig];
            return (
              <Link key={project.id} href={`/du-an/${project.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="relative aspect-[16/10]">
                    <img
                      src={project.thumbnail}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className={`absolute top-4 left-4 ${status.color}`}>
                      {status.label}
                    </Badge>
                    <Badge variant="secondary" className="absolute top-4 right-4">
                      {typeConfig[project.type as keyof typeof typeConfig]}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </h3>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                      <MapPin className="h-4 w-4" />
                      <span>{project.address}, {project.district}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span>{project.totalBlocks} block</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-gray-400" />
                        <span>{project.totalUnits} căn</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{project.handoverDate ? new Date(project.handoverDate).getFullYear() : 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{project.developer}</span>
                      </div>
                    </div>

                    {/* Progress */}
                    {project.status === 'upcoming' && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Tiến độ</span>
                          <span className="font-medium">{project.constructionProgress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${project.constructionProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Price */}
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-500">Giá từ</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatPrice(project.priceFrom)} - {formatPrice(project.priceTo)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <Building className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy dự án</h3>
            <p className="text-gray-500">Thử thay đổi bộ lọc</p>
          </div>
        )}
      </div>
    </div>
  );
}
