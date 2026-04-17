'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SearchBar } from '@/components/search/SearchBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Building, Calendar, Users, Home, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import { SectionHeading } from '@/components/home/SectionHeading';

const projects = [
  {
    id: '1',
    slug: 'de-palace-river-nam-song-tra-khuc',
    name: 'De Palace River - Nam Sông Trà Khúc',
    developer: 'Công ty CP Địa Ốc Quảng Ngãi',
    thumbnail: '/images/image_data/nha-pho-de-palace-river.jpg',
    status: 'selling',
    type: 'apartment',
    province: 'Quảng Ngãi',
    address: 'Đầu cầu Thạch Bích, TP Quảng Ngãi',
    priceFrom: 4500000000,
    priceTo: 8500000000,
    totalUnits: 256,
    totalBlocks: 2,
    totalFloors: 18,
    constructionProgress: 75,
    handoverDate: '2025-12-31',
    description: 'Khu căn hộ cao cấp ven sông Trà Khúc, tầm view đẹp, tiện ích đầy đủ.',
  },
  {
    id: '2',
    slug: 'starlight-bac-huynh-thuc-khang',
    name: 'Starlight - Bắc Huỳnh Thúc Kháng',
    developer: 'Công ty CP Đầu tư Starlight',
    thumbnail: '/images/image_data/Starlight---suc-hut-den-tu-vi-tri-dac-dia-nhat-trung-tam-Quang-Ngai-suc-hut-3-1733900371-424-width1000height563.jpg',
    status: 'upcoming',
    type: 'apartment',
    province: 'Quảng Ngãi',
    address: 'Huỳnh Thúc Kháng, Ngọc Bảo Viên, TP Quảng Ngãi',
    priceFrom: 3200000000,
    priceTo: 6000000000,
    totalUnits: 400,
    totalBlocks: 3,
    totalFloors: 22,
    constructionProgress: 25,
    handoverDate: '2026-06-30',
    description: 'Dự án căn hộ cao cấp tại vị trí đắc địa bậc nhất trung tâm Quảng Ngãi.',
  },
  {
    id: '3',
    slug: 'green-park-quang-ngai',
    name: 'Green Park Quảng Ngãi',
    developer: 'Vingroup',
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
    status: 'selling',
    type: 'apartment',
    province: 'Quảng Ngãi',
    address: 'Đường Trần Kỳ, Tịnh Long, TP Quảng Ngãi',
    priceFrom: 1800000000,
    priceTo: 3500000000,
    totalUnits: 300,
    totalBlocks: 2,
    totalFloors: 20,
    constructionProgress: 60,
    handoverDate: '2026-03-31',
    description: 'Khu căn hộ xanh thông minh tại Quảng Ngãi.',
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
    address: 'Đường Quang Trung, Trần Phú, TP Quảng Ngãi',
    priceFrom: 4500000000,
    priceTo: 7000000000,
    totalUnits: 120,
    totalBlocks: 4,
    totalFloors: 5,
    constructionProgress: 100,
    handoverDate: '2024-06-30',
    description: 'Shophouse liền kề ga metro tương lai.',
  },
];

const statusConfig = {
  upcoming: { label: 'Sắp mở bán', bg: 'bg-amber-100', text: 'text-amber-700' },
  selling: { label: 'Đang bán', bg: 'bg-green-100', text: 'text-green-700' },
  completed: { label: 'Đã bàn giao', bg: 'bg-gray-100', text: 'text-gray-700' },
  paused: { label: 'Tạm dừng', bg: 'bg-yellow-100', text: 'text-yellow-700' },
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

  const filteredProjects = projects.filter((p) => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col bg-white">

      {/* ══════════════════════════════════
          HERO SECTION
      ══════════════════════════════════ */}
      <section className="relative h-[360px] md:h-[420px] z-10">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/images/image_data/banner_hero.jpg"
            alt="Dự án bất động sản Quảng Ngãi"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/5" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 gap-5">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white drop-shadow-xl leading-tight mb-3 tracking-tight">
              Dự án bất động sản
              <br />
              <span className="text-red-400">Quảng Ngãi</span>
            </h1>
            <p className="text-white/75 text-sm sm:text-base font-medium tracking-widest uppercase">
              Những dự án uy tín tại thành phố
            </p>
          </div>

          <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl relative z-50">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          PROJECTS LISTING
      ══════════════════════════════════ */}
      <section className="py-14 md:py-20 px-4 bg-gray-50 relative z-0">
        <div className="max-w-6xl mx-auto">

          {/* Header + Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="w-8 h-1 bg-primary rounded-full mb-3" />
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
                Tất cả dự án
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                <span className="font-semibold text-gray-600">{filteredProjects.length}</span> dự án tại Quảng Ngãi
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
                <SelectTrigger className="w-44">
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

              <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="price_asc">Giá tăng dần</SelectItem>
                  <SelectItem value="price_desc">Giá giảm dần</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="flex flex-col gap-6">
            {filteredProjects.map((project) => {
              const status = statusConfig[project.status as keyof typeof statusConfig];
              return (
                <Link key={project.id} href={`/du-an/${project.slug}`}>
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow group">
                    <div className="flex flex-col md:flex-row">
                      {/* Thumbnail */}
                      <div className="relative md:w-80 h-52 md:h-auto shrink-0">
                        <Image
                          src={project.thumbnail}
                          alt={project.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 320px"
                        />
                        <div className={`absolute top-4 left-4 ${status.bg} ${status.text} text-xs font-semibold px-3 py-1 rounded-full`}>
                          {status.label}
                        </div>
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
                          {typeConfig[project.type as keyof typeof typeConfig]}
                        </div>
                      </div>

                      {/* Content */}
                      <CardContent className="flex-1 p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors leading-snug">
                              {project.name}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                            <span>{project.address}</span>
                          </div>

                          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-5">
                            {project.description}
                          </p>

                          {/* Stats grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                            <div className="flex items-center gap-2 text-sm">
                              <Building className="h-4 w-4 text-gray-400 shrink-0" />
                              <span className="text-gray-600">{project.totalBlocks} block</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Home className="h-4 w-4 text-gray-400 shrink-0" />
                              <span className="text-gray-600">{project.totalUnits} căn</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                              <span className="text-gray-600">
                                {new Date(project.handoverDate).getFullYear()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4 text-gray-400 shrink-0" />
                              <span className="text-gray-600">{project.developer}</span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          {project.status === 'upcoming' && (
                            <div className="mb-5">
                              <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-gray-500">Tiến độ xây dựng</span>
                                <span className="font-semibold text-gray-700">{project.constructionProgress}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${project.constructionProgress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Giá từ</p>
                            <p className="text-xl font-bold text-cta">
                              {formatPrice(project.priceFrom)}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" className="group/btn">
                            Xem chi tiết
                            <ArrowRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredProjects.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl">
              <Building className="h-16 w-16 mx-auto text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy dự án</h3>
              <p className="text-gray-500">Thử thay đổi bộ lọc để xem thêm dự án</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
