/**
 * API cũ của ô chọn Công ty/Sàn (Notion "API cũ broker-companies"): giữ tạm để trình duyệt còn mở
 * bản cũ không hỏng; ngừng phát triển. Dùng /api/v2/businesses (?selectable=1 cho ô chọn).
 */
export { GET, POST } from '../businesses/route';
