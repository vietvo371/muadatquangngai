'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Star, ShieldCheck, Users, Building2 } from 'lucide-react';
import { AgentCard, type Agent } from '@/components/agent/AgentCard';
import { AgencyCard, type AgencyListItem } from '@/components/agent/AgencyCard';

type Tab = 'individual' | 'company';

/**
 * Gộp môi giới cá nhân và công ty vào một trang với 2 tab — khớp bố cục
 * batdongsan.com.vn/nha-moi-gioi (đối chiếu qua trình duyệt thật 21/07/2026). Trước đây tách
 * riêng /moi-gioi (cá nhân) và /doanh-nghiep (công ty) kèm dropdown lọc khu vực + sắp xếp;
 * người dùng phản hồi chỉ cần 2 tab bấm, không cần dropdown. /doanh-nghiep vẫn giữ riêng vì
 * đó là danh bạ B2B rộng hơn (chủ đầu tư, nhà thầu...), không chỉ sàn môi giới.
 */
export default function AgentsDirectoryPage() {
  const [tab, setTab] = useState<Tab>('individual');
  const [searchQuery, setSearchQuery] = useState('');

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agencies, setAgencies] = useState<AgencyListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: 'listings', per_page: '48' });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      if (tab === 'individual') {
        const res = await api.get(`/api/v2/agents?${params.toString()}`);
        setAgents(res.data?.data ?? []);
        setTotal(res.data?.meta?.total ?? 0);
      } else {
        params.set('business_type', 'brokerage');
        const res = await api.get(`/api/v2/agencies?${params.toString()}`);
        setAgencies(res.data?.data ?? []);
        setTotal(res.data?.meta?.total ?? 0);
      }
    } catch {
      setAgents([]);
      setAgencies([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [tab, searchQuery]);

  // Gõ tìm kiếm thì hoãn một nhịp, tránh bắn request mỗi lần nhấn phím.
  useEffect(() => {
    const t = setTimeout(load, searchQuery ? 400 : 0);
    return () => clearTimeout(t);
  }, [load, searchQuery]);

  const avgRating = agents.length
    ? (agents.reduce((sum, a) => sum + (a.rating ?? 0), 0) / agents.length).toFixed(1)
    : '0';
  const verifiedCount =
    tab === 'individual' ? agents.filter((a) => a.verified).length : agencies.filter((a) => a.verified).length;

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
              Danh Bạ Môi Giới
              <br className="sm:hidden" />
              <span className="text-primary sm:ml-2">Quảng Ngãi</span>
            </h1>
            <p className="text-white/80 text-sm sm:text-base font-medium tracking-wide max-w-lg mx-auto leading-relaxed">
              Kết nối với đội ngũ chuyên gia và sàn giao dịch am hiểu thị trường để giao dịch thành công.
            </p>
          </div>

          <div className="w-full max-w-xl bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
              <Input
                placeholder={tab === 'individual' ? 'Tìm kiếm môi giới theo tên...' : 'Tìm kiếm sàn giao dịch theo tên...'}
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
              <p className="text-2xl md:text-3xl font-black text-primary mb-1">{total}</p>
              <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide">
                {tab === 'individual' ? 'Chuyên gia' : 'Sàn giao dịch'}
              </p>
            </div>
            {tab === 'individual' && (
              <div className="text-center px-2">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <p className="text-2xl md:text-3xl font-black text-gray-900">{avgRating}</p>
                  <Star className="h-4 w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400" />
                </div>
                <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide">Đánh giá TB</p>
              </div>
            )}
            <div className="text-center px-2 col-start-3">
              <div className="flex items-center justify-center gap-1 mb-1">
                <p className="text-2xl md:text-3xl font-black text-green-600">{verifiedCount}</p>
                <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-green-600 hidden sm:block" />
              </div>
              <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide">Đã xác thực</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          LISTING
      ══════════════════════════════════ */}
      <section className="py-12 md:py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="w-10 h-1 bg-primary rounded-full mb-4" />
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">Danh bạ Môi giới</h2>

            {/* 2 tab thay cho dropdown khu vực + sắp xếp — bấm là chuyển ngay, không cần
                mở dropdown chọn trước khi thấy kết quả. */}
            <div className="flex gap-1 mt-5 bg-gray-100 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setTab('individual')}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  tab === 'individual' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="h-4 w-4" />
                Cá nhân môi giới
              </button>
              <button
                type="button"
                onClick={() => setTab('company')}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  tab === 'company' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Building2 className="h-4 w-4" />
                Công ty môi giới
              </button>
            </div>

            <p className="text-sm font-medium text-gray-500 mt-4">
              Tìm thấy <span className="font-bold text-gray-900">{total}</span>{' '}
              {tab === 'individual' ? 'chuyên gia' : 'sàn giao dịch'} phù hợp
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : tab === 'individual' ? (
            agents.length === 0 ? (
              <EmptyState onReset={() => setSearchQuery('')} label="môi giới" />
            ) : (
              <div className="space-y-4">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            )
          ) : agencies.length === 0 ? (
            <EmptyState onReset={() => setSearchQuery('')} label="sàn giao dịch" />
          ) : (
            <div className="space-y-4">
              {agencies.map((agency) => (
                <AgencyCard key={agency.id} agency={agency} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyState({ onReset, label }: { onReset: () => void; label: string }) {
  return (
    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm mt-8">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
        <Users className="h-10 w-10 text-gray-300" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy {label}</h3>
      <p className="text-gray-500 font-medium">Thử thay đổi từ khóa tìm kiếm để tìm thấy kết quả phù hợp hơn.</p>
      <Button variant="outline" className="mt-6 font-bold rounded-xl" onClick={onReset}>
        Xóa tìm kiếm
      </Button>
    </div>
  );
}
