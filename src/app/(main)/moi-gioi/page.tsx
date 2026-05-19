'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ShieldCheck,
  Users,
  CheckCircle,
} from 'lucide-react';
import { AgentCard } from '@/components/agent/AgentCard';

const agents = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    avatar: null,
    phone: '0901234567',
    rating: 4.8,
    review_count: 156,
    total_listings: 45,
    total_sold: 120,
    experience_years: 10,
    areas: ['TP Quảng Ngãi'],
    company: 'Sàn GD BĐS Quảng Ngãi',
    verified: true,
  },
  {
    id: 2,
    name: 'Trần Thị B',
    avatar: null,
    phone: '0912345678',
    rating: 4.9,
    review_count: 203,
    total_listings: 68,
    total_sold: 180,
    experience_years: 7,
    areas: ['TP Quảng Ngãi', 'Lý Sơn'],
    company: 'Hải Phát Land',
    verified: true,
  },
  {
    id: 3,
    name: 'Lê Văn C',
    avatar: null,
    phone: '0923456789',
    rating: 4.6,
    review_count: 89,
    total_listings: 32,
    total_sold: 65,
    experience_years: 4,
    areas: ['Lý Sơn', 'Bình Sơn'],
    company: 'Lý Sơn Real',
    verified: false,
  },
  {
    id: 4,
    name: 'Phạm Thị D',
    avatar: null,
    phone: '0934567890',
    rating: 4.7,
    review_count: 134,
    total_listings: 55,
    total_sold: 98,
    experience_years: 8,
    areas: ['TP Quảng Ngãi'],
    company: 'Đất Xanh Miền Trung',
    verified: true,
  },
  {
    id: 5,
    name: 'Hoàng Văn E',
    avatar: null,
    phone: '0945678901',
    rating: 4.5,
    review_count: 67,
    total_listings: 25,
    total_sold: 40,
    experience_years: 3,
    areas: ['Mộ Đức', 'Nghĩa Hành'],
    company: 'Tự do',
    verified: false,
  },
  {
    id: 6,
    name: 'Đinh Thị F',
    avatar: null,
    phone: '0956789012',
    rating: 5.0,
    review_count: 312,
    total_listings: 110,
    total_sold: 250,
    experience_years: 12,
    areas: ['Bình Sơn', 'Sơn Tịnh'],
    company: 'VSIP Quảng Ngãi',
    verified: true,
  }
];

export default function AgentsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  const filteredAgents = agents
    .filter((agent) => {
      if (searchQuery && !agent.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (provinceFilter !== 'all' && !agent.areas.includes(provinceFilter)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'listings') return b.total_listings - a.total_listings;
      if (sortBy === 'reviews') return b.review_count - a.review_count;
      return 0;
    });

  const avgRating = (agents.reduce((sum, a) => sum + a.rating, 0) / agents.length).toFixed(1);

  return (
    <div className="flex flex-col bg-white">
      {/* ══════════════════════════════════
          HERO
      ══════════════════════════════════ */}
      <section className="relative h-[320px] md:h-[400px] z-10 w-full overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/image_data/banner_hero.jpg"
            alt="Môi giới bất động sản Quảng Ngãi"
            fill
            className="object-cover object-center scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/60 to-gray-900/30" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white drop-shadow-lg tracking-tight">
              Môi Giới Bất Động Sản
              <br className="sm:hidden" />
              <span className="text-primary sm:ml-2">Quảng Ngãi</span>
            </h1>
            <p className="text-white/80 text-sm sm:text-base font-medium tracking-wide max-w-lg mx-auto leading-relaxed">
              Kết nối với đội ngũ chuyên gia tư vấn hàng đầu, am hiểu thị trường để giao dịch thành công.
            </p>
          </div>

          {/* Search */}
          <div className="w-full max-w-xl bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
              <Input
                placeholder="Tìm kiếm môi giới theo tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white/20 border-transparent text-white placeholder:text-white/60 rounded-xl h-12 focus-visible:ring-1 focus-visible:ring-white/50 text-[15px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          STATS BAR
      ══════════════════════════════════ */}
      <section className="bg-white border-b border-gray-100 shadow-sm relative z-20">
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="text-center px-2">
              <p className="text-2xl md:text-3xl font-black text-primary mb-1">{agents.length}</p>
              <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide">Chuyên gia</p>
            </div>
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1 mb-1">
                <p className="text-2xl md:text-3xl font-black text-gray-900">{avgRating}</p>
                <Star className="h-4 w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide">Đánh giá TB</p>
            </div>
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1 mb-1">
                <p className="text-2xl md:text-3xl font-black text-green-600">{agents.filter(a => a.verified).length}</p>
                <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-green-600 hidden sm:block" />
              </div>
              <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide">Đã xác thực</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          AGENTS LISTING
      ══════════════════════════════════ */}
      <section className="py-12 md:py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          {/* Header + Filters */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div>
              <div className="w-10 h-1 bg-primary rounded-full mb-4" />
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                Danh sách Môi giới
              </h2>
              <p className="text-sm font-medium text-gray-500 mt-2">
                Đã tìm thấy <span className="font-bold text-gray-900">{filteredAgents.length}</span> chuyên gia phù hợp với nhu cầu của bạn
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Select value={provinceFilter} onValueChange={(v) => v && setProvinceFilter(v)}>
                <SelectTrigger className="w-full sm:w-48 h-11 bg-white border-gray-200 rounded-xl font-medium">
                  <SelectValue placeholder="Khu vực hoạt động" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả khu vực</SelectItem>
                  <SelectItem value="TP Quảng Ngãi">TP Quảng Ngãi</SelectItem>
                  <SelectItem value="Lý Sơn">Lý Sơn</SelectItem>
                  <SelectItem value="Mộ Đức">Mộ Đức</SelectItem>
                  <SelectItem value="Bình Sơn">Bình Sơn</SelectItem>
                  <SelectItem value="Sơn Tịnh">Sơn Tịnh</SelectItem>
                  <SelectItem value="Nghĩa Hành">Nghĩa Hành</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
                <SelectTrigger className="w-full sm:w-48 h-11 bg-white border-gray-200 rounded-xl font-medium">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                  <SelectItem value="listings">Số tin đăng nhiều nhất</SelectItem>
                  <SelectItem value="reviews">Lượt đánh giá nhiều nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Agents Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>

          {/* Empty State */}
          {filteredAgents.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm mt-8">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Users className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy môi giới</h3>
              <p className="text-gray-500 font-medium">Thử thay đổi từ khóa hoặc bộ lọc khu vực để tìm thấy kết quả phù hợp hơn.</p>
              <Button 
                variant="outline" 
                className="mt-6 font-bold rounded-xl"
                onClick={() => { setSearchQuery(''); setProvinceFilter('all'); }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
