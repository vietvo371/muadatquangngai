// Cấu hình form đăng tin — nguồn sự thật duy nhất cho việc "hiển thị trường nào theo
// danh mục nào". Theo yêu cầu mục 11 của spec: KHÔNG dựng 3 trang đăng tin riêng, mà
// dùng 1 form chung + 1 danh sách trường chung + cấu hình riêng theo nhóm.
//
// Dùng chung cho: form đăng tin, form sửa tin, và validate phía API — để client và
// server không bao giờ lệch nhau về việc trường nào hợp lệ với danh mục nào.

/** 3 nhóm bất động sản, quyết định bộ trường hiển thị. */
export type PropertyGroup = 'residential' | 'land' | 'industrial';

/**
 * Map 9 danh mục bán (khớp SELL_CATEGORIES trong category-menu.ts) sang 3 nhóm.
 * id ở đây là categories.id thật trong DB.
 */
export const CATEGORY_GROUP: Record<number, PropertyGroup> = {
  2: 'residential',  // Bán nhà riêng
  4: 'residential',  // Bán nhà biệt thự, liền kề
  3: 'residential',  // Bán nhà mặt phố
  7: 'residential',  // Bán Shophouse, nhà phố thương mại
  8: 'residential',  // Bán trang trại, khu nghỉ dưỡng
  5: 'land',         // Bán đất nền dự án
  6: 'land',         // Bán đất
  19: 'industrial',  // Bán kho, nhà xưởng
  20: 'industrial',  // Bán loại bất động sản khác
};

/** Danh mục lạ (vd. tin cho thuê cũ) coi như nhóm nhà ở — bộ trường rộng nhất. */
export function getPropertyGroup(categoryId: number | string | undefined | null): PropertyGroup {
  const id = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
  if (!id) return 'residential';
  return CATEGORY_GROUP[id] ?? 'residential';
}

/** Các trường "riêng theo nhóm" — trường dùng chung (giá, diện tích, địa chỉ...) không nằm ở đây. */
export type GroupField =
  | 'bedrooms'
  | 'bathrooms'
  | 'toilets'
  | 'floors'
  | 'direction'
  | 'balcony_direction'
  | 'road_width'
  | 'facade'
  | 'legal'
  | 'furniture'
  | 'utilities';

/** Spec mục 11.2 — trường riêng theo từng nhóm. */
export const GROUP_FIELDS: Record<PropertyGroup, readonly GroupField[]> = {
  residential: [
    'bedrooms', 'bathrooms', 'floors', 'direction', 'balcony_direction',
    'road_width', 'facade', 'legal', 'furniture', 'utilities',
  ],
  // Nhóm đất KHÔNG có phòng ngủ, phòng tắm, số tầng, hướng ban công, nội thất.
  land: ['direction', 'road_width', 'facade', 'legal'],
  industrial: [
    'bathrooms', 'toilets', 'direction', 'road_width', 'facade',
    'legal', 'furniture', 'utilities',
  ],
};

/** Hợp của cả 3 nhóm — mọi trường riêng có thể xuất hiện trên form. */
export const ALL_GROUP_FIELDS: readonly GroupField[] = [
  ...new Set([...GROUP_FIELDS.residential, ...GROUP_FIELDS.land, ...GROUP_FIELDS.industrial]),
];

export function isFieldVisible(group: PropertyGroup, field: GroupField): boolean {
  return GROUP_FIELDS[group].includes(field);
}

/** Nhãn "Hướng nhà" đổi thành "Hướng đất" ở nhóm đất cho đúng ngữ cảnh. */
export function directionLabel(group: PropertyGroup): string {
  return group === 'land' ? 'Hướng đất' : 'Hướng nhà';
}

/**
 * Xoá các trường không thuộc nhóm khỏi payload. Spec yêu cầu rõ: "Không được lưu dữ
 * liệu phòng ngủ, số tầng hoặc nội thất cho danh mục đất." Gọi ở cả client (khi đổi
 * danh mục) lẫn server (trước khi ghi DB) để dữ liệu rác không lọt qua đường nào.
 */
