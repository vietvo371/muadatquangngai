/**
 * Adapter: phản hồi API → kiểu chuẩn (Notion 07/10 "Adapter / Mapper").
 *
 * Đây là CỬA DUY NHẤT dữ liệu dự án đi vào giao diện. Dữ liệu mẫu (nếu có) cũng phải đi qua
 * đây, để dữ liệu mẫu và dữ liệu thật có đúng một hình dạng.
 *
 * Nguyên tắc: thiếu là `null`, sai kiểu là `null`. Bản trước của trang chi tiết dự án tự điền
 * giá "3 – 8 tỷ", "256 căn", bàn giao "31/12/2026", danh sách tiện ích "Hồ bơi, Gym..." và cả
 * một người liên hệ "Nguyễn Văn Việt – 0905123456" khi dữ liệu trống — người mua không có cách
 * nào biết đó là số bịa. Ở đây tuyệt đối không có giá trị dự phòng nào kiểu đó.
 */

import { cleanText, toFiniteNumber } from '@/lib/display-format';
import { getProjectTypeLabel, isLandLikeProjectType } from '@/lib/project-type';
import { isAcceptableNearbyName } from '@/lib/nearby-filters';
import type { UnitStatus } from '@/lib/design-tokens';
import type {
  NearbyCategory,
  NearbyPlace,
  NearbyPlaces,
  Pagination,
  Project,
  ProjectContact,
  Unit,
  UnitType,
} from './types';

type Raw = Record<string, unknown>;

function asObject(value: unknown): Raw | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Raw) : null;
}

function asPositive(value: unknown): number | null {
  const n = toFiniteNumber(value);
  return n !== null && n > 0 ? n : null;
}

/** Ảnh: chỉ nhận URL http(s) hoặc đường dẫn tuyệt đối trong site; bỏ trùng. */
function adaptImages(...sources: unknown[]): string[] {
  const out: string[] = [];
  for (const source of sources) {
    const list = Array.isArray(source) ? source : typeof source === 'string' ? source.split(',') : [];
    for (const item of list) {
      const url = typeof item === 'string' ? item.trim() : cleanText(asObject(item)?.url);
      if (url && /^(https?:\/\/|\/)/.test(url) && !out.includes(url)) out.push(url);
    }
  }
  return out;
}

function adaptStringList(value: unknown): string[] {
  let list: unknown = value;
  if (typeof value === 'string') {
    try {
      list = JSON.parse(value);
    } catch {
      list = value.split(',');
    }
  }
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((v) => cleanText(v)).filter((v): v is string => v !== null))];
}

const NEARBY_CATEGORIES: NearbyCategory[] = ['school', 'supermarket', 'park', 'hospital'];

function adaptNearbyPlaces(value: unknown): NearbyPlaces | null {
  const obj = asObject(value);
  if (!obj) return null;
  const result = {} as NearbyPlaces;
  let total = 0;
  for (const cat of NEARBY_CATEGORIES) {
    const list = Array.isArray(obj[cat]) ? (obj[cat] as unknown[]) : [];
    result[cat] = list
      .map((item): NearbyPlace | null => {
        const o = asObject(item);
        const name = cleanText(o?.name);
        // Dữ liệu dự án lưu từ trước khi có bộ lọc tên — lọc lại lúc hiển thị.
        if (!o || !name || !isAcceptableNearbyName(cat, name)) return null;
        const lat = toFiniteNumber(o.lat);
        const lng = toFiniteNumber(o.lng);
        return {
          name,
          address: cleanText(o.address) ?? '',
          dist: cleanText(o.dist) ?? '',
          time: cleanText(o.time) ?? '',
          ...(lat !== null && lng !== null ? { lat, lng } : {}),
        };
      })
      .filter((p): p is NearbyPlace => p !== null);
    total += result[cat].length;
  }
  // Có object nhưng cả 4 nhóm đều rỗng = chưa tra được gì; coi như chưa có dữ liệu.
  return total > 0 ? result : null;
}

/** floor_plans lưu dạng { type, area: "120m²", count, priceFrom, visible }. */
function adaptUnitTypes(value: unknown): UnitType[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): UnitType | null => {
      const o = asObject(item);
      if (!o || o.visible === false) return null;
      const name = cleanText(o.type);
      if (!name) return null;
      return {
        name,
        area: asPositive(typeof o.area === 'string' ? parseFloat(o.area) : o.area),
        count: asPositive(o.count),
        priceFrom: asPositive(o.priceFrom),
      };
    })
    .filter((t): t is UnitType => t !== null);
}

/**
 * Người liên hệ: ưu tiên môi giới phụ trách. Chỉ dùng tài khoản tạo dự án khi người đó có số
 * điện thoại thật — tài khoản "Administrator" không SĐT thì thà không hiện khối liên hệ.
 */
function adaptContact(agentRaw: unknown, ownerRaw: unknown): ProjectContact | null {
  for (const [raw, role] of [[agentRaw, 'agent'], [ownerRaw, 'owner']] as const) {
    const o = asObject(raw);
    const name = cleanText(o?.name);
    const phone = cleanText(o?.phone);
    if (!o || !name) continue;
    if (role === 'owner' && !phone) continue;
    return { name, phone, avatar: cleanText(o.avatar), role };
  }
  return null;
}

