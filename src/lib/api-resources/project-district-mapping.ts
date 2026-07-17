/**
 * Fallback: suy luận district_id từ address text khi client không gửi district_id kèm
 * theo (chỉ dùng ở route tạo mới, xem admin/projects/route.ts POST). Sau sáp nhập 2025,
 * tỉnh chỉ còn 96 xã/phường/đặc khu (id = 10000 + mã khoa, xem prisma/seed-data/qn-96-units.json)
 * — id cũ (627-641, huyện/thị xã) đã bị xoá khỏi bảng districts, KHÔNG được dùng lại.
 */
const DISTRICT_KEYWORDS: Array<{ keywords: string[]; id: bigint }> = [
  { keywords: ['tư nghĩa'], id: BigInt(10123) }, // Xã Tư Nghĩa
  { keywords: ['sơn tịnh'], id: BigInt(10127) }, // Xã Sơn Tịnh
  { keywords: ['bình sơn'], id: BigInt(10117) }, // Xã Bình Sơn
  { keywords: ['đức phổ'], id: BigInt(10129) }, // Phường Đức Phổ
  { keywords: ['mộ đức'], id: BigInt(10119) }, // Xã Mộ Đức
  { keywords: ['nghĩa hành', 'chợ chùa'], id: BigInt(10122) }, // Xã Nghĩa Hành
  { keywords: ['lý sơn'], id: BigInt(10124) }, // Đặc khu Lý Sơn
  { keywords: ['trà bồng'], id: BigInt(10128) }, // Xã Trà Bồng
];

const DEFAULT_DISTRICT_ID = BigInt(10113); // Phường Cẩm Thành (trung tâm TP Quảng Ngãi cũ)

export function mapDistrictFromAddress(address: string): bigint {
  const addr = address.toLowerCase();
  for (const { keywords, id } of DISTRICT_KEYWORDS) {
    if (keywords.some((kw) => addr.includes(kw))) return id;
  }
  return DEFAULT_DISTRICT_ID;
}