export function stripFieldsNotInGroup<T extends Record<string, unknown>>(
  group: PropertyGroup,
  data: T
): T {
  const out = { ...data };
  for (const field of ALL_GROUP_FIELDS) {
    if (!isFieldVisible(group, field)) delete out[field];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Danh sách lựa chọn (spec mục 4.3)
// ---------------------------------------------------------------------------

export interface SelectOption {
  value: string;
  label: string;
}

/** 8 hướng + "Không xác định" theo spec. Giá trị khớp enum DIRECTIONS ở API. */
export const DIRECTION_OPTIONS: readonly SelectOption[] = [
  { value: 'dong', label: 'Đông' },
  { value: 'tay', label: 'Tây' },
  { value: 'nam', label: 'Nam' },
  { value: 'bac', label: 'Bắc' },
  { value: 'dong_bac', label: 'Đông Bắc' },
  { value: 'dong_nam', label: 'Đông Nam' },
  { value: 'tay_bac', label: 'Tây Bắc' },
  { value: 'tay_nam', label: 'Tây Nam' },
  { value: 'khong_xac_dinh', label: 'Không xác định' },
];

/**
 * Pháp lý — rút xuống 4 mục theo feedback 28/07 ("danh sách có quá nhiều lựa chọn").
 * Chọn `other` thì form hiện thêm ô mô tả, lưu vào cột `properties.legal_note`.
 */
export const LEGAL_OPTIONS: readonly SelectOption[] = [
  { value: 'so_do', label: 'Sổ đỏ / Sổ hồng' },
  { value: 'contract', label: 'Hợp đồng mua bán' },
  { value: 'cho_so', label: 'Đang chờ sổ' },
  { value: 'other', label: 'Khác' },
];

/** Giá trị pháp lý cần mô tả thêm — form hiện ô nhập `legal_note` khi chọn giá trị này. */
export const LEGAL_NEEDS_NOTE = 'other';

/**
 * Giá trị cũ không còn trong form nhưng vẫn tồn tại trong DB — chỉ dùng để HIỂN THỊ và để
 * validate không từ chối tin đăng cũ đang sửa. `dat_coc`/`viet_tay` bị bỏ khỏi danh sách
 * chọn ở feedback 28/07 nhưng tin đã đăng vẫn đang mang giá trị đó, xoá hẳn là làm hỏng.
 */
const LEGACY_LEGAL_LABELS: Record<string, string> = {
  so_hong: 'Sổ hồng',
  dat_coc: 'Hợp đồng đặt cọc',
  viet_tay: 'Giấy tờ viết tay',
};

/**
 * Tình trạng nội thất — 6 mục theo spec, cũng chỉ thêm chứ không đổi giá trị cũ
 * (none/basic/full đang được dùng bởi tin đăng hiện có).
 */
export const FURNITURE_OPTIONS: readonly SelectOption[] = [
  { value: 'ban_giao_tho', label: 'Bàn giao thô' },
  { value: 'none', label: 'Không có nội thất' },
  { value: 'basic', label: 'Nội thất cơ bản' },
  { value: 'full', label: 'Nội thất đầy đủ' },
  { value: 'cao_cap', label: 'Nội thất cao cấp' },
  { value: 'khac', label: 'Tình trạng khác' },
];

/**
 * Đơn vị giá trong form — chỉ 2 lựa chọn theo feedback 28/07: tổng giá trị BĐS, hoặc giá
 * mỗi m². "Thoả thuận" đã bị bỏ khỏi đây vì trùng nghĩa với checkbox "Giá có thể thương
 * lượng" ngay bên dưới — cùng một ý mà hai chỗ nhập thì người dùng không biết chọn cái nào.
 * Giá trị `negotiable`/`per_month` vẫn hợp lệ ở API (xem VALID_PRICE_UNITS) để tin đã đăng
 * không hỏng.
 */
export const PRICE_UNIT_OPTIONS: readonly SelectOption[] = [
  { value: 'total', label: 'VND' },
  { value: 'per_m2', label: 'VND/m²' },
];

// ---------------------------------------------------------------------------
// Validate dùng chung client + server (spec mục 10.2)
// ---------------------------------------------------------------------------

/** SĐT Việt Nam: bắt đầu bằng 0, tổng 10-11 số. Bỏ qua khoảng trắng và dấu chấm. */
export function isValidPhone(phone: string): boolean {
  return /^0\d{9,10}$/.test(phone.replace(/[\s.]/g, ''));
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function labelFrom(options: readonly SelectOption[], value?: string | null): string {
  if (!value) return 'Đang cập nhật';
  return options.find((o) => o.value === value)?.label ?? value;
}

export const directionText = (v?: string | null) => labelFrom(DIRECTION_OPTIONS, v);
export const furnitureText = (v?: string | null) => labelFrom(FURNITURE_OPTIONS, v);
export const legalText = (v?: string | null) =>
  (v && LEGACY_LEGAL_LABELS[v]) || labelFrom(LEGAL_OPTIONS, v);

// Giá trị hợp lệ để API validate — gộp cả giá trị cũ để không từ chối tin đăng đang sửa.
export const VALID_DIRECTIONS = DIRECTION_OPTIONS.map((o) => o.value);
export const VALID_LEGAL = [...LEGAL_OPTIONS.map((o) => o.value), ...Object.keys(LEGACY_LEGAL_LABELS)];
export const VALID_FURNITURE = FURNITURE_OPTIONS.map((o) => o.value);
export const VALID_PRICE_UNITS = ['total', 'per_m2', 'per_month', 'negotiable'];

/**
 * Phân loại ảnh (feedback I.5) — khớp enum `MediaCategory` phía Laravel (không dùng ở app
 * đang chạy, nhưng giữ cùng danh sách/nhãn để nhất quán nếu sau này cần lại).
 */
export const IMAGE_CATEGORY_OPTIONS: readonly SelectOption[] = [
  { value: 'facade', label: 'Mặt tiền' },
  { value: 'living_room', label: 'Phòng khách' },
  { value: 'bedroom', label: 'Phòng ngủ' },
  { value: 'kitchen', label: 'Bếp' },
  { value: 'bathroom', label: 'Nhà vệ sinh' },
  { value: 'balcony', label: 'Ban công' },
  { value: 'view', label: 'View' },
  { value: 'amenity', label: 'Tiện ích' },
  { value: 'legal', label: 'Pháp lý' },
  { value: 'other', label: 'Khác' },
];
export const VALID_IMAGE_CATEGORIES = IMAGE_CATEGORY_OPTIONS.map((o) => o.value);

/** Cách hiển thị giá cho người mua (feedback I.3). */
export const PRICE_DISPLAY_FORMAT_OPTIONS: readonly SelectOption[] = [
  { value: 'short', label: '6,5 tỷ' },
  { value: 'million', label: '6500 triệu' },
  { value: 'mixed', label: '6 tỷ 500 triệu' },
];
export const VALID_PRICE_DISPLAY_FORMATS = PRICE_DISPLAY_FORMAT_OPTIONS.map((o) => o.value);

/** Domain hợp lệ cho link Tour 360 (feedback I.12) — chỉ 2 nền tảng phổ biến ở VN. */
export const TOUR360_DOMAINS = ['matterport.com', 'kuula.co'];
export function isValidTour360Url(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return TOUR360_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// PropertyFormData dùng chung — form đăng tin (dang-tin) + form sửa tin (edit).
// Superset của cả hai: mỗi trang chỉ render/gửi phần field nó thực sự dùng
// (vd. edit không có contact_*/videos — field vẫn tồn tại trong kiểu dữ liệu
// nhưng trang edit không đọc/ghi tới, giữ đúng hành vi hiện tại của từng trang).
// ---------------------------------------------------------------------------

export interface PropertyFormData {
  type: 'sell' | 'rent';
  category_id: string;
  title: string;
  description: string;
  province_id?: number;
  district_id?: number;
  ward_id?: number;
  // Tên khu vực — chỉ dùng để dựng câu (AI, địa chỉ hiển thị), không gửi lên khi tạo tin.
  province_name?: string;
  district_name?: string;
  ward_name?: string;
  latitude?: number;
  longitude?: number;
  street: string;

  images: Array<{
    id?: number;
    url: string;
    thumbnail?: string;
    name: string;
    size: number;
    isPrimary?: boolean;
    /** id gói phân loại ảnh (feedback I.5) — vd. 'facade', 'bedroom'... xem IMAGE_CATEGORY_OPTIONS. */
    imageType?: string;
    /** Chiều rộng ảnh gốc (px), Cloudinary trả kèm lúc upload — dùng cảnh báo ảnh nhỏ (feedback I.9). */
    width?: number;
  }>;
  videos: Array<{ url: string; thumbnail?: string; name: string; size: number }>;
  /** Link Tour 360 Matterport/Kuula (feedback I.12) — chỉ 1 link, không phải mảng. */
  tour360Url?: string;
  /** Ảnh/PDF mặt bằng (feedback I.13). */
  floorPlans: Array<{ url: string; thumbnail?: string; name: string; size: number }>;

  price: number;
  price_unit: 'total' | 'per_m2' | 'per_month' | 'negotiable';
  price_negotiable: boolean;
  /** Cách hiển thị giá cho người mua xem (feedback I.3) — xem PRICE_DISPLAY_FORMAT_OPTIONS. */
  price_display_format: 'short' | 'million' | 'mixed';
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  toilets?: number;
  floors?: number;
  direction?: string;
  balcony_direction?: string;
  road_width?: number;
  facade?: number;
  furniture?: string;
  legal?: string;
  /** Mô tả pháp lý tự do — chỉ dùng khi legal = 'other'. */
  legal_note?: string;
  features: number[];

  // Chỉ dùng ở form đăng tin (create) — form sửa tin không có bước liên hệ.
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;

  // Chỉ dùng ở form đăng tin (create) — number = id gói thật từ /api/v2/packages.
  package_id: number | null;
}

/** Tuỳ chọn cho 2 chỗ payload create/edit vốn đã khác nhau — giữ nguyên khác biệt cũ thay vì gộp bừa. */
export interface BuildPropertyPayloadOptions {
  /** create: undefined khi rỗng — edit: null khi rỗng. */
  legalNoteWhenEmpty?: string | null;
  /** create: undefined khi rỗng — edit: mảng rỗng khi rỗng. */
  featureIdsWhenEmpty?: number[] | undefined;
}

/**
 * Phần payload GIỐNG HỆT NHAU giữa đăng tin (POST) và sửa tin (PUT): thông tin cơ bản,
 * địa chỉ, các trường riêng theo nhóm BĐS. Không bao gồm images, videos, contact_*,
 * package_id, idempotency_key — những phần đó mỗi trang tự thêm vì thật sự khác nhau
 * (edit không gửi ảnh/gói qua payload này, xem PropertyMediaController riêng).
 */
export function buildPropertyPayload(
  formData: PropertyFormData,
  group: PropertyGroup,
  options: BuildPropertyPayloadOptions = {}
) {
  const address =
    [formData.street, formData.ward_name, formData.district_name, formData.province_name]
      .filter(Boolean)
      .join(', ') || formData.street || 'Việt Nam';

  const groupFields = stripFieldsNotInGroup(group, {
    bedrooms: formData.bedrooms || 0,
    bathrooms: formData.bathrooms || 0,
    toilets: formData.toilets,
    floors: formData.floors || undefined,
    direction: formData.direction || undefined,
    balcony_direction: formData.balcony_direction || undefined,
    road_width: formData.road_width,
    facade: formData.facade,
    furniture: formData.furniture || 'none',
    legal: formData.legal || undefined,
    utilities: undefined, // chỉ là cờ hiển thị, gửi qua feature_ids bên dưới
  });
  delete groupFields.utilities;

  return {
    title: formData.title,
    description: formData.description,
    type: formData.type,
    category_id: parseInt(formData.category_id, 10),
    price: formData.price,
    price_unit: formData.price_unit,
    price_negotiable: formData.price_negotiable || formData.price_unit === 'negotiable',
    price_display_format: formData.price_display_format,
    area: formData.area,
    ...groupFields,
    legal_note:
      isFieldVisible(group, 'legal') && formData.legal === LEGAL_NEEDS_NOTE && formData.legal_note?.trim()
        ? formData.legal_note.trim()
        : options.legalNoteWhenEmpty,
    province_id: formData.province_id,
    district_id: formData.district_id,
    ward_id: formData.ward_id || undefined,
    street: formData.street || undefined,
    address,
    latitude: formData.latitude ?? undefined,
    longitude: formData.longitude ?? undefined,
    feature_ids:
      isFieldVisible(group, 'utilities') && formData.features.length > 0
        ? formData.features
        : options.featureIdsWhenEmpty,
  };
}
