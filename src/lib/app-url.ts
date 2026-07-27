/**
 * Origin công khai của app — KHÔNG dùng `new URL(request.url).origin` trực tiếp vì VPS
 * chạy Next.js sau reverse proxy OpenLiteSpeed (.htaccess `[P]` sang 127.0.0.1:3002) không
 * set X-Forwarded-Host/Proto, nên `request.url` bị lộ ra origin nội bộ (localhost:3002)
 * thay vì domain thật — đã xác nhận qua lỗi redirect_uri_mismatch thật khi test OAuth.
 * Ưu tiên NEXT_PUBLIC_SITE_URL (đã đúng "https://muadatquangngai.com" trên VPS); chỉ
 * fallback về request origin khi biến này chưa set (dev local).
 */
export function getAppOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  return new URL(request.url).origin;
}
