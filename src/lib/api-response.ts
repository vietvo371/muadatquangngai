import { NextResponse } from 'next/server';

/**
 * Envelope JSON khớp 1:1 với `App\Http\Controllers\ApiController` (backend Laravel) —
 * đây là điều kiện bắt buộc của Giai đoạn 1 (strangler migration): FE không phải sửa
 * bất kỳ chỗ nào khi route được chuyển từ Laravel sang Next.js.
 */

// Prisma trả cột `bigint` (id, *_id) dạng BigInt — JSON.stringify mặc định throw khi gặp
// BigInt. Laravel/PHP tự hạ bigint thành số thường khi encode JSON nên ta làm tương tự
// (an toàn vì id trong app này không vượt Number.MAX_SAFE_INTEGER).
function bigIntSafeReplacer(_key: string, value: unknown) {
  return typeof value === 'bigint' ? Number(value) : value;
}

function jsonResponse(body: unknown, status: number) {
  return new NextResponse(JSON.stringify(body, bigIntSafeReplacer), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function apiSuccess(data: unknown = null, message: string | null = null, status = 200) {
  return jsonResponse({ success: true, message, data }, status);
}

// PHP mặc định `array $errors = []` — json_encode([]) ra `[]` (mảng), không phải `{}`
// (object) vì PHP không phân biệt mảng rỗng với object rỗng. Giữ default là mảng để
// khớp byte-for-byte với Laravel (đã verify qua curl thật: `"errors":[]`).
export function apiError(message: string | null = null, status = 400, errors: unknown = []) {
  return jsonResponse({ success: false, message, errors }, status);
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export function apiPaginated(items: unknown[], meta: PaginationMeta) {
  return jsonResponse({ success: true, data: items, meta }, 200);
}

/** Cùng công thức current_page/last_page/from/to như LengthAwarePaginator của Laravel. */
export function buildPaginationMeta(total: number, page: number, perPage: number): PaginationMeta {
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? null : (page - 1) * perPage + 1;
  const to = total === 0 ? null : Math.min(page * perPage, total);
  return { current_page: page, last_page: lastPage, per_page: perPage, total, from, to };
}
