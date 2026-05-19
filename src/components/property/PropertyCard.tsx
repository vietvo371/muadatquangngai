'use client';

import Link from 'next/link';
import { Heart, MapPin, Bed, Bath, Square, Eye, User, CheckCircle, Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

const vipConfig: Record<string, { bg: string; text: string; label: string }> = {
  normal: { bg: '', text: '', label: '' },
  vip: { bg: 'bg-yellow-100 text-yellow-700', text: 'text-yellow-700', label: 'VIP' },
  vip_plus: { bg: 'bg-orange-100 text-orange-700', text: 'text-orange-700', label: 'VIP+' },
  diamond: { bg: 'bg-gradient-to-r from-blue-700 to-purple-700', text: 'text-white', label: 'VIP' },
};

export function PropertyCard({ property, className, variant = 'default' }: PropertyCardProps) {
  const vipStyle = vipConfig[property.isVip || 'normal'];
  const location = property.location || property.address || '';
  const typeLabel = property.type === 'sale' ? 'Ban' : property.type === 'rent' ? 'Cho thue' : property.type;

  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex gap-3 p-3">
          {property.thumbnail ? (
            <img
              src={property.thumbnail}
              alt={property.title}
              className="w-20 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-xs">Khong co anh</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2">{property.title}</h3>
            <p className="text-red-600 font-semibold text-sm mt-1">
              {formatPrice(property.price)}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Square className="h-3 w-3" />
              {property.area}m2 {property.bedrooms ? ` - ${property.bedrooms} PN` : ''}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/${property.type === 'sale' ? 'mua-ban' : 'cho-thue'}/${property.slug}`}
      className={`group block bg-white rounded-xl overflow-hidden border hover:shadow-lg hover:border-gray-300 transition-all ${className || ''}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {property.thumbnail ? (
          <img
            src={property.thumbnail}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400 text-sm">Khong co anh</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {vipStyle.label && (
            <Badge className={`${vipStyle.bg} ${vipStyle.text} border-0 shadow-sm`}>
              {property.isVip === 'diamond' ? '★ ' : ''}{vipStyle.label}
            </Badge>
          )}
          <Badge className={`${property.type === 'sale' ? 'bg-primary' : 'bg-green-600'} text-white border-0 shadow-sm`}>
            {typeLabel}
          </Badge>
        </div>

        {/* Verified badge */}
        {(property.is_verified || property.user?.is_verified) && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full">
            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
            <span className="text-xs font-medium text-green-700">Da xac thuc</span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => { e.preventDefault(); }}
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-colors"
          aria-label="Luu tin"
        >
          <Heart className="h-5 w-5 text-gray-500 hover:text-red-500" />
        </button>

        {/* Image Count */}
        {property.images_count !== undefined && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/60 text-white text-xs rounded">
            <Camera className="h-3 w-3" />
            {property.images_count}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {property.title}
        </h3>

        {location && (
          <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </p>
        )}

        <div className="flex items-center gap-4 mb-3 text-sm">
          {property.bedrooms !== undefined && (
            <span className="flex items-center gap-1 text-gray-600">
              <Bed className="h-4 w-4" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms !== undefined && (
            <span className="flex items-center gap-1 text-gray-600">
              <Bath className="h-4 w-4" />
              {property.bathrooms}
            </span>
          )}
          <span className="flex items-center gap-1 text-gray-600">
            <Square className="h-4 w-4" />
            {property.area}m2
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-red-600">
            {formatPrice(property.price, property.priceUnit)}
          </p>
        </div>

        {property.user && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            {property.user.avatar ? (
              <img
                src={property.user.avatar}
                alt=""
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-gray-400" />
            )}
            <span className="text-sm text-gray-500">{property.user.name}</span>
            {property.user.is_verified && (
              <CheckCircle className="h-3.5 w-3.5 text-green-500 ml-1" />
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
