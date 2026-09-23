'use client';

import Link from 'next/link';
import {
  Heart, MapPin, Bed, Bath, Square,
  Mail, Layers, Sofa, Compass, Building2, Car, FileText, User,
} from 'lucide-react';
import { formatPrice, formatPriceByMode, derivePrices } from '@/lib/formatters';
import { CONFIG } from '@/lib/config';
import { useFavorite } from '@/hooks/useFavorite';
import { legalText, furnitureText, directionText } from '@/lib/property-form-config';
import { featureIcon, shortFeatureName } from '@/lib/feature-icons';
import { ListingMediaBadges } from '@/components/listing/ListingMediaBadges';
import { CardImageSlider } from '@/components/listing/CardImageSlider';

export interface FeaturedCardProperty {
  id: number | string;
  slug: string;
  title: string;
  price: number;
  priceUnit?: string;
  priceDisplayFormat?: 'short' | 'million' | 'mixed';
  area: number;
  type: string;
  /** Loại nhà đất (tên danh mục). */
  category?: string;
  thumbnail?: string;
  /** Toàn bộ ảnh của tin, đã sắp theo sort_order. */
  images?: string[];
  /** Tiện ích người đăng đã chọn (bảng features) — API trả khi gọi kèm `with=features`. */
  features?: Array<{ id: number | string; name: string; icon?: string | null }>;
  hasVideo?: boolean;
  hasTour?: boolean;
  location?: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  facade?: number | null;
  floors?: number | null;
  legal?: string | null;
  furniture?: string | null;
  direction?: string | null;
  parking?: boolean;
  description?: string | null;
  isVip?: string;
  user?: { name: string; avatar?: string | null };
}

type AmenityIcon = typeof Sofa;
const MAX_AMENITIES = 6;

/** Mô tả từ trình soạn thảo có thể chứa HTML — chỉ lấy chữ để hiện tóm tắt. */
function plainText(html?: string | null): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Tiện ích hiện trên thẻ: ưu tiên tiện ích THẬT người đăng đã tick (Hồ bơi, Thang máy...) như
 * thiết kế. Tin chưa tick tiện ích nào thì mới suy ra từ các cột sẵn có (pháp lý, nội thất,
 * hướng, chỗ đậu xe) để thẻ không trống trơn.
 */
function buildAmenities(p: FeaturedCardProperty): Array<{ icon: AmenityIcon; label: string }> {
  if (p.features && p.features.length > 0) {
    return p.features.slice(0, MAX_AMENITIES).map((f) => ({ icon: featureIcon(f.icon), label: shortFeatureName(f.name) }));
  }
  const out: Array<{ icon: AmenityIcon; label: string }> = [];
  if (p.legal) out.push({ icon: FileText, label: legalText(p.legal) });
  if (p.furniture && p.furniture !== 'none' && p.furniture !== 'khac') out.push({ icon: Sofa, label: furnitureText(p.furniture) });
  if (p.direction && p.direction !== 'khong_xac_dinh') out.push({ icon: Compass, label: `Hướng ${directionText(p.direction)}` });
  if (p.parking) out.push({ icon: Car, label: 'Chỗ đậu xe' });
  return out.slice(0, MAX_AMENITIES);
}

/**
 * Thẻ tin NỔI BẬT ở hàng đầu trang danh sách (thiết kế 23/09): ảnh 50% bên trái, nội dung 50%
 * bên phải trên nền xám nhạt. Các tin từ #2 trở đi dùng `ListingGridCard` trong lưới 3 cột.
 */
