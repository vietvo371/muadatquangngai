'use client';

import Link from 'next/link';
import { Heart, MapPin, Bed, Bath, Square, User, CheckCircle, Camera, Ruler } from 'lucide-react';
import { formatPrice, timeAgo, derivePrices } from '@/lib/formatters';
import { CONFIG } from '@/lib/config';

interface PropertyCardProps {
  property: {
    id: number | string;
    slug: string;
    title: string;
    price: number;
    priceUnit?: string;
    area: number;
    type: string;
    thumbnail?: string;
    location?: string;
    address?: string;
    bedrooms?: number;
    bathrooms?: number;
    /** Mặt tiền (m) — khách yêu cầu hiện lên thẻ (feedback "diện tích đất phía trước"). */
    facade?: number | null;
    isVip?: string;
    is_verified?: boolean;
    created_at?: string;
    user?: {
      name: string;
      avatar?: string | null;
      is_verified?: boolean;
    };
    images_count?: number;
  };
  className?: string;
  variant?: 'default' | 'compact';
}

const vipConfig: Record<string, { border: string; badge: string; label: string; dot: string }> = {
  normal:   { border: '',                                               badge: '',                          label: '',        dot: '' },
  vip:      { border: 'border-[1.5px] border-dashed border-[#e03131]', badge: 'bg-[#e03131] text-white',   label: 'VIP',     dot: 'bg-white/60' },
  vip_plus: { border: 'border-[1.5px] border-dashed border-[#e03131]', badge: 'bg-[#e03131] text-white',   label: 'VIP+',    dot: 'bg-white/60' },
  diamond:  { border: 'border-[1.5px] border-dashed border-[#e03131]', badge: 'bg-[#e03131] text-white',   label: 'DIAMOND', dot: 'bg-white/60' },
};

