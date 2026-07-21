/**
 * Đối chiếu 1:1 với backend/app/Http/Resources/PropertyResource.php.
 *
 * GIỚI HẠN GIAI ĐOẠN 1 (đã báo trước, không che giấu): các route GET này là public
 * (không có middleware auth:sanctum trong Laravel), nhưng Laravel vẫn resolve
 * request()->user() nếu client gửi kèm Bearer token hợp lệ — khi đó Laravel trả thêm
 * `owner.phone` (nếu là chủ tin) và khoá `is_saved`. Bản Next.js Giai đoạn 1 CHƯA nối
 * auth nên luôn trả như một khách vãng lai (chưa đăng nhập). Cần bổ sung ở giai đoạn
 * cổng auth (Giai đoạn 2) trước khi chuyển traffic thật của user đã đăng nhập sang.
 *
 * GHI CHÚ THÊM: khi field bị `when()`/`whenLoaded()` từ chối (không đủ điều kiện) và
 * được set qua `PropertyResource::toArray()` gọi trực tiếp (route index() dùng pattern
 * `$paginator->setCollection($paginator->getCollection()->map(fn($i) => (new
 * PropertyResource($i))->toArray($request)))`, KHÔNG qua `resolve()`), Laravel serialize
 * ra `{}` (MissingValue chưa bị lọc) thay vì lược bỏ hẳn khoá — khác với route show()
 * (trả `new PropertyResource($property)` trực tiếp, ĐI QUA `resolve()`, khoá bị lược bỏ
 * đúng chuẩn). Đây là quirk nội bộ PHP không cố ý, không phải hợp đồng API — Next.js CHỌN
 * lược bỏ khoá (đúng chuẩn JsonResource) cho cả hai route, thay vì replicate `{}`.
 */

import { toVietnamIso8601 } from './carbon-format';

export interface PropertyRow {
  id: bigint;
  uuid: string;
  slug: string;
  title: string;
  description: string;
  street: string | null;
  type: string;
  status: string;
  is_vip: string;
  vip_expired_at: Date | null;
  price: unknown; // Prisma.Decimal
  price_unit: string;
  price_negotiable: boolean;
  area: unknown;
  area_floor: unknown;
  area_land: unknown;
  floors: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
  parking: boolean;
  direction: string | null;
  balcony_direction: string | null;
  road_width: unknown;
  facade: unknown;
  furniture: string;
  legal: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_address: string | null;
  thumbnail: string | null;
  latitude: unknown;
  longitude: unknown;
  view_count: number;
  contact_count: number;
  save_count: number;
  published_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
  provinces: { id: bigint; name: string; slug: string | null };
  districts: { id: bigint; name: string; slug: string };
  categories: { id: bigint; name: string; slug: string; icon: string | null };
  // users/property_media optional: route similar() không eager-load 2 quan hệ này,
  // chỉ được truy cập khi opts.includeOwner/includeMedia = true (mặc định true).
  users?: {
    id: bigint;
    name: string;
    phone: string | null;
    avatar: string | null;
    role: string;
    rating: unknown;
    total_listings: number;
  };
  property_media?: Array<{
    id: bigint;
    type: string;
    url: string;
    thumbnail: string | null;
    caption: string | null;
    is_primary: boolean;
    sort_order: number;
  }>;
  property_features?: Array<{ features: { id: bigint; name: string; icon: string | null } }>;
}

export interface WardRow {
  id: bigint;
  name: string;
  slug: string;
}

function toFloat(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'object' ? Number(value.toString()) : Number(value);
}

function toFloatOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return toFloat(value);
}

/** number_format() của PHP — cần thiết vì price_formatted phải khớp byte-for-byte. */
function phpNumberFormat(num: number, decimals: number, decimalSep: string, thousandsSep: string): string {
  const fixed = num.toFixed(decimals);
  const [intPart, fracPart] = fixed.split('.');
  const negative = intPart.startsWith('-');
  const digits = negative ? intPart.slice(1) : intPart;
  const grouped = thousandsSep ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep) : digits;
  return (negative ? '-' : '') + grouped + (fracPart ? decimalSep + fracPart : '');
}

/** Đối chiếu Property::priceFormatted() accessor. */
function priceFormatted(price: number, priceUnit: string): string {
  const billion = 1_000_000_000;
  const million = 1_000_000;
  let formatted: string;

  if (price >= billion) {
    const decimals = price % billion === 0 ? 0 : 1;
    formatted = phpNumberFormat(price / billion, decimals, '.', '') + ' tỷ';
  } else if (price >= million) {
    formatted = phpNumberFormat(price / million, 0, ',', '.') + ' triệu';
  } else {
    formatted = phpNumberFormat(price, 0, ',', '.') + ' đ';
  }

  if (priceUnit === 'per_m2') return formatted + '/m²';
  if (priceUnit === 'per_month') return formatted + '/tháng';
  return formatted;
}

