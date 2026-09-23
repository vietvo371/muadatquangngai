'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Heart, MapPin, Bed, Bath, Square, CheckCircle, Camera, Ruler, ChevronLeft, ChevronRight,
  Mail, Layers, Sofa, Compass, Building2, Car, FileText,
} from 'lucide-react';
import { formatPrice, formatPriceByMode, timeAgo, derivePrices } from '@/lib/formatters';
import { CONFIG } from '@/lib/config';
import { useFavorite } from '@/hooks/useFavorite';
import { legalText, furnitureText, directionText } from '@/lib/property-form-config';

export interface FeaturedCardProperty {
  id: number | string;
  slug: string;
  title: string;
  price: number;
  priceUnit?: string;
  priceDisplayFormat?: 'short' | 'million' | 'mixed';
  area: number;
  type: string;
  /** Loại nhà đất (tên danh mục) — khách yêu cầu hiện "loại đất" trên thẻ nổi bật. */
  category?: string;
  thumbnail?: string;
  /** Toàn bộ ảnh của tin, đã sắp theo sort_order. */
  images?: string[];
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
  is_verified?: boolean;
  created_at?: string;
  user?: { name: string; avatar?: string | null; is_verified?: boolean };
}

const VIP_BADGE: Record<string, string> = { vip: 'VIP', vip_plus: 'VIP+', diamond: 'DIAMOND' };

type AmenityIcon = typeof Sofa;

/** Mô tả từ trình soạn thảo có thể chứa HTML — chỉ lấy chữ để hiện tóm tắt. */
function plainText(html?: string | null): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Tiện ích cơ bản, gom từ các cột sẵn có trên tin (không cần bảng features riêng).
 * Mỗi mục kèm icon theo yêu cầu 23/09; tin thiếu dữ liệu nào thì bỏ mục đó, không hiện ô rỗng.
 */
function buildAmenities(p: FeaturedCardProperty): Array<{ icon: AmenityIcon; label: string }> {
  const out: Array<{ icon: AmenityIcon; label: string }> = [];
  if (p.legal) out.push({ icon: FileText, label: legalText(p.legal) });
  if (p.furniture && p.furniture !== 'none' && p.furniture !== 'khac') {
    out.push({ icon: Sofa, label: furnitureText(p.furniture) });
  }
  if (p.direction && p.direction !== 'khong_xac_dinh') {
    out.push({ icon: Compass, label: `Hướng ${directionText(p.direction)}` });
  }
  if (p.floors && p.floors > 0) out.push({ icon: Building2, label: `${p.floors} tầng` });
  if (p.parking) out.push({ icon: Car, label: 'Chỗ đậu xe' });
  if (p.category) out.push({ icon: Layers, label: p.category });
  return out.slice(0, 6);
}

/**
 * Thẻ tin NỔI BẬT ở hàng đầu trang danh sách (yêu cầu 23/09): ảnh chiếm 50% bên trái,
 * nội dung 50% bên phải. Các tin từ #2 trở đi dùng thẻ dọc `PropertyCard` trong lưới 3 cột.
 *
 * Tiền thân là `PropertyCardHorizontal` của đợt 21/09 — hồi đó MỌI tin đều là thẻ ngang; khách
 * đổi ý ngày 23/09 nên thẻ ngang chỉ còn dùng cho đúng tin đầu tiên.
 */
