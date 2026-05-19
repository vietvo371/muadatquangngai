'use client';

import Link from 'next/link';
import { Heart, MapPin, Bed, Bath, Square, User, CheckCircle, Camera, Eye } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';

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
    isVip?: string;
    is_verified?: boolean;
    views?: number;
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

const vipConfig: Record<string, { container: string; badge: string; label: string }> = {
  normal: { container: 'border-gray-100', badge: '', label: '' },
  vip: { container: 'border-[1.5px] border-dashed border-[#e03131]', badge: 'bg-[#e03131] text-white', label: 'VIP' },
  vip_plus: { container: 'border-[1.5px] border-dashed border-[#e03131]', badge: 'bg-[#e03131] text-white', label: 'VIP+' },
  diamond: { container: 'border-[1.5px] border-dashed border-[#e03131]', badge: 'bg-[#e03131] text-white', label: 'DIAMOND' },
};

export function PropertyCard({ property, className, variant = 'default' }: PropertyCardProps) {
  const vipStyle = vipConfig[property.isVip || 'normal'];
  const location = property.location || property.address || '';
  const typeLabel = property.type === 'sale' ? 'Bán' : property.type === 'rent' ? 'Cho thuê' : property.type;

  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex gap-3 p-3">
          {property.thumbnail ? (
            <img
              src={property.thumbnail}
              alt={property.title}
              className="w-24 h-20 rounded-lg object-cover"
            />
          ) : (
            <div className="w-24 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-[11px] font-medium uppercase">No image</span>
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <h3 className="font-semibold text-[14px] line-clamp-2 text-gray-900 leading-tight">{property.title}</h3>
            <div>
              <p className="text-[#e03131] font-bold text-[15px] mt-1">
                {formatPrice(property.price, property.priceUnit)}
              </p>
              <p className="text-[12px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                <Square className="h-3 w-3" />
                {property.area}m² {property.bedrooms ? ` • ${property.bedrooms} PN` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/${property.type === 'sale' ? 'mua-ban' : 'cho-thue'}/${property.slug}`}
      className={`group block bg-white rounded-2xl overflow-hidden border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${vipStyle.container} ${className || ''}`}
    >
      {/* Image Wrapper */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        {property.thumbnail ? (
          <img
            src={property.thumbnail}
            alt={property.title}
            className="w-full h-full object-cover transition-all duration-[350ms] group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 text-[12px] font-medium uppercase tracking-wider">Không có ảnh</span>
          </div>
        )}

        {/* Badges Top Left */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-col items-start">
          {vipStyle.label && (
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase shadow-sm ${vipStyle.badge}`}>
              {vipStyle.label}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-primary text-white shadow-sm">
            {typeLabel}
          </span>
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

        {/* Bottom Right Badges (Views / Image Count) */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          {property.views !== undefined && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium rounded-full">
              <Eye className="h-3 w-3" />
              {property.views}
            </div>
          )}
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
        <h3 className="text-[15px] font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-[1.4]">
          {property.title}
        </h3>

        {location && (
          <p className="text-[13px] text-gray-500 flex items-center gap-1.5 mb-3">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            <span className="line-clamp-1">{location}</span>
          </p>
        )}

        <div className="flex items-center gap-3 mb-3 text-[12px] text-gray-500 font-medium">
          {property.bedrooms !== undefined && (
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5 text-gray-400" />
              {property.bedrooms} PN
            </span>
          )}
          {property.bathrooms !== undefined && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-gray-400" />
              {property.bathrooms} PT
            </span>
          )}
          <span className="flex items-center gap-1">
            <Square className="h-3.5 w-3.5 text-gray-400" />
            {property.area} m²
          </span>
        </div>

        <div className="flex items-end justify-between mt-1">
          <p className="text-[18px] font-bold text-[#e03131] leading-none">
            {formatPrice(property.price, property.priceUnit)}
          </p>
          {property.created_at && (
            <span className="text-[12px] text-gray-400 font-medium">{property.created_at}</span>
          )}
        </div>

        {property.user && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
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