/** Đối chiếu Property::fullAddress() accessor. */
function fullAddress(street: string | null, ward: WardRow | null, district: { name: string }, province: { name: string }): string {
  return [street, ward?.name, district.name, province.name].filter(Boolean).join(', ');
}

/**
 * `opts.includeOwner`/`includeMedia`: đối chiếu `whenLoaded('user')`/`whenLoaded('media')`
 * của PropertyResource.php — route nào eager-load quan hệ thì có khoá, không thì Laravel
 * (qua resolve()) LƯỢC BỎ khoá hẳn. index()/show()/my-properties load đủ (mặc định true);
 * similar() chỉ load province/district/category nên phải tắt owner+media để khớp shape thật.
 */
export function mapPropertyResource(
  property: PropertyRow,
  ward: WardRow | null,
  opts: { includeOwner?: boolean; includeMedia?: boolean } = {}
) {
  const { includeOwner = true, includeMedia = true } = opts;
  const price = toFloat(property.price);

  return {
    id: property.id,
    uuid: property.uuid,
    slug: property.slug,
    title: property.title,
    description: property.description,
    street: property.street,
    type: property.type,
    status: property.status,
    is_vip: property.is_vip,
    vip_expired_at: toVietnamIso8601(property.vip_expired_at),

    price,
    price_formatted: priceFormatted(price, property.price_unit),
    price_unit: property.price_unit,
    price_negotiable: property.price_negotiable,

    area: toFloat(property.area),
    area_floor: toFloatOrNull(property.area_floor),
    area_land: toFloatOrNull(property.area_land),

    floors: property.floors,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    toilets: property.toilets,
    parking: property.parking,
    direction: property.direction,
    balcony_direction: property.balcony_direction,
    road_width: toFloatOrNull(property.road_width),
    facade: toFloatOrNull(property.facade),
    furniture: property.furniture,
    legal: property.legal,

    // Liên hệ riêng của tin — fallback về thông tin chủ tin cho các tin đăng cũ chưa có.
    contact_name: property.contact_name,
    contact_phone: property.contact_phone,
    contact_email: property.contact_email,
    contact_address: property.contact_address,

    address: fullAddress(property.street, ward, property.districts, property.provinces),
    thumbnail: property.thumbnail,
    thumbnail_url: property.thumbnail,

    location: {
      province: { id: property.provinces.id, name: property.provinces.name, slug: property.provinces.slug },
      district: { id: property.districts.id, name: property.districts.name, slug: property.districts.slug },
      ward: ward ? { id: ward.id, name: ward.name, slug: ward.slug } : null,
      latitude: toFloatOrNull(property.latitude),
      longitude: toFloatOrNull(property.longitude),
    },

    category: {
      id: property.categories.id,
      name: property.categories.name,
      slug: property.categories.slug,
      icon: property.categories.icon,
    },

    ...(includeOwner && property.users
      ? {
          owner: {
            id: property.users.id,
            name: property.users.name,
            // owner.phone: chỉ trả khi request là chính chủ tin — Giai đoạn 1 chưa nối auth nên luôn ẩn (xem ghi chú đầu file)
            avatar: property.users.avatar,
            role: property.users.role,
            rating: toFloat(property.users.rating),
            total_listings: property.users.total_listings,
          },
        }
      : {}),

    ...(includeMedia && property.property_media
      ? {
          media: property.property_media
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((m) => ({
              id: m.id,
              type: m.type,
              url: m.url,
              thumbnail: m.thumbnail ?? m.url,
              caption: m.caption,
              is_primary: m.is_primary,
              sort_order: m.sort_order,
            })),
        }
      : {}),

    ...(property.property_features
      ? {
          features: property.property_features.map((pf) => ({
            id: pf.features.id,
            name: pf.features.name,
            icon: pf.features.icon,
          })),
        }
      : {}),

    stats: {
      view_count: property.view_count,
      contact_count: property.contact_count,
      save_count: property.save_count,
    },

    // is_saved: chỉ trả khi có user đăng nhập — Giai đoạn 1 chưa nối auth nên luôn ẩn key (xem ghi chú đầu file)

    published_at: toVietnamIso8601(property.published_at),
    created_at: toVietnamIso8601(property.created_at),
    updated_at: toVietnamIso8601(property.updated_at),
  };
}

/**
 * Nạp ward cho tập property có ward_id — tái hiện side-effect fullAddress() lazy-load
 * ward của Laravel (route không eager-load ward nhưng accessor fullAddress đụng
 * $this->ward?->name làm ward xuất hiện trong address + location.ward khi tin có ward_id).
 * Dùng ở featured/nearby/saved/similar. Trả Map wardId(string) -> WardRow.
 */
export async function loadWardsMap(props: Array<{ ward_id: bigint | null }>): Promise<Map<string, WardRow>> {
  const ids = [...new Set(props.map((p) => p.ward_id).filter((w): w is bigint => w !== null))];
  if (ids.length === 0) return new Map();
  const { db } = await import('@/lib/db');
  const wards = await db.wards.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, slug: true } });
  return new Map(wards.map((w) => [w.id.toString(), w]));
}
