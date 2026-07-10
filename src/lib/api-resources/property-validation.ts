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
