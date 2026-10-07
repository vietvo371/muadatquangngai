import { db } from '@/lib/db';
import { FieldError } from '@/lib/validation';

/**
 * Port của rule `feature_ids => nullable|array` + `feature_ids.* => integer|exists:features,id`
 * (StorePropertyRequest/UpdatePropertyRequest) — thiếu ở lần port đầu, phát hiện qua code
 * review: gửi feature_ids không hợp lệ trước đây rơi thẳng vào BigInt()/insert FK thay vì
 * trả 422 sạch như Laravel. Message format verify qua curl thật — field gốc `feature_ids`
 * bị humanize thành "feature ids", nhưng field wildcard `feature_ids.{i}` giữ nguyên dạng
 * chấm, không humanize.
 */
export async function validateFeatureIds(featureIds: unknown): Promise<FieldError[]> {
  if (featureIds === undefined || featureIds === null) return [];

  if (!Array.isArray(featureIds)) {
    return [new FieldError('feature_ids', 'Trường feature ids phải là một mảng.')];
  }

  const errors: FieldError[] = [];
  const numericIds: number[] = [];
  featureIds.forEach((value, index) => {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      errors.push(new FieldError(`feature_ids.${index}`, `Trường feature_ids.${index} phải là số nguyên.`));
    } else {
      numericIds.push(value);
    }
  });
  if (errors.length > 0) return errors;

  if (numericIds.length > 0) {
    const existing = await db.features.findMany({ where: { id: { in: numericIds.map((n) => BigInt(n)) } }, select: { id: true } });
    const existingSet = new Set(existing.map((f) => f.id.toString()));
    featureIds.forEach((value, index) => {
      if (!existingSet.has(String(value))) {
        errors.push(new FieldError(`feature_ids.${index}`, `Giá trị đã chọn trong trường feature_ids.${index} không hợp lệ.`));
      }
    });
  }

  return errors;
}

/**
 * `project_id` — tin thuộc dự án nào (không bắt buộc). Rỗng/null = không thuộc dự án nào.
 *
 * Chỉ nhận dự án đang hiển thị công khai, để người đăng không gắn tin vào dự án nháp hay đã
 * ẩn. Ngoại lệ: khi sửa tin, giữ nguyên dự án đang gắn sẵn thì luôn hợp lệ — dự án đó có bị ẩn
 * sau này cũng không được làm hỏng việc sửa các trường khác của tin.
 */
export async function resolveProjectId(
  raw: unknown,
  { currentProjectId = null }: { currentProjectId?: bigint | null } = {}
): Promise<{ projectId: bigint | null; error: FieldError | null }> {
  if (raw === undefined || raw === null || raw === '') return { projectId: null, error: null };

  const text = typeof raw === 'number' ? String(raw) : typeof raw === 'string' ? raw.trim() : '';
  if (!/^\d{1,18}$/.test(text)) {
    return { projectId: null, error: new FieldError('project_id', 'Dự án đã chọn không hợp lệ.') };
  }
  const id = BigInt(text);
  if (currentProjectId !== null && id === currentProjectId) return { projectId: id, error: null };

  const { PROJECT_ACTIVE_EXCLUDED_STATUSES } = await import('@/lib/api-resources/project-status');
  const project = await db.projects.findFirst({
    where: { id, deleted_at: null, status: { notIn: PROJECT_ACTIVE_EXCLUDED_STATUSES } },
    select: { id: true },
  });
  return project
    ? { projectId: project.id, error: null }
    : { projectId: null, error: new FieldError('project_id', 'Dự án đã chọn không tồn tại hoặc đã ngừng hiển thị.') };
}
