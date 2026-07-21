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
 * Pháp lý — 6 mục theo spec. Giữ nguyên giá trị cũ (so_do, contract, other) và chỉ
 * THÊM giá trị mới, để tin đăng đã tồn tại không bị hỏng.
 */
export const LEGAL_OPTIONS: readonly SelectOption[] = [
  { value: 'so_do', label: 'Sổ đỏ/Sổ hồng' },
  { value: 'contract', label: 'Hợp đồng mua bán' },
  { value: 'dat_coc', label: 'Hợp đồng đặt cọc' },
  { value: 'viet_tay', label: 'Giấy tờ viết tay' },
  { value: 'cho_so', label: 'Đang chờ cấp sổ' },
  { value: 'other', label: 'Pháp lý khác' },
];

/** Giá trị cũ không còn trong form nhưng vẫn tồn tại trong DB — chỉ dùng để hiển thị. */
const LEGACY_LEGAL_LABELS: Record<string, string> = { so_hong: 'Sổ hồng' };

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

/** Đơn vị giá — spec bổ sung "Thoả thuận" bên cạnh Tổng giá và Giá/m². */
export const PRICE_UNIT_OPTIONS: readonly SelectOption[] = [
  { value: 'total', label: 'Tổng giá' },
  { value: 'per_m2', label: 'Giá/m²' },
  { value: 'negotiable', label: 'Thoả thuận' },
];

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
