import type { FloorPlanRow } from '@/components/admin/FloorPlansEditor';

// Shape lưu trong cột projects.floor_plans (Json) — area luôn có hậu tố "m²" để khớp định
// dạng dữ liệu mẫu cũ (vd. "120m²") mà trang public / ProjectLivePreview đang parse bằng
// parseFloat(). visible cho phép Admin ẩn tạm 1 loại mặt bằng mà không mất dữ liệu đã nhập.
export interface StoredFloorPlan {
  type: string;
  area: string;
  count: number;
  priceFrom: number;
  visible: boolean;
}

/** Form state (input đang gõ dở) -> shape lưu DB. Bỏ qua dòng chưa nhập tên hoặc diện tích. */
export function toStoredFloorPlans(rows: FloorPlanRow[]): StoredFloorPlan[] {
  return rows
    .filter((r) => r.type.trim() && r.area !== '' && Number(r.area) > 0)
    .map((r) => ({
      type: r.type.trim(),
      area: `${r.area}m²`,
      count: r.count === '' ? 0 : Number(r.count),
      priceFrom: r.priceFrom === '' ? 0 : Number(r.priceFrom),
      visible: r.visible,
    }));
}

/** Shape lưu DB -> form state (mở trang Sửa dự án). */
export function fromStoredFloorPlans(stored: unknown): FloorPlanRow[] {
  if (!Array.isArray(stored)) return [];
  return stored.map((item, i) => {
    const r = item as Partial<StoredFloorPlan>;
    return {
      id: `fp-${i}-${Math.random().toString(36).slice(2, 7)}`,
      type: typeof r.type === 'string' ? r.type : '',
      area: typeof r.area === 'string' || typeof r.area === 'number' ? parseFloat(String(r.area)) || '' : '',
      count: typeof r.count === 'number' ? r.count : '',
      priceFrom: typeof r.priceFrom === 'number' ? r.priceFrom : '',
      visible: r.visible !== false,
    };
  });
}

/** Chỉ các mặt bằng đang bật hiển thị — dùng ở trang public + preview. */
export function visibleFloorPlans<T extends { visible?: boolean }>(plans: T[] | null | undefined): T[] {
  if (!Array.isArray(plans)) return [];
  return plans.filter((p) => p.visible !== false);
}

/** Diện tích nhỏ nhất trong các mặt bằng đang hiển thị — dùng tính "Đơn giá tự tính". */
export function minFloorPlanArea(plans: Array<{ area: string; visible?: boolean }> | null | undefined): number {
  const areas = visibleFloorPlans(plans)
    .map((p) => parseFloat(p.area))
    .filter((n) => !isNaN(n) && n > 0);
  return areas.length > 0 ? Math.min(...areas) : 0;
}
