import { NextResponse } from 'next/server';

/**
 * Mô phỏng format lỗi 422 mặc định của Laravel's ValidationException — đã đối chiếu
 * qua curl thật:
 *   1 lỗi:  {"message": "<msg>.", "errors": {"field": ["<msg>."]}}
 *   N lỗi:  {"message": "<msg đầu tiên theo thứ tự field khai báo>. (and {N-1} more
 *            error[s])", "errors": {"field1": [...], "field2": [...], ...}}
 * KHÁC với ApiController::error() (dùng cho lỗi 4xx/5xx nghiệp vụ khác) — endpoint
 * validate bằng FormRequest luôn trả đúng shape này, không qua ApiController.
 */
export class FieldError {
  constructor(
    readonly field: string,
    readonly message: string
  ) {}
}

export function validationErrorResponse(errors: FieldError[]): NextResponse {
  const grouped: Record<string, string[]> = {};
  for (const e of errors) {
    (grouped[e.field] ??= []).push(e.message);
  }

  const first = errors[0];
  const extra = errors.length - 1;
  const message = extra > 0 ? `${first.message} (and ${extra} more error${extra > 1 ? 's' : ''})` : first.message;

  return new NextResponse(JSON.stringify({ message, errors: grouped }), {
    status: 422,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

// ── Validator nhỏ, gọn — đủ dùng cho các rule Laravel cần replicate ở auth/property ──

export const required = (value: unknown): boolean => value !== undefined && value !== null && value !== '';
export const isString = (value: unknown): value is string => typeof value === 'string';
export const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const minLen = (value: string, n: number): boolean => value.length >= n;
export const maxLen = (value: string, n: number): boolean => value.length <= n;
export const isNumeric = (value: unknown): boolean => typeof value === 'number' && Number.isFinite(value);
export const isInteger = (value: unknown): boolean => typeof value === 'number' && Number.isInteger(value);
export const isBoolean = (value: unknown): boolean => typeof value === 'boolean';
export const inList = (value: unknown, list: readonly string[]): boolean => typeof value === 'string' && list.includes(value);
