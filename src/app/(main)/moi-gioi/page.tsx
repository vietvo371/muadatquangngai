'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Star,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  ArrowRight,
  Users,
  CheckCircle,
} from 'lucide-react';
import { SectionHeading } from '@/components/home/SectionHeading';

const agents = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    avatar: null,
    phone: '0901234567',
    address: 'TP Quảng Ngãi',
    rating: 4.8,
    total_reviews: 156,
    total_listings: 45,
    total_sold: 120,
    bio: 'Chuyên gia bất động sản với 10 năm kinh nghiệm tại Quảng Ngãi. Chuyên môn: căn hộ, nhà phố, đất nền.',
    verified: true,
    listings: [
      {
        title: 'Căn hộ cao cấp 2PN view biển',
        slug: 'can-ho-cao-cap-2pn-view-bien',
        price: 3500000000,
        area: 75,
        thumbnail: '/images/image_data/Haus-Coastal.jpg',
      },
      {
        title: 'Nhà phố 3 tầng mặt tiền',
        slug: 'nha-pho-3-tang-mat-tien',
        price: 4500000000,
        area: 120,
        thumbnail: '/images/image_data/nha-pho-de-palace-river.jpg',
      },
    ],
  },
  {
    id: '2',
    name: 'Trần Thị B',
    avatar: null,
    phone: '0912345678',
    address: 'TP Quảng Ngãi',
    rating: 4.9,
    total_reviews: 203,
    total_listings: 68,
    total_sold: 180,
    bio: 'Môi giới chuyên nghiệp, tận tâm với khách hàng. Chuyên các dự án ven biển Quảng Ngãi.',
    verified: true,
    listings: [
      {
        title: 'Biệt thự view biển Mỹ Khê',
        slug: 'biet-thu-view-bien',
        price: 8500000000,
        area: 250,
        thumbnail: '/images/image_data/Starlight---suc-hut-den-tu-vi-tri-dac-dia-nhat-trung-tam-Quang-Ngai-suc-hut-3-1733900371-424-width1000height563.jpg',
      },
    ],
  },
  {
    id: '3',
    name: 'Lê Văn C',
    avatar: null,
    phone: '0923456789',
    address: 'Lý Sơn, Quảng Ngãi',
    rating: 4.6,
    total_reviews: 89,
    total_listings: 32,
    total_sold: 65,
    bio: 'Chuyên đất nền và căn hộ giá rẻ khu vực Quảng Ngãi. Luôn đặt lợi ích khách hàng lên hàng đầu.',
    verified: false,
    listings: [
      {
        title: 'Đất nền ven biển Lý Sơn 200m2',
        slug: 'dat-nen-ven-bien-ly-son',
        price: 2800000000,
        area: 200,
        thumbnail: '/images/image_data/shutterstock2065827521lyson-1701400873758.jpg',
      },
    ],
  },
  {
    id: '4',
    name: 'Phạm Thị D',
    avatar: null,
    phone: '0934567890',
    address: 'TP Quảng Ngãi',
    rating: 4.7,
    total_reviews: 134,
    total_listings: 55,
    total_sold: 98,
    bio: '10 năm kinh nghiệm trong lĩnh vực BĐS, chuyên về phân khúc cao cấp và nghỉ dưỡng.',
    verified: true,
    listings: [
      {
        title: 'Căn hộ penthouse view sông Trà Khúc',
        slug: 'can-ho-penthouse',
        price: 6200000000,
        area: 180,
        thumbnail: '/images/image_data/du-lich-binh-son-quang-ngai-phan-van-travel-1.webp',
      },
    ],
  },
];

