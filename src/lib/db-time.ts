/**
 * Thời gian ghi xuống DB.
 *
 * Quy ước của dự án (kế thừa từ Laravel, `app.timezone = Asia/Ho_Chi_Minh`): các cột
 * `timestamp` KHÔNG có múi giờ và chứa **giờ Việt Nam thô**. Tầng trả JSON dựa hẳn vào đó —
 * `toVietnamIso8601()` lấy nguyên digit trong DB rồi gắn hậu tố `+07:00`.
 *
 * Khi port sang Next.js, viết `created_at: new Date()` là SAI: Prisma ghi biểu diễn UTC của
 * thời điểm đó, nên digit trong DB lùi 7 tiếng so với quy ước. Hậu quả không phải lỗi kỹ thuật
 * mà là thứ người dùng nhìn thấy: bản ghi vừa tạo hiện "7 giờ trước".
 *
 * Đã kiểm chứng: một dòng `reports` tạo lúc 05:41:50 giờ VN bị lưu thành `22:41:50` ngày hôm
 * trước, và giao diện quản trị hiển thị "7 giờ trước".
 *
 * LƯU Ý khi dùng: đã lấy mốc thời gian bằng `dbNow()` thì mọi phép so sánh với cột thời gian
 * cũng phải lấy từ `dbNow()`. Trộn `dbNow()` với `new Date()` trong cùng một truy vấn sẽ lệch
 * 7 tiếng và làm hỏng các cửa sổ thời gian (chống trùng, hết hạn, idempotency).
 */

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** "Bây giờ" theo đúng định dạng mà DB đang lưu (giờ Việt Nam thô). */
export function dbNow(): Date {
  return new Date(Date.now() + VN_OFFSET_MS);
}

/** Mốc lùi về quá khứ tính từ `dbNow()` — dùng cho các cửa sổ chống trùng / hết hạn. */
export function dbAgo(ms: number): Date {
  return new Date(dbNow().getTime() - ms);
}
