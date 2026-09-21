'use client';

import Link from 'next/link';
import { Heart, MapPin, Bed, Bath, Square, User, CheckCircle, Camera, Ruler } from 'lucide-react';
import { formatPrice, formatPriceByMode, timeAgo, derivePrices } from '@/lib/formatters';
import { CONFIG } from '@/lib/config';
import { useFavorite } from '@/hooks/useFavorite';
import { legalText, furnitureText, directionText } from '@/lib/property-form-config';

export interface HorizontalCardProperty {
  id: number | string;
  slug: string;
  title: string;
  price: number;
  priceUnit?: string;
  priceDisplayFormat?: 'short' | 'million' | 'mixed';
  area: number;
  type: string;
  thumbnail?: string;
  /** Toàn bộ ảnh của tin (đã sắp theo sort_order) — khu ảnh 1 lớn + 2 nhỏ lấy từ đây. */
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

/** Mô tả từ trình soạn thảo có thể chứa HTML — chỉ lấy chữ để hiện 2 dòng tóm tắt. */
function plainText(html?: string | null): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

/** "Tiện ích cơ bản" theo yêu cầu khách — gom từ các cột đã có sẵn trên tin (không cần bảng features). */
function buildAmenities(p: HorizontalCardProperty): string[] {
  const out: string[] = [];
  if (p.legal) out.push(legalText(p.legal));
  if (p.furniture && p.furniture !== 'none' && p.furniture !== 'khac') out.push(furnitureText(p.furniture));
  if (p.direction && p.direction !== 'khong_xac_dinh') out.push(`Hướng ${directionText(p.direction)}`);
  if (p.floors && p.floors > 0) out.push(`${p.floors} tầng`);
  if (p.parking) out.push('Chỗ đậu xe');
  return out.slice(0, 4);
}

/**
 * Card ngang cho trang danh sách (feedback 21/09, mục 3-5): ảnh bên trái (1 lớn + 2 nhỏ),
 * thông tin bên phải. Dưới `sm` xếp dọc lại: ảnh trên, chữ dưới.
 */
export function PropertyCardHorizontal({
  property,
  className = '',
}: {
  property: HorizontalCardProperty;
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
  const [mainImage, ...rest] = images;
  // Chỉ dựng khung 1 lớn + 2 nhỏ khi có đủ 3 ảnh; ít hơn thì ảnh chính chiếm trọn để không có ô trống.
  const smallImages = rest.length >= 2 ? rest.slice(0, 2) : [];

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
    <Link href={href} className={`group block ${className}`}>
      <article
        className={`flex flex-col sm:flex-row overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
          vipLabel ? 'border-[1.5px] border-dashed border-cta' : 'border border-gray-100 hover:border-primary/20'
        }`}
      >
        {/* ── Khu ảnh: 1 lớn trên + 2 nhỏ dưới ── */}
        <div className="relative shrink-0 w-full sm:w-[42%] md:w-[320px] lg:w-[300px] xl:w-[340px] bg-gray-100">
          <div className={`grid gap-1 h-full ${smallImages.length ? 'grid-rows-[minmax(0,2fr)_minmax(0,1fr)]' : ''}`}>
            <div className="relative aspect-[4/3] sm:aspect-auto sm:min-h-[180px] overflow-hidden">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={property.title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs uppercase text-gray-400">Không có ảnh</span>
                </div>
              )}

              {/* Bộ đếm ảnh — góc dưới phải khung hình chính (mục 12; đợt 3 sẽ chạy theo slider). */}
              {images.length > 0 && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
                  <Camera className="h-3 w-3" />
                  1/{images.length}
                </div>
              )}
            </div>

            {smallImages.length > 0 && (
              <div className="grid grid-cols-2 gap-1 min-h-[72px]">
                {smallImages.map((src, i) => (
                  <div key={`${src}-${i}`} className="relative overflow-hidden">
                    <img
                      src={src}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nhãn góc trên trái */}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
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
            className={`absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow-sm transition-colors hover:bg-white hover:text-cta ${
              isSaved ? 'text-cta' : 'text-gray-400'
            }`}
            aria-label={isSaved ? 'Bỏ lưu tin' : 'Lưu tin'}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* ── Thông tin ── */}
        <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[19px] font-bold leading-none text-cta">{priceLabel}</p>
              {pricePerM2 !== null && property.type === 'sell' && (
                <p className="mt-1 text-[12px] text-gray-400">{formatPrice(pricePerM2)}/m²</p>
              )}
            </div>
            {property.created_at && (
              <span className="shrink-0 text-[12px] font-medium text-gray-400">{timeAgo(property.created_at)}</span>
            )}
          </div>

          <h3 className="line-clamp-2 text-[16px] font-bold leading-snug text-gray-900 transition-colors group-hover:text-primary">
            {property.title}
          </h3>

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

          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {amenities.map((a) => (
                <span key={a} className="rounded-md bg-gray-50 px-2 py-1 text-[12px] font-medium text-gray-600 border border-gray-100">
                  {a}
                </span>
              ))}
            </div>
          )}

          {summary && <p className="line-clamp-2 text-[13px] leading-relaxed text-gray-500">{summary}</p>}

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
            <div className="flex min-w-0 items-center gap-2">
              {property.user?.avatar ? (
                <img src={property.user.avatar} alt={property.user.name} className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                </div>
              )}
              <span className="line-clamp-1 text-[13px] font-medium text-gray-700">{property.user?.name || 'Môi giới'}</span>
            </div>
            {verified && (
              <span className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-primary">
                <CheckCircle className="h-3.5 w-3.5" />
                Đã xác thực
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
