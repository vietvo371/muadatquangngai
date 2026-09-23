'use client';

import Link from 'next/link';
import { Heart, MapPin, Square, Bed, Bath, Layers, Building2 } from 'lucide-react';
import { formatPrice, formatPriceByMode, derivePrices } from '@/lib/formatters';
import { CONFIG } from '@/lib/config';
import { useFavorite } from '@/hooks/useFavorite';
import { ListingMediaBadges } from './ListingMediaBadges';

export interface GridCardProperty {
  id: number | string;
  slug: string;
  title: string;
  price: number;
  priceUnit?: string;
  priceDisplayFormat?: 'short' | 'million' | 'mixed';
  area: number;
  type: string;
  category?: string;
  thumbnail?: string;
  location?: string;
  bedrooms?: number;
  bathrooms?: number;
  hasVideo?: boolean;
  hasTour?: boolean;
  isVip?: string;
  user?: { name: string };
}

/**
 * Thẻ dọc cho lưới 3 cột từ tin #2 trở đi (thiết kế 23/09): ảnh rộng, nhãn media, nút lưu;
 * GIÁ đứng đầu phần chữ, rồi tiêu đề, khu vực, thông số, cuối cùng là người/đơn vị đăng.
 * Tách khỏi `PropertyCard` vì thẻ đó còn dùng ở trang môi giới, doanh nghiệp, tin tương tự
 * với thứ tự khác.
 */
export function ListingGridCard({ property }: { property: GridCardProperty }) {
  const href = `/${property.type === 'sell' ? 'mua-ban' : 'cho-thue'}/${property.slug}`;
  const { total, perM2 } = derivePrices(property.price, property.priceUnit, property.area);
  const priceLabel = formatPriceByMode(
    total ?? property.price,
    property.priceDisplayFormat,
    property.priceUnit === 'per_m2' ? undefined : property.priceUnit
  );
  const { isSaved, toggle } = useFavorite(property.id);
  const promoted = CONFIG.enableVip && !!property.isVip && property.isVip !== 'normal';
  const hasRooms = (property.bedrooms ?? 0) > 0 || (property.bathrooms ?? 0) > 0;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
        {property.thumbnail ? (
          <img
            src={property.thumbnail}
            alt={property.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase text-gray-400">Không có ảnh</div>
        )}
        <ListingMediaBadges hasVideo={property.hasVideo} hasTour={property.hasTour} promoted={promoted} />
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
          className={`absolute right-2.5 top-2.5 rounded-full bg-white/95 p-1.5 shadow-sm transition-colors hover:text-cta ${
            isSaved ? 'text-cta' : 'text-gray-500'
          }`}
          aria-label={isSaved ? 'Bỏ lưu tin' : 'Lưu tin'}
        >
          <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div>
          <p className="text-[19px] font-bold leading-tight text-cta">{priceLabel}</p>
          {perM2 !== null && property.type === 'sell' && (
            <p className="text-[12px] text-gray-400">{formatPrice(perM2)}/m²</p>
          )}
        </div>
        <h3 className="line-clamp-2 text-[14.5px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-primary">
          {property.title}
        </h3>
        {property.location && (
          <p className="flex items-center gap-1.5 text-[12.5px] text-gray-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="line-clamp-1">{property.location}</span>
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-gray-600">
          <span className="flex items-center gap-1.5">
            <Square className="h-3.5 w-3.5 text-gray-400" />
            {property.area}m²
          </span>
          {(property.bedrooms ?? 0) > 0 && (
            <span className="flex items-center gap-1.5">
              <Bed className="h-3.5 w-3.5 text-gray-400" />
              {property.bedrooms} PN
            </span>
          )}
          {(property.bathrooms ?? 0) > 0 && (
            <span className="flex items-center gap-1.5">
              <Bath className="h-3.5 w-3.5 text-gray-400" />
              {property.bathrooms} WC
            </span>
          )}
          {/* Đất nền không có phòng — hiện loại đất thay chỗ trống, như thẻ thứ ba trong thiết kế. */}
          {!hasRooms && property.category && (
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-gray-400" />
              {property.category}
            </span>
          )}
        </div>
        <p className="mt-auto flex items-center gap-1.5 border-t border-gray-100 pt-3 text-[12px] text-gray-500">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span className="line-clamp-1">{property.user?.name || 'Môi giới'}</span>
        </p>
      </div>
    </Link>
  );
}