export function adaptProject(raw: unknown): Project | null {
  const p = asObject(raw);
  // id dạng số (dữ liệu thật) hoặc chuỗi (bản xem trước trong trang quản trị gửi 'preview').
  const id = p ? cleanText(typeof p.id === 'number' ? String(p.id) : p.id) : null;
  const slug = cleanText(p?.slug);
  const name = cleanText(p?.name);
  // Thiếu khoá định danh thì không dựng được trang — trả null để hiện "Không tìm thấy" thật.
  if (!p || !id || !slug || !name) return null;

  const location = asObject(p.location) ?? {};
  const scale = asObject(p.scale) ?? {};
  const price = asObject(p.price) ?? {};
  const type = cleanText(p.type) ?? '';

  let priceFrom = asPositive(price.from ?? p.price_from);
  let priceTo = asPositive(price.to ?? p.price_to);
  // Nhập ngược (giá "từ" lớn hơn giá "đến") thì đảo lại thay vì hiện "5 tỷ – 1 tỷ".
  if (priceFrom !== null && priceTo !== null && priceFrom > priceTo) [priceFrom, priceTo] = [priceTo, priceFrom];

  const progress = toFiniteNumber(p.construction_progress);

  return {
    id,
    slug,
    name,
    developer: cleanText(p.developer),
    descriptionHtml: cleanText(p.description),
    status: cleanText(p.status) ?? 'upcoming',
    statusLabel: p.status_visible === false ? null : cleanText(p.status_label),
    type,
    typeLabel: getProjectTypeLabel(type),
    unitWord: isLandLikeProjectType(type) ? 'lô' : 'căn',
    images: adaptImages(p.images, p.thumbnail),
    location: {
      address: cleanText(location.address ?? p.address),
      ward: cleanText(asObject(location.ward)?.name),
      district: cleanText(asObject(location.district)?.name),
      province: cleanText(asObject(location.province)?.name),
      latitude: toFiniteNumber(location.latitude),
      longitude: toFiniteNumber(location.longitude),
    },
    totalAreaHa: asPositive(scale.total_area ?? p.total_area),
    totalUnits: asPositive(scale.total_units ?? p.total_units),
    totalBlocks: asPositive(scale.total_blocks ?? p.total_blocks),
    totalFloors: asPositive(scale.total_floors ?? p.total_floors),
    priceFrom,
    priceTo,
    legal: cleanText(p.legal),
    handoverDate: cleanText(p.handover_date),
    constructionProgress: progress !== null && progress >= 0 && progress <= 100 ? progress : null,
    constructionNote: cleanText(p.construction_note),
    utilities: adaptStringList(p.utilities),
    unitTypes: adaptUnitTypes(p.floor_plans),
    subdivisions: [],
    masterPlan: null,
    nearbyPlaces: adaptNearbyPlaces(p.nearby_places),
    contact: adaptContact(p.agent, p.owner),
    viewCount: toFiniteNumber(p.view_count),
  };
}

const PRICE_UNITS = ['total', 'per_m2', 'per_month', 'negotiable'] as const;

/**
 * Tin đăng thuộc dự án → Unit. Trạng thái: tin đang hiển thị trên web thì là "Còn hàng";
 * mọi trường hợp khác là "Chưa rõ" chứ không đoán thành "Đã bán".
 */
export function adaptUnit(raw: unknown): Unit | null {
  const u = asObject(raw);
  const id = u ? toFiniteNumber(u.id) : null;
  const slug = cleanText(u?.slug);
  const title = cleanText(u?.title);
  if (!u || id === null || !slug || !title) return null;

  const priceUnitRaw = cleanText(u.price_unit);
  const priceUnit = (PRICE_UNITS as readonly string[]).includes(priceUnitRaw ?? '')
    ? (priceUnitRaw as Unit['priceUnit'])
    : priceUnitRaw === 'month'
      ? 'per_month'
      : 'total';

  const status: UnitStatus = u.status === 'active' ? 'available' : u.status === 'sold' ? 'sold' : 'unknown';

  return {
    id: String(id),
    slug,
    href: u.type === 'rent' ? `/cho-thue/${slug}` : `/mua-ban/${slug}`,
    title,
    price: u.price_negotiable === true ? null : asPositive(u.price),
    priceUnit: u.price_negotiable === true ? 'negotiable' : priceUnit,
    area: asPositive(u.area),
    thumbnail: adaptImages(u.thumbnail, u.thumbnail_url)[0] ?? null,
    district: cleanText(asObject(asObject(u.location)?.district)?.name),
    publishedAt: cleanText(u.published_at ?? u.created_at),
    status,
  };
}

/** Phân trang chuẩn Laravel `{ current_page, last_page, per_page, total }`. */
export function adaptPagination(raw: unknown, fallbackCount = 0): Pagination {
  const m = asObject(raw) ?? {};
  const page = asPositive(m.current_page) ?? 1;
  const perPage = asPositive(m.per_page) ?? Math.max(fallbackCount, 1);
  const total = toFiniteNumber(m.total) ?? fallbackCount;
  const lastPage = asPositive(m.last_page) ?? Math.max(1, Math.ceil(total / perPage));
  return { page, lastPage, perPage, total: Math.max(0, total) };
}

/** Danh sách: bỏ các phần tử không chuyển được thay vì làm hỏng cả danh sách. */
export function adaptList<T>(raw: unknown, adapt: (item: unknown) => T | null): T[] {
  return Array.isArray(raw) ? raw.map(adapt).filter((x): x is T => x !== null) : [];
}