export function FeaturedPropertyCard({
  property,
  className = '',
}: {
  property: FeaturedCardProperty;
  className?: string;
}) {
  const vipValue = property.isVip || 'normal';
  const vipLabel = CONFIG.enableVip && vipValue !== 'normal' ? VIP_BADGE[vipValue] : '';
  const location = property.location || property.address || '';
  const typeLabel = property.type === 'sell' ? 'Bán' : property.type === 'rent' ? 'Cho thuê' : property.type;
  const href = `/${property.type === 'sell' ? 'mua-ban' : 'cho-thue'}/${property.slug}`;
  // eslint-disable-next-line react-hooks/purity
  const isNew = !!property.created_at && Date.now() - new Date(property.created_at).getTime() < 86400000;

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
  const verified = property.is_verified || property.user?.is_verified;

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:shadow-xl lg:flex-row ${
        vipLabel ? 'border-[1.5px] border-dashed border-cta' : 'border border-gray-100 hover:border-primary/20'
      } ${className}`}
    >
      {/* ── Ảnh: đúng một nửa bề ngang trên desktop ── */}
      <div className="relative w-full shrink-0 bg-gray-100 lg:w-1/2">
        <CardImageSlider images={images} alt={property.title} />

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {vipLabel && (
            <span className="rounded-md bg-cta px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
              {vipLabel}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
              {typeLabel}
            </span>
            {isNew && (
              <span className="rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold uppercase text-primary shadow-sm">
                Mới
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(); }}
          className={`absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 shadow-sm transition-colors hover:bg-white hover:text-cta ${
            isSaved ? 'text-cta' : 'text-gray-400'
          }`}
          aria-label={isSaved ? 'Bỏ lưu tin' : 'Lưu tin'}
        >
          <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* ── Nội dung: nửa còn lại ── */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 md:p-5 lg:w-1/2">
        {/* Giá lớn bên trái, nút liên hệ góc trên phải. */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[26px] font-extrabold leading-none text-cta">{priceLabel}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-gray-500">
              {pricePerM2 !== null && property.type === 'sell' && <span>{formatPrice(pricePerM2)}/m²</span>}
              <span className="font-medium text-gray-700">{property.area} m²</span>
              {!!property.floors && property.floors > 0 && <span>{property.floors} tầng</span>}
              {property.category && <span>{property.category}</span>}
            </div>
          </div>
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
          >
            <Mail className="h-3.5 w-3.5" />
            Liên hệ
          </Link>
        </div>

        <Link href={href} className="min-w-0">
          <h3 className="line-clamp-2 text-[18px] font-bold leading-snug text-gray-900 transition-colors group-hover:text-primary">
            {property.title}
          </h3>
        </Link>

        {location && (
          <p className="flex items-center gap-1.5 text-[13px] text-gray-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="line-clamp-1">{location}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] font-medium text-gray-600">
          {!!property.bedrooms && property.bedrooms > 0 && (
            <span className="flex items-center gap-1.5">
              <Bed className="h-4 w-4 text-gray-400" />
              {property.bedrooms} PN
            </span>
          )}
          {!!property.bathrooms && property.bathrooms > 0 && (
            <span className="flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-gray-400" />
              {property.bathrooms} WC
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Square className="h-4 w-4 text-gray-400" />
            {property.area} m²
          </span>
          {property.facade != null && Number(property.facade) > 0 && (
            <span className="flex items-center gap-1.5">
              <Ruler className="h-4 w-4 text-gray-400" />
              MT {property.facade} m
            </span>
          )}
        </div>

        {/* Tiện ích: lưới 2 cột (3 cột khi rộng), mỗi mục có icon nhỏ. */}
        {amenities.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 xl:grid-cols-3">
            {amenities.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
                <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="line-clamp-1">{label}</span>
              </li>
            ))}
          </ul>
        )}

        {summary && <p className="line-clamp-3 text-[13px] leading-relaxed text-gray-500">{summary}</p>}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-3 text-[12.5px]">
          <span className="line-clamp-1 font-medium text-gray-700">{property.user?.name || 'Môi giới'}</span>
          <div className="flex shrink-0 items-center gap-3">
            {verified && (
              <span className="flex items-center gap-1 font-medium text-primary">
                <CheckCircle className="h-3.5 w-3.5" />
                Đã xác thực
              </span>
            )}
            {property.created_at && <span className="text-gray-400">{timeAgo(property.created_at)}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}

const SWIPE_THRESHOLD_PX = 40;

/**
 * Khu ảnh của thẻ nổi bật: 1 ảnh lớn trượt ngang + 2 ảnh nhỏ bên dưới, nút Prev/Next overlay,
 * vuốt trên màn cảm ứng, bộ đếm "1/24" góc dưới phải. Hai ảnh nhỏ là hai ảnh kế tiếp, bấm để
 * nhảy thẳng tới ảnh đó.
 */
function CardImageSlider({ images, alt }: { images: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const count = images.length;
  const hasMany = count > 1;
  const showThumbs = count >= 3;

  const go = useCallback(
    (delta: number) => {
      if (count === 0) return;
      setIdx((i) => (i + delta + count) % count);
    },
    [count]
  );

  const stop = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    e.preventDefault();
    go(dx < 0 ? 1 : -1);
  };

  const thumbs = showThumbs ? [1, 2].map((k) => (idx + k) % count) : [];

  return (
    <div className={`grid h-full gap-1 ${showThumbs ? 'grid-rows-[minmax(0,2fr)_minmax(0,1fr)]' : ''}`}>
      <div
        className="relative aspect-[4/3] overflow-hidden touch-pan-y lg:aspect-auto lg:min-h-[220px]"
        onTouchStart={hasMany ? onTouchStart : undefined}
        onTouchEnd={hasMany ? onTouchEnd : undefined}
      >
        {count === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs uppercase text-gray-400">Không có ảnh</span>
          </div>
        ) : (
          <div
            className="absolute inset-0 flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${idx * 100}%)` }}
          >
            {images.map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={src}
                alt={i === 0 ? alt : ''}
                referrerPolicy="no-referrer"
                loading={i === 0 ? undefined : 'lazy'}
                draggable={false}
                className="h-full w-full shrink-0 object-cover"
              />
            ))}
          </div>
        )}

        {hasMany && (
          <>
            <button
              type="button"
              onClick={(e) => { stop(e); go(-1); }}
              aria-label="Ảnh trước"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-gray-800 shadow-md transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { stop(e); go(1); }}
              aria-label="Ảnh sau"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-gray-800 shadow-md transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {count > 0 && (
          <div
            data-testid="image-counter"
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white"
          >
            <Camera className="h-3 w-3" />
            {idx + 1}/{count}
          </div>
        )}
      </div>

      {showThumbs && (
        <div className="grid grid-cols-2 gap-1 min-h-[80px]">
          {thumbs.map((imageIndex, k) => (
            <button
              type="button"
              key={`${imageIndex}-${k}`}
              onClick={(e) => { stop(e); setIdx(imageIndex); }}
              aria-label={`Xem ảnh ${imageIndex + 1}`}
              className="relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <img
                src={images[imageIndex]}
                alt=""
                referrerPolicy="no-referrer"
                loading="lazy"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