export function FeaturedPropertyCard({
  property,
  className = '',
}: {
  property: FeaturedCardProperty;
  className?: string;
}) {
  const href = `/${property.type === 'sell' ? 'mua-ban' : 'cho-thue'}/${property.slug}`;
  const promoted = CONFIG.enableVip && !!property.isVip && property.isVip !== 'normal';
  const location = property.location || property.address || '';

  const images = (property.images && property.images.length > 0
    ? property.images
    : property.thumbnail
      ? [property.thumbnail]
      : []
  ).filter(Boolean);

  const { total: totalPrice, perM2: pricePerM2 } = derivePrices(property.price, property.priceUnit, property.area);
  const priceLabel = formatPriceByMode(
    totalPrice ?? property.price,
    property.priceDisplayFormat,
    property.priceUnit === 'per_m2' ? undefined : property.priceUnit
  );
  const { isSaved, toggle: toggleFavorite } = useFavorite(property.id);
  const amenities = buildAmenities(property);
  const summary = plainText(property.description);

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow duration-300 hover:shadow-xl lg:flex-row ${className}`}
    >
      {/* ── Ảnh: đúng một nửa bề ngang trên desktop ── */}
      <div className="relative w-full shrink-0 bg-gray-100 lg:w-1/2">
        <CardImageSlider images={images} alt={property.title} withThumbs frameClassName="aspect-[4/3] lg:aspect-auto lg:min-h-[220px]" />
        <ListingMediaBadges hasVideo={property.hasVideo} hasTour={property.hasTour} promoted={promoted} />
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(); }}
          className={`absolute right-2.5 top-2.5 z-10 rounded-full bg-white/95 p-1.5 shadow-sm transition-colors hover:text-cta ${
            isSaved ? 'text-cta' : 'text-gray-500'
          }`}
          aria-label={isSaved ? 'Bỏ lưu tin' : 'Lưu tin'}
        >
          <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* ── Nội dung: nửa còn lại, nền xám nhạt theo thiết kế ── */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 bg-gray-50 p-4 md:p-5 lg:w-1/2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[26px] font-extrabold leading-none text-cta">{priceLabel}</p>
            {pricePerM2 !== null && property.type === 'sell' && (
              <p className="mt-1 text-[13px] text-gray-500">{formatPrice(pricePerM2)}/m²</p>
            )}
          </div>
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-[13px] font-semibold text-gray-800 shadow-sm transition-colors hover:border-primary hover:text-primary"
          >
            <Mail className="h-3.5 w-3.5" />
            Liên hệ
          </Link>
        </div>

        <Link href={href} className="min-w-0">
          <h3 className="line-clamp-2 text-[17px] font-bold leading-snug text-gray-900 transition-colors group-hover:text-primary">
            {property.title}
          </h3>
        </Link>

        {location && (
          <p className="flex items-center gap-1.5 text-[13px] text-gray-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="line-clamp-1">{location}</span>
          </p>
        )}

        {/* Thông số cơ bản: diện tích, phòng, số tầng, loại nhà đất. */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] font-medium text-gray-600">
          <span className="flex items-center gap-1.5"><Square className="h-3.5 w-3.5 text-gray-400" />{property.area} m²</span>
          {!!property.bedrooms && property.bedrooms > 0 && (
            <span className="flex items-center gap-1.5"><Bed className="h-3.5 w-3.5 text-gray-400" />{property.bedrooms} PN</span>
          )}
          {!!property.bathrooms && property.bathrooms > 0 && (
            <span className="flex items-center gap-1.5"><Bath className="h-3.5 w-3.5 text-gray-400" />{property.bathrooms} WC</span>
          )}
          {!!property.floors && property.floors > 0 && (
            <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-gray-400" />{property.floors} tầng</span>
          )}
          {property.category && (
            <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-gray-400" />{property.category}</span>
          )}
        </div>

        {/* Tiện ích: lưới 3 cột (2 cột khi hẹp), icon nhỏ trước mỗi mục. */}
        {amenities.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
            {amenities.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[12.5px] text-gray-700">
                <Icon className="h-4 w-4 shrink-0 text-gray-500" />
                <span className="line-clamp-1">{label}</span>
              </li>
            ))}
          </ul>
        )}

        {summary && <p className="line-clamp-2 text-[13px] leading-relaxed text-gray-500">{summary}</p>}

        <div className="mt-auto flex items-center gap-2.5 pt-1">
          {property.user?.avatar ? (
            <img src={property.user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white">
              <User className="h-4 w-4 text-gray-400" />
            </span>
          )}
          <span className="line-clamp-1 text-[13px] font-medium text-gray-700">{property.user?.name || 'Môi giới'}</span>
        </div>
      </div>
    </article>
  );
}
