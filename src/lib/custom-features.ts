/**
 * Tiện ích người đăng tự nhập, lưu riêng theo từng tin (Notion 06/10 "Đăng tin / Chỉnh sửa tin
 * – Tiện ích tùy chỉnh").
 *
 * KHÔNG ghi vào bảng `features` dùng chung: một người gõ sai chính tả là cả website nhìn thấy,
 * và danh sách tiện ích mặc định sẽ phình ra mất kiểm soát. Lưu thẳng vào cột JSON
 * `properties.custom_features` (xem prisma/sql/2026-10-07-08-custom-features.sql).
 */

export const CUSTOM_FEATURE_MAX_LENGTH = 50;
export const CUSTOM_FEATURE_MAX_COUNT = 20;

/**
 * Làm sạch danh sách gửi lên: bỏ khoảng trắng thừa, bỏ rỗng, cắt theo độ dài tối đa, bỏ trùng
 * (không phân biệt hoa thường) và giới hạn số lượng. Dữ liệu sai kiểu trả về mảng rỗng chứ
 * không báo lỗi — tiện ích là phần không bắt buộc, không đáng để chặn cả tin đăng.
 */
export function normalizeCustomFeatures(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of input) {
    if (typeof item !== 'string') continue;
    const name = item.trim().replace(/\s+/g, ' ').slice(0, CUSTOM_FEATURE_MAX_LENGTH);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(name);
    if (result.length >= CUSTOM_FEATURE_MAX_COUNT) break;
  }
  return result;
}

/** Đọc giá trị từ DB (cột Json) ra mảng chuỗi để trả cho client. */
export function readCustomFeatures(value: unknown): string[] {
  return normalizeCustomFeatures(value);
}
