'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Building2, MapPin, Phone, ShieldCheck, Users, ChevronRight, Globe } from 'lucide-react';
import { AGENCY_BUSINESS_TYPES, agencyBusinessTypeLabel } from '@/lib/agency-business-types';

const SORT_LABELS: Record<string, string> = {
  listings: 'Tin đang đăng nhiều nhất',
  agents: 'Nhiều môi giới nhất',
  newest: 'Mới tham gia nhất',
};

interface Agency {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  business_type: string;
  verified: boolean;
  agent_count: number;
  total_listings: number;
  district: { id: number; name: string } | null;
}

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('listings');
  const [districts, setDistricts] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    api
      .get('/api/v2/locations/provinces')
      .then((res) => {
        const province = res.data?.data?.[0];
        if (!province) return;
        return api
          .get(`/api/v2/locations/districts/${province.id}`)
          .then((d) => setDistricts(d.data?.data ?? []));
      })
      .catch(() => setDistricts([]));
  }, []);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ sort: sortBy, per_page: '48' });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (districtFilter !== 'all') params.set('district_id', districtFilter);
      if (typeFilter !== 'all') params.set('business_type', typeFilter);
      const res = await api.get(`/api/v2/agencies?${params.toString()}`);
      setAgencies(res.data?.data ?? []);
      setTotal(res.data?.meta?.total ?? 0);
    } catch {
      setAgencies([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, districtFilter, typeFilter, sortBy]);

  // Gõ tìm kiếm thì hoãn một nhịp, tránh bắn request mỗi lần nhấn phím.
  useEffect(() => {
    const t = setTimeout(load, searchQuery ? 400 : 0);
    return () => clearTimeout(t);
  }, [load, searchQuery]);

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="w-10 h-1 bg-primary rounded-full mb-4" />
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
            Danh bạ doanh nghiệp bất động sản
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl">
            Các sàn giao dịch và công ty bất động sản đang hoạt động tại Quảng Ngãi.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên doanh nghiệp..."
                className="pl-9 h-11 bg-gray-50 border-gray-200 rounded-xl"
              />
            </div>

            <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
              <SelectTrigger className="w-full sm:w-56 h-11 bg-white border-gray-200 rounded-xl font-medium">
                {/* SelectValue của Base UI mặc định hiện thẳng giá trị thô ("developer") thay
                    vì tra nhãn — phải tự truyền hàm render để hiện đúng tiếng Việt. */}
                <SelectValue placeholder="Lĩnh vực">
                  {(v: string) => (v === 'all' || !v ? 'Tất cả lĩnh vực' : agencyBusinessTypeLabel(v))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
                {AGENCY_BUSINESS_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={districtFilter} onValueChange={(v) => v && setDistrictFilter(v)}>
              <SelectTrigger className="w-full sm:w-52 h-11 bg-white border-gray-200 rounded-xl font-medium">
                <SelectValue placeholder="Khu vực">
                  {(v: string) => (v === 'all' || !v ? 'Tất cả khu vực' : districts.find((d) => String(d.id) === v)?.name ?? v)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">Tất cả khu vực</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
              <SelectTrigger className="w-full sm:w-52 h-11 bg-white border-gray-200 rounded-xl font-medium">
                <SelectValue placeholder="Sắp xếp">
                  {(v: string) => SORT_LABELS[v] ?? v}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="listings">Tin đang đăng nhiều nhất</SelectItem>
                <SelectItem value="agents">Nhiều môi giới nhất</SelectItem>
                <SelectItem value="newest">Mới tham gia nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-sm font-medium text-gray-500 mb-5">
          Tìm thấy <span className="font-bold text-gray-900">{total}</span> doanh nghiệp
        </p>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : agencies.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-900">Chưa có doanh nghiệp nào phù hợp</p>
            <p className="text-sm text-gray-500 mt-1">Thử bỏ bớt bộ lọc hoặc tìm với từ khoá khác.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {agencies.map((a) => (
              <Card key={a.id} className="rounded-2xl border-gray-100 hover:shadow-md transition-shadow bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-14 w-14 rounded-xl bg-primary-light/40 flex items-center justify-center shrink-0 overflow-hidden">
                      {a.logo ? (
                        <Image src={a.logo} alt={a.name} width={56} height={56} className="object-cover h-full w-full" />
                      ) : (
                        <Building2 className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/doanh-nghiep/${a.slug}`} className="font-bold text-gray-900 hover:text-primary line-clamp-2">
                        {a.name}
                      </Link>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <Badge variant="outline" className="text-[11px] font-medium text-gray-500 border-gray-200">
                          {agencyBusinessTypeLabel(a.business_type)}
                        </Badge>
                        {a.verified && (
                          <Badge className="bg-primary-light/60 text-primary border-0 text-[11px] font-semibold gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Đã xác minh
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[13px] text-gray-500 mb-4">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{a.address || a.district?.name || 'Quảng Ngãi'}</span>
                    </p>
                    {a.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {a.phone}
                      </p>
                    )}
                    {a.website && (
                      <p className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{a.website}</span>
                      </p>
                    )}
                  </div>

                  {/* Chỉ sàn giao dịch mới có môi giới/tin đăng gắn kèm — chủ đầu tư, nhà
                      thầu... hiện khối này sẽ luôn là 0/0, không có ý nghĩa gì để xem. */}
                  {a.business_type === 'brokerage' && (
                    <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center mb-3">
                      <div>
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tin đang đăng</p>
                        <p className="font-extrabold text-primary text-lg leading-none mt-0.5">{a.total_listings}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Môi giới</p>
                        <p className="font-bold text-gray-900 text-lg leading-none mt-0.5 flex items-center justify-end gap-1">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          {a.agent_count}
                        </p>
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/doanh-nghiep/${a.slug}`}
                    className="text-[13px] font-bold text-primary hover:underline flex items-center gap-0.5"
                  >
                    Xem hồ sơ
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