export default function AgentsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  const filteredAgents = agents
    .filter((agent) => {
      if (searchQuery && !agent.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (provinceFilter !== 'all' && agent.address !== provinceFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'listings') return b.total_listings - a.total_listings;
      if (sortBy === 'reviews') return b.total_reviews - a.total_reviews;
      return 0;
    });

  const avgRating = (agents.reduce((sum, a) => sum + a.rating, 0) / agents.length).toFixed(1);

  return (
    <div className="flex flex-col bg-white">

      {/* ══════════════════════════════════
          HERO
      ══════════════════════════════════ */}
      <section className="relative h-[320px] md:h-[380px] z-10">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/images/image_data/banner_hero.jpg"
            alt="Môi giới bất động sản Quảng Ngãi"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/5" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 gap-5">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white drop-shadow-xl leading-tight mb-3 tracking-tight">
              Môi giới bất động sản
              <br />
              <span className="text-red-400">Quảng Ngãi</span>
            </h1>
            <p className="text-white/75 text-sm sm:text-base font-medium tracking-widest uppercase">
              Đội ngũ tư vấn chuyên nghiệp & uy tín
            </p>
          </div>

          {/* Search */}
          <div className="w-full max-w-xl bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-2xl relative z-50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
              <Input
                placeholder="Tìm kiếm môi giới..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl h-11"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          STATS BAR
      ══════════════════════════════════ */}
      <section className="bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-8 md:gap-16 text-center">
            <div>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{agents.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Môi giới</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{avgRating}</p>
              <p className="text-xs text-gray-400 mt-0.5">Đánh giá TB</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{agents.filter(a => a.verified).length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Đã xác thực</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          AGENTS LISTING
      ══════════════════════════════════ */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">

          {/* Header + Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="w-8 h-1 bg-primary rounded-full mb-3" />
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
                Tất cả môi giới
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                <span className="font-semibold text-gray-600">{filteredAgents.length}</span> môi giới được tìm thấy
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Select value={provinceFilter} onValueChange={(v) => v && setProvinceFilter(v)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Khu vực" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả khu vực</SelectItem>
                  <SelectItem value="TP Quảng Ngãi">TP Quảng Ngãi</SelectItem>
                  <SelectItem value="Lý Sơn">Lý Sơn</SelectItem>
                  <SelectItem value="Mộ Đức">Mộ Đức</SelectItem>
                  <SelectItem value="Bình Sơn">Bình Sơn</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                  <SelectItem value="listings">Nhiều tin nhất</SelectItem>
                  <SelectItem value="reviews">Nhiều đánh giá nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Agents Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {filteredAgents.map((agent) => (
              <Link key={agent.id} href={`/moi-gioi/${agent.id}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full group">
                  <CardContent className="p-6">
                    <div className="flex gap-4 mb-4">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <Avatar className="h-16 w-16 text-xl">
                          <AvatarFallback className="bg-primary-light text-primary font-bold">
                            {agent.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {agent.verified && (
                          <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5">
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">
                            {agent.name}
                          </h3>
                          {agent.verified && (
                            <Badge variant="secondary" className="text-xs bg-primary-light text-primary border-0">
                              Đã xác thực
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1.5">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span>{agent.address}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
                          <span className="font-semibold text-gray-900">{agent.rating}</span>
                          <span className="text-gray-400 text-sm">({agent.total_reviews} đánh giá)</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-5">
                      {agent.bio}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="text-center bg-gray-50 rounded-xl py-3">
                        <p className="text-lg font-bold text-gray-900">{agent.total_listings}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Tin đăng</p>
                      </div>
                      <div className="text-center bg-gray-50 rounded-xl py-3">
                        <p className="text-lg font-bold text-gray-900">{agent.total_sold}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Đã giao dịch</p>
                      </div>
                      <div className="text-center bg-gray-50 rounded-xl py-3">
                        <p className="text-lg font-bold text-gray-900">{agent.total_reviews}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Đánh giá</p>
                      </div>
                    </div>

                    {/* Listings preview */}
                    {agent.listings.length > 0 && (
                      <div className="mb-5 pt-4 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                          Tin nổi bật
                        </p>
                        <div className="flex gap-3">
                          {agent.listings.slice(0, 2).map((listing) => (
                            <div key={listing.slug} className="flex items-center gap-2.5 bg-gray-50 rounded-lg p-2 flex-1 min-w-0">
                              <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0">
                                <Image
                                  src={listing.thumbnail}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-gray-700 truncate">
                                  {listing.price >= 1000000000
                                    ? `${(listing.price / 1000000000).toFixed(1)} tỷ`
                                    : `${(listing.price / 1000000).toFixed(0)} triệu`}
                                </p>
                                <p className="text-xs text-gray-400">{listing.area}m²</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <Button variant="outline" size="sm" className="flex-1 border-primary text-primary hover:bg-primary-light">
                        <Phone className="h-3.5 w-3.5 mr-1.5" />
                        Gọi ngay
                      </Button>
                      <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">
                        Xem hồ sơ
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Empty State */}
          {filteredAgents.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl">
              <Users className="h-16 w-16 mx-auto text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy môi giới</h3>
              <p className="text-gray-500">Thử thay đổi từ khóa tìm kiếm</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
