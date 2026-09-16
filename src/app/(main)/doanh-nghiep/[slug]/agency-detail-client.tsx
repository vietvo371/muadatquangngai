'use client';

import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PropertyCard } from '@/components/property/PropertyCard';
import {
  Building2, MapPin, Phone, Mail, Globe, ShieldCheck, Users, Home, ChevronLeft, Star,
} from 'lucide-react';
import { agencyBusinessTypeLabel } from '@/lib/agency-business-types';

interface AgencyProfile {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  business_type: string;
  verified: boolean;
  district: { id: number; name: string } | null;
  province: { id: number; name: string } | null;
  agent_count: number;
  total_listings: number;
  agents: Array<{
    id: number;
    name: string;
    avatar: string | null;
    phone: string | null;
    rating: number;
    total_listings: number;
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: any[];
}

export default function AgencyProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [agency, setAgency] = useState<AgencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'listings' | 'agents'>('listings');

  useEffect(() => {
    if (!slug) return;
    api
      .get(`/api/v2/agencies/${slug}`)
      .then((res) => setAgency(res.data?.data ?? null))
      .catch(() => setAgency(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Đang tải hồ sơ doanh nghiệp...</p>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg font-bold text-gray-900">Không tìm thấy doanh nghiệp này</p>
        <Link href="/doanh-nghiep" className="text-primary font-semibold hover:underline">
          Quay lại danh bạ doanh nghiệp
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/doanh-nghiep" className="text-sm text-gray-500 hover:text-primary flex items-center gap-1 mb-5">
            <ChevronLeft className="h-4 w-4" />
            Danh bạ doanh nghiệp
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="h-20 w-20 rounded-2xl bg-primary-light/40 flex items-center justify-center shrink-0 overflow-hidden">
              {agency.logo ? (
                <Image src={agency.logo} alt={agency.name} width={80} height={80} className="object-cover h-full w-full" />
              ) : (
                <Building2 className="h-9 w-9 text-primary" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-gray-900">{agency.name}</h1>
                <Badge variant="outline" className="text-[11px] font-medium text-gray-500 border-gray-200">
                  {agencyBusinessTypeLabel(agency.business_type)}
                </Badge>
                {agency.verified && (
                  <Badge className="bg-primary-light/60 text-primary border-0 text-[11px] font-semibold gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Đã xác minh
                  </Badge>
                )}
              </div>

              <div className="mt-3 grid sm:grid-cols-2 gap-y-1.5 gap-x-6 text-sm text-gray-600 max-w-2xl">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="truncate">
                    {agency.address || agency.district?.name || agency.province?.name || 'Quảng Ngãi'}
                  </span>
                </p>
                {agency.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                    <a href={`tel:${agency.phone}`} className="hover:text-primary">{agency.phone}</a>
                  </p>
                )}
                {agency.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="truncate">{agency.email}</span>
                  </p>
                )}
                {agency.website && (
                  <p className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400 shrink-0" />
                    <a
                      href={agency.website.startsWith('http') ? agency.website : `https://${agency.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate hover:text-primary"
                    >
                      {agency.website}
                    </a>
                  </p>
                )}
              </div>
            </div>

            {agency.business_type === 'brokerage' && (
              <div className="flex gap-3 shrink-0">
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-center min-w-[92px]">
                  <p className="text-2xl font-black text-primary leading-none">{agency.total_listings}</p>
                  <p className="text-[11px] font-bold text-gray-500 uppercase mt-1">Tin đăng</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-center min-w-[92px]">
                  <p className="text-2xl font-black text-gray-900 leading-none">{agency.agent_count}</p>
                  <p className="text-[11px] font-bold text-gray-500 uppercase mt-1">Môi giới</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {agency.description && (
          <Card className="rounded-2xl border-gray-100 mb-6">
            <CardContent className="p-5">
              <h2 className="font-bold text-gray-900 mb-2">Giới thiệu</h2>
              <p className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">{agency.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Chỉ sàn giao dịch mới có môi giới/tin đăng gắn kèm — chủ đầu tư, nhà thầu, đơn
            vị thiết kế... trong danh bạ chỉ cần hồ sơ giới thiệu, không cần 2 tab này. */}
        {agency.business_type === 'brokerage' && (
          <>
            <div className="flex gap-1 border-b border-gray-200 mb-5">
              {([
                { id: 'listings', label: `Tin đang đăng (${agency.properties.length})`, Icon: Home },
                { id: 'agents', label: `Môi giới (${agency.agent_count})`, Icon: Users },
              ] as const).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                    tab === id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {tab === 'listings' &&
          (agency.properties.length === 0 ? (
            <p className="text-center text-gray-500 py-16 bg-white rounded-2xl border border-gray-100">
              Doanh nghiệp này chưa có tin đăng nào đang hiển thị.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {agency.properties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={{
                    id: p.id,
                    title: p.title,
                    slug: p.slug,
                    price: p.price,
                    area: p.area,
                    thumbnail: p.thumbnail,
                    address: p.address,
                    type: p.type,
                    bedrooms: 'bedrooms' in p ? p.bedrooms : undefined,
                  }}
                />
              ))}
            </div>
          ))}

        {tab === 'agents' &&
          (agency.agents.length === 0 ? (
            <p className="text-center text-gray-500 py-16 bg-white rounded-2xl border border-gray-100">
              Chưa có môi giới nào thuộc doanh nghiệp này.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {agency.agents.map((a) => (
                <Link key={a.id} href={`/moi-gioi/${a.id}`}>
                  <Card className="rounded-2xl border-gray-100 hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={a.avatar || undefined} className="object-cover" />
                        <AvatarFallback className="bg-primary-light text-primary font-bold">
                          {a.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{a.name}</p>
                        <p className="text-[13px] text-gray-500 flex items-center gap-2">
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                            {a.rating}
                          </span>
                          <span className="text-gray-300">|</span>
                          {a.total_listings} tin
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ))}
          </>
        )}
      </div>
    </div>
  );
}
