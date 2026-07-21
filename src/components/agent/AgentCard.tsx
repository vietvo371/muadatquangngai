import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Phone, MapPin, Building, ChevronRight, ShieldCheck } from 'lucide-react';

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
}

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const agentUrl = agent.slug ? `/moi-gioi/${agent.slug}` : `/moi-gioi/${agent.id}`;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300 rounded-2xl border-gray-100 bg-white group">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-start gap-4 mb-4">
            <Link href={agentUrl} className="shrink-0 relative">
              <Avatar className="h-[60px] w-[60px] border-2 border-white shadow-sm">
                <AvatarImage src={agent.avatar || undefined} className="object-cover" />
                <AvatarFallback className="bg-primary-light text-primary font-bold text-lg">
                  {agent.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
                <Badge className="bg-yellow-500 hover:bg-yellow-500 text-white border-0 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  <Star className="h-3 w-3 fill-white" />
                </Badge>
              </div>
            </Link>
            
            <div className="flex-1 min-w-0">
              <Link href={agentUrl}>
                <h3 className="font-bold text-gray-900 text-[16px] truncate group-hover:text-primary transition-colors leading-tight">
                  {agent.name}
                </h3>
              </Link>
              
              <div className="flex items-center gap-2 mt-1 mb-1 text-[13px]">
                <div className="flex items-center gap-1 font-bold text-gray-900">
                  <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                  {agent.rating || 5.0} <span className="font-medium text-gray-400">({agent.review_count || 0})</span>
                </div>
                {agent.verified && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                    {/* Chỉ hiện khi hồ sơ đã được duyệt trong bảng verifications — không gắn
                        nhãn "chuyên nghiệp" cho mọi người như trước. */}
                    <div className="flex items-center gap-1 font-medium text-primary">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Đã xác minh
                    </div>
                  </>
                )}
              </div>
              
              {agent.company && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 truncate">
                  <Building className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{agent.company}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Tin đang bán</p>
                <p className="font-extrabold text-primary text-lg leading-none">{agent.total_listings || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Khu vực</p>
                <p className="font-bold text-gray-900 text-sm leading-none flex items-center justify-end gap-1">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  {agent.district?.name ?? 'Quảng Ngãi'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-gray-100 divide-x divide-gray-100">
          {agent.phone ? (
            <a href={`tel:${agent.phone}`} className="flex w-full">
              <Button variant="ghost" className="h-12 w-full rounded-none text-primary hover:text-primary hover:bg-primary-light/10 font-bold text-[13px]">
                <Phone className="h-4 w-4 mr-1.5" />
                Gọi ngay
              </Button>
            </a>
          ) : (
            <Button variant="ghost" disabled className="h-12 rounded-none font-bold text-[13px] text-gray-400">
              <Phone className="h-4 w-4 mr-1.5" />
              Chưa có SĐT
            </Button>
          )}
          <Link href={agentUrl} className="flex w-full">
            <Button variant="ghost" className="h-12 w-full rounded-none text-gray-600 hover:text-gray-900 font-bold bg-white text-[13px]">
              Xem hồ sơ
              <ChevronRight className="h-4 w-4 ml-0.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
