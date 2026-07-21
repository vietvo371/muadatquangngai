import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Phone, MapPin, ShieldCheck, Users, MessageSquare } from 'lucide-react';

/** Khớp phản hồi GET /api/v2/agencies. */
export interface AgencyListItem {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  address: string | null;
  phone: string | null;
  business_type: string;
  verified: boolean;
  agent_count: number;
  total_listings: number;
  district?: { id: number; name: string } | null;
  /** Hồ sơ demo (dữ liệu tự sinh) — ẩn nút gọi vì SĐT tự sinh có thể trùng người thật ngoài đời. */
  is_demo?: boolean;
  coverage_areas?: Array<{ label: string; href: string; count: number }>;
}

interface AgencyCardProps {
  agency: AgencyListItem;
}

/**
 * Dòng ngang cùng bố cục với AgentCard — hai loại thẻ trong cùng danh bạ /moi-gioi (tab
 * "Công ty môi giới" / "Cá nhân môi giới") cần xếp thẳng hàng như nhau khi chuyển tab.
 */
export function AgencyCard({ agency }: AgencyCardProps) {
  const agencyUrl = `/doanh-nghiep/${agency.slug}`;
  const coverageAreas = agency.coverage_areas ?? [];

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 rounded-2xl border-gray-100 bg-white">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex sm:flex-col sm:w-[160px] shrink-0 gap-4 sm:gap-3">
            <Link href={agencyUrl} className="shrink-0">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-primary-light/40 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                {agency.logo ? (
                  <Image src={agency.logo} alt={agency.name} width={80} height={80} className="object-cover h-full w-full" />
                ) : (
                  <Building2 className="h-8 w-8 text-primary" />
                )}
              </div>
            </Link>

            <div className="min-w-0 flex-1 sm:flex-none">
              <Link href={agencyUrl}>
                <h3 className="font-bold text-gray-900 text-[15px] hover:text-primary transition-colors leading-tight line-clamp-2">
                  {agency.name}
                </h3>
              </Link>

              <p className="flex items-center gap-1.5 text-[13px] text-gray-500 mt-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{agency.address || agency.district?.name || 'Quảng Ngãi'}</span>
              </p>

              {agency.phone && !agency.is_demo && (
                <p className="flex items-center gap-1.5 text-[13px] text-gray-500 mt-1">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <a href={`tel:${agency.phone}`} className="hover:text-primary">{agency.phone}</a>
                </p>
              )}

              <div className="flex gap-2 mt-3">
                {agency.phone && !agency.is_demo ? (
                  <a href={`tel:${agency.phone}`} className="flex-1">
                    <Button size="sm" className="w-full h-8 text-[12px] font-bold bg-cta hover:bg-cta-dark">
                      <Phone className="h-3.5 w-3.5 mr-1" />
                      Gọi ngay
                    </Button>
                  </a>
                ) : null}
                <Link href={agencyUrl} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full h-8 text-[12px] font-bold border-primary text-primary hover:bg-primary-light">
                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                    Xem hồ sơ
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-5">
            <div className="flex items-center gap-2 flex-wrap text-[13px]">
              <div className="flex items-center gap-1 font-bold text-primary">
                {agency.total_listings} tin đang đăng
              </div>
              <div className="flex items-center gap-1 font-bold text-gray-900">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                {agency.agent_count} môi giới
              </div>
              {agency.verified && (
                <Badge className="bg-primary-light/60 text-primary border-0 text-[11px] font-semibold gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Đã xác minh
                </Badge>
              )}
            </div>

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
