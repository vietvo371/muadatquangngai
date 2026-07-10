/**
 * Port của phần suy luận district_id từ address text trong
 * AdminProjectController@store/@update (Laravel dùng mb_strtolower + str_contains).
 * Danh sách id/từ khóa copy nguyên văn, chỉ đổi thứ tự if/else sang mảng để dễ đọc —
 * thứ tự kiểm tra PHẢI giữ nguyên vì "nghĩa hành"/"chợ chùa" đứng trước "trà bồng" v.v.
 * ảnh hưởng đến match đầu tiên khi address chứa nhiều từ khóa.
 */
const DISTRICT_KEYWORDS: Array<{ keywords: string[]; id: bigint }> = [
  { keywords: ['tư nghĩa'], id: BigInt(634) },
  { keywords: ['sơn tịnh'], id: BigInt(631) },
  { keywords: ['bình sơn'], id: BigInt(628) },
  { keywords: ['đức phổ'], id: BigInt(636) },
  { keywords: ['mộ đức'], id: BigInt(639) },
  { keywords: ['nghĩa hành', 'chợ chùa'], id: BigInt(635) },
  { keywords: ['lý sơn'], id: BigInt(641) },
  { keywords: ['trà bồng'], id: BigInt(629) },
];

const DEFAULT_DISTRICT_ID = BigInt(627); // TP Quảng Ngãi

export function mapDistrictFromAddress(address: string): bigint {
  const addr = address.toLowerCase();
  for (const { keywords, id } of DISTRICT_KEYWORDS) {
    if (keywords.some((kw) => addr.includes(kw))) return id;
  }
  return DEFAULT_DISTRICT_ID;
}