export function PropertyCard({ property, className, variant = 'default' }: PropertyCardProps) {
  const isVipValue = property.isVip || (property as any).is_vip || 'normal';
  const isVipActive = CONFIG.enableVip && isVipValue && isVipValue !== 'normal';
  const vip = isVipActive ? vipConfig[isVipValue] : vipConfig.normal;
  const location = property.location || property.address || '';
  const typeLabel = property.type === 'sell' ? 'Bán' : property.type === 'rent' ? 'Cho thuê' : property.type;
  const href = `/${property.type === 'sell' ? 'mua-ban' : 'cho-thue'}/${property.slug}`;
  // eslint-disable-next-line react-hooks/purity
  const isNew = property.created_at && (Date.now() - new Date(property.created_at).getTime() < 86400000);

  // Không tự chia price cho area: khi price_unit là 'per_m2' thì price đã LÀ giá mỗi m², chia
  // thêm lần nữa ra con số lệch đúng một lần diện tích.
  const { total: totalPrice, perM2: pricePerM2 } = derivePrices(
    property.price,
    property.priceUnit,
    property.area
  );
  const priceLabel = formatPrice(
    totalPrice ?? property.price,
    property.priceUnit === 'per_m2' ? undefined : property.priceUnit
  );

  if (variant === 'compact') {
    return (
      <Link href={href}>
        <article
          className={`group flex flex-col sm:flex-row overflow-hidden rounded-2xl bg-white transition-all hover:-translate-y-0.5 hover:shadow-xl ${
            vip.border ? vip.border : 'border border-gray-100 hover:border-primary/20'
          } ${className || ''}`}
        >
          {/* Image */}
          <div className="relative h-52 shrink-0 overflow-hidden bg-gray-100 sm:h-auto sm:w-64 md:w-72">
            {property.thumbnail ? (
              <img
                src={property.thumbnail}
                alt={property.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-xs uppercase text-gray-400">Không có ảnh</span>
              </div>
            )}

            {/* Badges top-left */}
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              {vip.label && (
                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${vip.badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${vip.dot}`} />
                  {vip.label}
                </span>
              )}
              <span className="flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-semibold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                {typeLabel}
              </span>
            </div>

            {/* Heart */}
            <button
              onClick={(e) => { e.preventDefault(); }}
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-gray-400 shadow-sm transition-colors hover:bg-white hover:text-[#e03131]"
              aria-label="Lưu tin"
            >
              <Heart className="h-4 w-4" />
            </button>

            {/* Image count */}
            {property.images_count !== undefined && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
                <Camera className="h-3 w-3" />
                {property.images_count}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-between gap-3 p-4 md:p-5">
            <div>
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-base font-bold leading-snug text-gray-900 transition-colors group-hover:text-primary">
                  {property.title}
                </h3>
                {isNew && (
                  <span className="mt-0.5 shrink-0 rounded-md bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-600">
                    Mới
                  </span>
                )}
              </div>
              {location && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="line-clamp-1">{location}</span>
                </div>
              )}
              {(property.is_verified || property.user?.is_verified) && (
                <div className="mt-1.5 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-[#10b981]" />
                  <span className="text-xs font-medium text-[#10b981]">Đã xác thực</span>
                </div>
              )}
            </div>

            {/* Specs row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-gray-50 pt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Square className="h-3.5 w-3.5 text-gray-400" />
                {property.area} m²
              </span>
              {property.bedrooms !== undefined && property.bedrooms > 0 && (
                <span className="flex items-center gap-1">
                  <Bed className="h-3.5 w-3.5 text-gray-400" />
                  {property.bedrooms} phòng ngủ
                </span>
              )}
              {property.bathrooms !== undefined && property.bathrooms > 0 && (
                <span className="flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5 text-gray-400" />
                  {property.bathrooms} phòng tắm
                </span>
              )}
              {property.facade != null && Number(property.facade) > 0 && (
                <span className="flex items-center gap-1">
                  <Ruler className="h-3.5 w-3.5 text-gray-400" />
                  Mặt tiền {property.facade} m
                </span>
              )}
            </div>

            {/* Price + Agent */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-gray-400">Mức giá</p>
                <p className="text-base font-bold text-[#e03131]">
                  {priceLabel}
                </p>
                {pricePerM2 !== null && property.type === 'sell' && (
                  <p className="text-xs text-gray-400">
                    {formatPrice(pricePerM2)}/m²
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {property.user?.avatar ? (
                  <img
                    src={property.user.avatar}
                    alt={property.user.name}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                )}
                <div className="text-right">
                  <p className="line-clamp-1 text-xs font-medium text-gray-700">{property.user?.name}</p>
                  {property.created_at && (
                    <p className="text-[11px] text-gray-400">{timeAgo(property.created_at)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`group block bg-white rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${vip.border || 'border-gray-100'} ${className || ''}`}
    >
      {/* Image Wrapper */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        {property.thumbnail ? (
          <img
            src={property.thumbnail}
            alt={property.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 text-[12px] font-medium uppercase tracking-wider">Không có ảnh</span>
          </div>
        )}

        {/* Badges Top Left */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-col items-start">
          {vip.label && (
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase shadow-sm ${vip.badge}`}>
              {vip.label}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-primary text-white shadow-sm">
              {typeLabel}
            </span>
            {isNew && (
              <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                Mới
              </span>
            )}
          </div>
        </div>

        {/* Verified Badge */}
        {(property.is_verified || property.user?.is_verified) && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full shadow-sm">
            <CheckCircle className="h-3.5 w-3.5 text-[#10b981]" />
            <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-wide">Đã xác thực</span>
          </div>
        )}

        {/* Heart Button */}
        <button
          onClick={(e) => { e.preventDefault(); }}
          className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors text-gray-400 hover:text-[#e03131]"
          aria-label="Lưu tin"
        >
          <Heart className="h-4 w-4" />
        </button>

        {/* Bottom Right Badges — đã bỏ lượt xem theo yêu cầu khách (tin mới toàn 0 lượt). */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          {property.images_count !== undefined && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium rounded-full">
              <Camera className="h-3 w-3" />
              {property.images_count}
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        <h3 className="text-[15px] font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-[1.4] text-balance">
          {property.title}
        </h3>

        {location && (
          <p className="text-[13px] text-gray-500 flex items-center gap-1.5 mb-3">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            <span className="line-clamp-1">{location}</span>
          </p>
        )}

        <div className="flex items-center gap-3 mb-3 text-[12px] text-gray-500 font-medium">
          {property.bedrooms !== undefined && property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary transition-colors duration-300" />
              {property.bedrooms} PN
            </span>
          )}
          {property.bathrooms !== undefined && property.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary transition-colors duration-300" />
              {property.bathrooms} PT
            </span>
          )}
          <span className="flex items-center gap-1">
            <Square className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary transition-colors duration-300" />
            {property.area} m²
          </span>
          {property.facade != null && Number(property.facade) > 0 && (
            <span className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary transition-colors duration-300" />
              MT {property.facade} m
            </span>
          )}
        </div>

        <div className="flex items-end justify-between mt-1">
          <div>
            <p className="text-[18px] font-bold text-[#e03131] leading-none">
              {priceLabel}
            </p>
            {pricePerM2 !== null && property.type === 'sell' && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                · {formatPrice(pricePerM2)}/m²
              </p>
            )}
          </div>
          {property.created_at && (
            <span className="text-[12px] text-gray-400 font-medium">{timeAgo(property.created_at)}</span>
          )}
        </div>

        {property.user && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 group-hover:border-primary/10 transition-colors duration-300">
            {property.user.avatar ? (
              <img
                src={property.user.avatar}
                alt={property.user.name}
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-gray-400" />
              </div>
            )}
            <span className="text-[13px] font-medium text-gray-600 line-clamp-1">{property.user.name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
