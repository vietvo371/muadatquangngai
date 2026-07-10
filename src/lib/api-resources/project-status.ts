// Đối chiếu 1:1 với backend/app/Enums/ProjectStatus.php — KHÔNG đổi các giá trị này
// mà không đổi cả 2 nơi, để BE Laravel và BE Next.js luôn trả cùng nhãn/trạng thái.

const LABELS: Record<string, string> = {
  draft: 'Bản nháp',
  upcoming: 'Sắp mở bán',
  selling: 'Đang mở bán',
  paused: 'Tạm dừng',
  completed: 'Đã bàn giao',
  archived: 'Đã lưu trữ',
};

const HIDDEN_STATUSES = new Set(['draft', 'archived']);

export function projectStatusLabel(status: string): string {
  return LABELS[status] ?? status;
}

export function projectStatusVisible(status: string): boolean {
  return !HIDDEN_STATUSES.has(status);
}

/** Tương ứng Project::scopeActive() — loại paused và archived. */
export const PROJECT_ACTIVE_EXCLUDED_STATUSES = ['paused', 'archived'];
