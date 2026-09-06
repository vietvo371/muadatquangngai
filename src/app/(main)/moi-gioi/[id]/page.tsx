'use client';

import { useState, use, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PropertyCard } from '@/components/property/PropertyCard';
import { ReviewCard } from '@/components/property/ReviewCard';
import { PillTabs } from '@/components/ui/pill-tabs';
import {
  Star,
  MapPin,
  Phone,
  Calendar,
  ShieldCheck,
  Home,
  MessageSquare,
  ChevronLeft,
  Share2,
  Building,
  TrendingUp,
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';

/** Khớp phản hồi GET /api/v2/agents/[id]. */
interface AgentProfile {
  id: number;
  name: string;
  avatar: string | null;
  phone: string | null;
  bio: string | null;
  address: string | null;
  rating: number;
  review_count: number;
  total_listings: number;
  company: string | null;
  district: { id: number; name: string } | null;
  province: { id: number; name: string } | null;
  verified: boolean;
  license_number: string | null;
  joined_at: string | null;
  reviews: Array<{
    id: number;
    rating: number;
    comment: string | null;
    created_at: string | null;
    reviewer: { id: number; name: string; avatar: string | null };
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: any[];
}

export default function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const id = unwrappedParams?.id;
  const [activeTab, setActiveTab] = useState('listings');

  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  /** Điện thoại có hộp chia sẻ sẵn; máy tính thì chép link vào bộ nhớ tạm. */
  const shareProfile = async () => {
    const url = window.location.href;
    const title = agent ? `Môi giới ${agent.name}` : 'Hồ sơ môi giới';
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Đã chép liên kết hồ sơ.');
    } catch (error) {
      // Người dùng bấm huỷ hộp chia sẻ — không phải lỗi, đừng làm phiền họ.
      if ((error as { name?: string })?.name === 'AbortError') return;
      toast.error('Không chia sẻ được. Bạn có thể chép link trên thanh địa chỉ.');
    }
  };

  useEffect(() => {
    if (!id) return;
    // Không gọi setLoading(true) ngay trong thân effect — state khởi tạo đã là true, và gọi
    // setState đồng bộ ở đây làm React render lồng thêm một vòng không cần thiết.
    api.get(`/api/v2/agents/${id}`)
      .then((res) => setAgent(res.data?.data ?? null))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Đang tải hồ sơ môi giới...</p>
      </div>
    );
  }

  if (notFound || !agent) {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg font-bold text-gray-900">Không tìm thấy nhà môi giới này</p>
        <Link href="/moi-gioi" className="text-primary font-semibold hover:underline">
          Quay lại danh bạ môi giới
        </Link>
      </div>
    );
  }

  const listings = agent.properties;
  const reviews = agent.reviews;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* ══════════════════════════════════
          COVER & HEADER INFO
      ══════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 relative">
        {/* Abstract Cover Background */}
        <div className="absolute top-0 left-0 right-0 h-40 md:h-52 bg-gradient-to-r from-primary to-primary-dark overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute top-10 right-20 w-80 h-80 bg-white rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-4 pb-8 relative z-10">
          {/* Breadcrumb - Over Cover */}
          <div className="flex items-center gap-2 text-sm text-white/80 mb-10 md:mb-16">
            <Link href="/moi-gioi" className="hover:text-white flex items-center gap-1 font-medium transition-colors">
              <ChevronLeft className="h-4 w-4" />
              Danh sách môi giới
            </Link>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end mt-4 md:mt-12 bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-50 relative -mt-16 md:-mt-10">
            {/* Avatar */}
            <div className="flex-shrink-0 relative -mt-16 md:-mt-24 self-center md:self-start">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-8 border-white shadow-lg bg-white">
                <AvatarImage src={agent.avatar || undefined} className="object-cover" />
                <AvatarFallback className="text-5xl font-bold bg-primary-light text-primary">
                  {agent.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {agent.verified && (
                <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-2 border-4 border-white shadow-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{agent.name}</h1>
                    {agent.verified && (
                      <Badge className="bg-green-100 hover:bg-green-100 text-green-700 border-0 text-xs px-2 py-0.5">
                        Đã xác thực
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-3 text-sm text-gray-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Building className="h-4 w-4 text-gray-400" />
                      {agent.company}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {agent.district?.name ?? agent.province?.name ?? 'Quảng Ngãi'}
                    </span>
                  </div>
                </div>

                {/* Rating Badge */}
                <div className="inline-flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                  <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
                  <div className="text-left">
                    <p className="text-lg font-black text-gray-900 leading-none">{agent.rating} <span className="text-sm font-medium text-gray-500">/ 5</span></p>
                    <p className="text-xs font-bold text-gray-500 uppercase">{agent.review_count} đánh giá</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                {/* Ba nút này trước đây đều KHÔNG có onClick — khách bấm vào số điện thoại
                    môi giới cũng không có gì xảy ra. Dự án chưa có endpoint tạo hội thoại nên
                    "Gửi tin nhắn" đi qua Zalo, giống cách trang chi tiết tin đang làm. */}
                {agent.phone ? (
                  <>
                    <a
                      href={`tel:${agent.phone}`}
                      className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-bold px-6 h-12 rounded-xl shadow-md gap-2 text-[15px] transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      {agent.phone}
                    </a>
                    <a
                      href={`https://zalo.me/${agent.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center font-bold px-6 h-12 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 gap-2 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Gửi tin nhắn
                    </a>
                  </>
                ) : (
                  <div className="inline-flex items-center justify-center font-bold px-6 h-12 rounded-xl border border-gray-200 text-gray-400 gap-2">
                    <Phone className="h-4 w-4" />
                    Chưa cung cấp số điện thoại
                  </div>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={shareProfile}
                  aria-label="Chia sẻ hồ sơ môi giới"
                  className="h-12 w-12 rounded-xl border-gray-200 text-gray-500 hover:bg-gray-50 shrink-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar - Agent Details */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* Stats Card */}
            <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Thống kê
                </h3>
              </div>
              {/* Chỉ hiện con số có nguồn trong DB. Trước đây khối này có "Đã bán/thuê 120",
                  "Tỷ lệ phản hồi 98%", "Kinh nghiệm 10 năm" — hệ thống không theo dõi bất kỳ
                  chỉ số nào trong đó, toàn bộ là số bịa. */}
              <CardContent className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
                    <p className="text-3xl font-black text-primary mb-1">{agent.total_listings}</p>
                    <p className="text-xs font-bold text-gray-500 uppercase">Tin đang đăng</p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
                    <p className="text-3xl font-black text-gray-900 mb-1">{agent.review_count}</p>
                    <p className="text-xs font-bold text-gray-500 uppercase">Lượt đánh giá</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About Card */}
            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <div className="p-4 border-b border-gray-50">
                <h3 className="font-bold text-gray-900">Giới thiệu</h3>
              </div>
              <CardContent className="p-5">
                <p className="text-[15px] text-gray-600 leading-relaxed mb-6">
                  {agent.bio}
                </p>

                <Separator className="my-5" />

                <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Thông tin liên hệ</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-[15px]">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-gray-500" />
                    </div>
                    <span className="font-medium text-gray-900">{agent.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-gray-500" />
                    </div>
                    <span className="font-medium text-gray-900">{agent.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-gray-500" />
                    </div>
                    <span className="font-medium text-gray-500">Thành viên từ {agent.joined_at ? formatDate(agent.joined_at) : 'chưa rõ'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-8">
            <PillTabs 
              tabs={[
                { id: 'listings', label: `Tin đang bán (${listings.length})`, icon: <Home className="h-4 w-4" /> },
                { id: 'reviews', label: `Đánh giá (${reviews.length})`, icon: <Star className="h-4 w-4" /> },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div className="mt-8">
              {/* Listings Tab */}
              {activeTab === 'listings' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="grid sm:grid-cols-2 gap-6">
                    {listings.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={{
                          id: property.id,
                          title: property.title,
                          slug: property.slug,
                          price: property.price,
                          area: property.area,
                          thumbnail: property.thumbnail,
                          address: property.address,
                          type: property.type,
                          bedrooms: 'bedrooms' in property ? property.bedrooms : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
                  {/* Rating Summary inside Reviews Tab */}
                  <Card className="rounded-2xl border-gray-100 bg-amber-50/50 mb-6">
                    <CardContent className="p-6 flex flex-col md:flex-row items-center gap-8">
                      <div className="text-center">
                        <p className="text-5xl font-black text-gray-900 mb-2">{agent.rating}</p>
                        <div className="flex items-center justify-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-5 w-5 ${i < Math.floor(agent.rating) ? 'fill-amber-500 text-amber-500' : 'text-amber-200 fill-amber-200'}`} />
                          ))}
                        </div>
                        <p className="text-sm font-bold text-gray-500 uppercase">{agent.review_count} đánh giá</p>
                      </div>
                      
                      <div className="flex-1 w-full space-y-2">
                        {[5, 4, 3, 2, 1].map(stars => {
                          const percentage = stars === 5 ? 85 : stars === 4 ? 10 : stars === 3 ? 5 : 0;
                          return (
                            <div key={stars} className="flex items-center gap-3">
                              <span className="text-sm font-bold text-gray-600 w-12 flex items-center justify-end">{stars} <Star className="h-3 w-3 ml-1 fill-gray-400 text-gray-400" /></span>
                              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }}></div>
                              </div>
                              <span className="text-sm text-gray-400 w-8">{percentage}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      // API trả reviewer/comment, ReviewCard nhận user/content — chuyển ở đây
                      // thay vì đổi ReviewCard vì component đó còn dùng ở trang chi tiết BĐS.
                      review={{
                        id: review.id,
                        user: { name: review.reviewer.name, avatar: review.reviewer.avatar },
                        rating: review.rating,
                        content: review.comment ?? '',
                        created_at: review.created_at ?? '',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
