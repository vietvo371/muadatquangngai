/**
 * API client cho các trang công khai (Notion 07/10 "API Client").
 *
 * Bọc quanh instance axios sẵn có (src/lib/axios.ts) để giữ nguyên phần gắn token và xử lý
 * 401, rồi thêm ba thứ còn thiếu:
 *
 *  1. Hết giờ: mặc định 12 giây. Trước đây một yêu cầu treo là trang quay vòng mãi.
 *  2. Huỷ: truyền `signal` của AbortController — rời trang hoặc đổi tab thì huỷ yêu cầu cũ,
 *     không để kết quả về muộn ghi đè lên dữ liệu mới.
 *  3. Gộp yêu cầu trùng: hai component cùng xin một GET y hệt cùng lúc thì chỉ gửi một lần.
 *
 * Mọi lỗi đều quy về MỘT dạng `ApiError { code, message, status }` — nơi gọi không phải tự
 * mò `err.response?.data?.message` theo từng kiểu phản hồi khác nhau nữa.
 */

import axios, { type AxiosRequestConfig } from 'axios';
import api from '@/lib/axios';

/** 12 giây — nằm giữa khoảng 10–15 giây yêu cầu. */
export const DEFAULT_TIMEOUT_MS = 12_000;

export type ApiErrorCode =
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'ABORTED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

/** Câu hiển thị mặc định khi máy chủ không gửi kèm lời nhắn dùng được. */
const DEFAULT_MESSAGES: Record<ApiErrorCode, string> = {
  TIMEOUT: 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.',
  NETWORK_ERROR: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.',
  ABORTED: 'Yêu cầu đã bị huỷ.',
  UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  FORBIDDEN: 'Bạn không có quyền xem nội dung này.',
  NOT_FOUND: 'Không tìm thấy nội dung.',
  VALIDATION_ERROR: 'Dữ liệu gửi lên chưa hợp lệ.',
  RATE_LIMITED: 'Bạn thao tác quá nhanh. Vui lòng đợi một chút.',
  SERVER_ERROR: 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.',
  UNKNOWN: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number | null;

  constructor(code: ApiErrorCode, message: string, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }

  /** Dạng chuẩn `{ error: { code, message } }` theo yêu cầu. */
  toJSON() {
    return { error: { code: this.code, message: this.message } };
  }

  /** Lỗi tạm thời, bấm thử lại có thể được. Lỗi 404/403 thì thử lại cũng vô ích. */
  get isRetryable(): boolean {
    return ['TIMEOUT', 'NETWORK_ERROR', 'SERVER_ERROR', 'RATE_LIMITED'].includes(this.code);
  }
}

function codeFromStatus(status: number): ApiErrorCode {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 422 || status === 400) return 'VALIDATION_ERROR';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'SERVER_ERROR';
  return 'UNKNOWN';
}

/**
 * Lấy lời nhắn từ thân phản hồi. API của dự án trả hai kiểu: `{ success: false, message }`
 * (đa số route) và `{ error: { code, message } }` — nhận cả hai.
 */
function messageFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as { message?: unknown; error?: { message?: unknown } };
  const msg = typeof b.error?.message === 'string' ? b.error.message : b.message;
  return typeof msg === 'string' && msg.trim() ? msg.trim() : null;
}

/** Bất kỳ lỗi nào → ApiError. Đã là ApiError thì trả nguyên. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isCancel(error) || (error as { name?: string })?.name === 'CanceledError') {
    return new ApiError('ABORTED', DEFAULT_MESSAGES.ABORTED);
  }

  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError('TIMEOUT', DEFAULT_MESSAGES.TIMEOUT);
    }
    if (!error.response) {
      return new ApiError('NETWORK_ERROR', DEFAULT_MESSAGES.NETWORK_ERROR);
    }
    const status = error.response.status;
    const code = codeFromStatus(status);
    return new ApiError(code, messageFromBody(error.response.data) ?? DEFAULT_MESSAGES[code], status);
  }

  return new ApiError('UNKNOWN', DEFAULT_MESSAGES.UNKNOWN);
}

export interface RequestOptions {
  params?: Record<string, unknown>;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Tắt gộp yêu cầu trùng cho một lần gọi cụ thể (vd. nút "Tải lại" bắt buộc gọi mới). */
  dedupe?: boolean;
}

/** GET đang bay, theo khoá url + tham số. Xong (thành công hay lỗi) là xoá khỏi đây. */
const inFlight = new Map<string, Promise<unknown>>();

function requestKey(url: string, params?: Record<string, unknown>): string {
  if (!params) return url;
  const sorted = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort()
    .map((k) => `${k}=${String(params[k])}`)
    .join('&');
  return sorted ? `${url}?${sorted}` : url;
}

/**
 * GET trả về `data` của phản hồi (phần thân JSON). Lỗi luôn ném ApiError.
 *
 * Lưu ý gộp yêu cầu: các nơi gọi chung một yêu cầu nhận chung một kết quả, nên một nơi huỷ
 * (`signal`) KHÔNG được làm huỷ luôn nơi kia — yêu cầu có `signal` vì thế không gộp.
 */
export async function apiGet<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
  const { params, signal, timeoutMs = DEFAULT_TIMEOUT_MS, dedupe = true } = options;
  const config: AxiosRequestConfig = { params, signal, timeout: timeoutMs };

  const canShare = dedupe && !signal;
  const key = requestKey(url, params);
  if (canShare) {
    const existing = inFlight.get(key);
    if (existing) return existing as Promise<T>;
  }

  const promise = api
    .get<T>(url, config)
    .then((res) => res.data)
    .catch((error: unknown) => {
      throw toApiError(error);
    })
    .finally(() => {
      if (canShare) inFlight.delete(key);
    });

  if (canShare) inFlight.set(key, promise);
  return promise;
}

/** POST/PUT/PATCH/DELETE — không bao giờ gộp, vì gửi hai lần là có chủ đích. */
export async function apiSend<T = unknown>(
  method: 'post' | 'put' | 'patch' | 'delete',
  url: string,
  body?: unknown,
  options: Omit<RequestOptions, 'dedupe'> = {}
): Promise<T> {
  const { params, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  try {
    const res = await api.request<T>({ method, url, data: body, params, signal, timeout: timeoutMs });
    return res.data;
  } catch (error) {
    throw toApiError(error);
  }
}
