import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Phone, MapPin, Building, ShieldCheck, MessageSquare } from 'lucide-react';

/**
 * Khớp phản hồi GET /api/v2/agents. Nhiều trường cho phép rỗng vì DB không bắt buộc —
 * môi giới mới đăng ký có thể chưa điền công ty, chưa có đánh giá nào.
 */
export interface Agent {
  id: number;
  name: string;
  avatar: string | null;
  phone: string | null;
  bio?: string | null;
  rating?: number;
  review_count?: number;
  total_listings?: number;
  company?: string | null;
  district?: { id: number; name: string } | null;
  verified?: boolean;
  slug?: string;
  /** Hồ sơ demo (dữ liệu tự sinh) — ẩn nút gọi vì SĐT tự sinh có thể trùng người thật ngoài đời. */
  is_demo?: boolean;
  /** Thẻ "khu vực hoạt động" tính từ tin đăng thật của môi giới — xem GET /api/v2/agents. */
  coverage_areas?: Array<{ label: string; href: string; count: number }>;
}

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const agentUrl = agent.slug ? `/moi-gioi/${agent.slug}` : `/moi-gioi/${agent.id}`;
  const coverageAreas = agent.coverage_areas ?? [];

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 rounded-2xl border-gray-100 bg-white">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Cột trái: ảnh + tên + liên hệ — giữ cố định để danh sách xếp thẳng hàng dễ quét mắt */}
          <div className="flex sm:flex-col sm:w-[160px] shrink-0 gap-4 sm:gap-3">
            <Link href={agentUrl} className="shrink-0 relative">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-white shadow-sm">
                <AvatarImage src={agent.avatar || undefined} className="object-cover" />
                <AvatarFallback className="bg-primary-light text-primary font-bold text-xl">
                  {agent.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="min-w-0 flex-1 sm:flex-none">
              <Link href={agentUrl}>
                <h3 className="font-bold text-gray-900 text-[15px] hover:text-primary transition-colors leading-tight line-clamp-2">
                  {agent.name}
                </h3>
              </Link>

              <p className="flex items-center gap-1.5 text-[13px] text-gray-500 mt-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{agent.district?.name ?? 'Quảng Ngãi'}</span>
              </p>

              {agent.phone && !agent.is_demo && (
                <p className="flex items-center gap-1.5 text-[13px] text-gray-500 mt-1">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <a href={`tel:${agent.phone}`} className="hover:text-primary">{agent.phone}</a>
                </p>
              )}

              <div className="flex gap-2 mt-3">
                {agent.phone && !agent.is_demo ? (
                  <a href={`tel:${agent.phone}`} className="flex-1">
                    <Button size="sm" className="w-full h-8 text-[12px] font-bold bg-cta hover:bg-cta-dark">
                      <Phone className="h-3.5 w-3.5 mr-1" />
                      Gọi ngay
                    </Button>
                  </a>
                ) : null}
                <Link href={agentUrl} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full h-8 text-[12px] font-bold border-primary text-primary hover:bg-primary-light">
                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                    Xem hồ sơ
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Cột phải: đánh giá/công ty + khu vực hoạt động */}
          <div className="min-w-0 flex-1 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-5">
            <div className="flex items-center gap-2 flex-wrap text-[13px]">
              <div className="flex items-center gap-1 font-bold text-gray-900">
                <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                {agent.rating || 5.0} <span className="font-medium text-gray-400">({agent.review_count || 0} đánh giá)</span>
              </div>
              <div className="flex items-center gap-1 font-bold text-primary">
                {agent.total_listings || 0} tin đang đăng
              </div>
              {agent.verified && (
                <Badge className="bg-primary-light/60 text-primary border-0 text-[11px] font-semibold gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Đã xác minh
                </Badge>
              )}
            </div>

            {agent.company && (
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 mt-2">
                <Building className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{agent.company}</span>
              </div>
            )}

            {coverageAreas.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Khu vực hoạt động
                </p>
                <ul className="space-y-1">
                  {coverageAreas.map((area) => (
                    <li key={area.href}>
                      <Link
                        href={area.href}
                        className="text-[13px] text-gray-600 hover:text-primary hover:underline flex items-start gap-1.5"
                      >
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-cta shrink-0" />
                        {area.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
