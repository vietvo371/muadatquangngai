'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
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
} from 'lucide-react';
import { AgentCard, type Agent } from '@/components/agent/AgentCard';


export default function AgentsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [sortBy, setSortBy] = useState('listings');

  const [agents, setAgents] = useState<Agent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [districts, setDistricts] = useState<Array<{ id: number; name: string }>>([]);

  // Khu vực nạp từ DB thay vì liệt kê tay — danh sách 96 xã/phường đổi thì trang tự theo.
  useEffect(() => {
    api.get('/api/v2/locations/provinces')
      .then((res) => {
        const province = res.data?.data?.[0];
        if (!province) return;
        return api.get(`/api/v2/locations/districts/${province.id}`)
          .then((d) => setDistricts(d.data?.data ?? []));
      })
      .catch(() => setDistricts([]));
  }, []);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: sortBy, per_page: '48' });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (districtFilter !== 'all') params.set('district_id', districtFilter);
      const res = await api.get(`/api/v2/agents?${params.toString()}`);
      setAgents(res.data?.data ?? []);
      setTotal(res.data?.meta?.total ?? 0);
    } catch {
      setAgents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, districtFilter, sortBy]);

  // Gõ tìm kiếm thì hoãn một nhịp, tránh bắn request mỗi lần nhấn phím.
  useEffect(() => {
    const t = setTimeout(loadAgents, searchQuery ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadAgents, searchQuery]);

  const filteredAgents = agents;
  const avgRating = agents.length
    ? (agents.reduce((sum, a) => sum + (a.rating ?? 0), 0) / agents.length).toFixed(1)
    : '0';

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
                Đã tìm thấy <span className="font-bold text-gray-900">{total}</span> chuyên gia phù hợp với nhu cầu của bạn
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Select value={districtFilter} onValueChange={(v) => v && setDistrictFilter(v)}>
                <SelectTrigger className="w-full sm:w-48 h-11 bg-white border-gray-200 rounded-xl font-medium">
                  <SelectValue placeholder="Khu vực hoạt động" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Tất cả khu vực</SelectItem>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
                <SelectTrigger className="w-full sm:w-48 h-11 bg-white border-gray-200 rounded-xl font-medium">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="listings">Số tin đang đăng nhiều nhất</SelectItem>
                  <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                  <SelectItem value="newest">Tham gia gần đây nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Danh sách dạng dòng — mỗi môi giới một dòng đủ rộng để hiện được thẻ khu vực
              hoạt động bên cạnh thông tin liên hệ, thay vì lưới thẻ nhỏ trước đây. */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredAgents.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm mt-8">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Users className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy môi giới</h3>
              <p className="text-gray-500 font-medium">Thử thay đổi từ khóa hoặc bộ lọc khu vực để tìm thấy kết quả phù hợp hơn.</p>
              <Button 
                variant="outline" 
                className="mt-6 font-bold rounded-xl"
                onClick={() => { setSearchQuery(''); setDistrictFilter('all'); }}
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
