import DOMPurify from 'isomorphic-dompurify';

// Dùng để render HTML từ RichTextEditor (mô tả dự án) ra trang public qua
// dangerouslySetInnerHTML — PHẢI sanitize, vì HTML này do admin nhập tự do (chèn ảnh/link).
// Chỉ cho phép các thẻ/thuộc tính mà editor thực sự tạo ra.
export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'img', 'br'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel', 'class'],
  });
}
