/**
 * Chuẩn hoá chuỗi tiếng Việt để so khớp tên địa danh.
 *
 * Dùng khi đối chiếu tên từ nguồn ngoài (OpenStreetMap) với tên trong DB: hai bên có thể
 * khác nhau về dấu, chữ hoa/thường, khoảng trắng thừa, hoặc cách viết "đ"/"d".
 */
export function normalizeName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Bỏ tiền tố cấp hành chính để so phần lõi của tên: "Phường Nghĩa Lộ" → "nghia lo".
 *
 * Cần thiết vì OSM và DB không thống nhất có kèm tiền tố hay không — cùng một nơi có thể là
 * "Phường Nghĩa Lộ" ở bên này và "Nghĩa Lộ" ở bên kia.
 */
export function stripAdminPrefix(s: string): string {
  return normalizeName(s).replace(
    /^(phuong|xa|dac khu|thi tran|quan|huyen|thanh pho|tinh|tp)\s+/,
    ''
  );
}
