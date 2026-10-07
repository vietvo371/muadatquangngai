import DOMPurify from 'isomorphic-dompurify';
import { isAllowedEmbedUrl } from '@/lib/embed-allowlist';

/**
 * Lọc HTML trước khi đổ ra trang bằng dangerouslySetInnerHTML (Notion 07/10 "Bảo mật / Embed").
 *
 * Mọi nội dung người dùng nhập mà đi qua dangerouslySetInnerHTML đều PHẢI qua file này. Token
 * đăng nhập nằm trong localStorage, nên chỉ một đoạn <script> lọt qua là đọc được token của
 * bất kỳ ai mở trang đó — kể cả admin.
 */

/** Mã hoá ký tự đặc biệt để chuỗi được hiện ra như CHỮ, không bao giờ thành thẻ HTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Văn bản thường có định dạng tối giản (mô tả tin đăng): chỉ hỗ trợ **in đậm**. Mã hoá TOÀN BỘ
 * trước rồi mới dựng lại thẻ <strong>, nên người đăng gõ thẻ HTML gì cũng chỉ hiện ra thành
 * chữ — không có cách nào chèn mã chạy được.
 */
export function renderPlainWithBold(line: string): string {
  return escapeHtml(line).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

const SAFE_LINK_PROTOCOL = /^(https?:|mailto:|tel:|\/|#)/i;

/**
 * Hook chạy trên từng thẻ: bỏ iframe ngoài danh sách nhà cung cấp được duyệt, bỏ link có giao
 * thức lạ (javascript:, data:...), và ép link mở tab mới phải kèm rel="noopener noreferrer"
 * để trang bên kia không điều khiển ngược được trang mình qua window.opener.
 */
function hardenElement(node: Element) {
  if (node.tagName === 'IFRAME') {
    const src = node.getAttribute('src') ?? '';
    if (!isAllowedEmbedUrl(src)) {
      node.remove();
      return;
    }
    // Nhúng chỉ tải khi cuộn tới, không chặn phần còn lại của trang.
    node.setAttribute('loading', 'lazy');
    node.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  }

  if (node.tagName === 'A') {
    const href = node.getAttribute('href') ?? '';
    if (href && !SAFE_LINK_PROTOCOL.test(href.trim())) node.removeAttribute('href');
    if (node.getAttribute('target') === '_blank') node.setAttribute('rel', 'noopener noreferrer');
  }
}

function sanitizeWith(html: string, config: Parameters<typeof DOMPurify.sanitize>[1]): string {
  // Hook gắn vào instance DOMPurify dùng chung, nên gắn rồi gỡ ngay trong cùng một lượt chạy
  // đồng bộ — không để rò sang các lời gọi sanitize khác.
  DOMPurify.addHook('afterSanitizeAttributes', hardenElement);
  try {
    return String(DOMPurify.sanitize(html, config));
  } finally {
    DOMPurify.removeHook('afterSanitizeAttributes');
  }
}

/**
 * HTML từ RichTextEditor (mô tả dự án): chỉ cho phép các thẻ/thuộc tính mà editor thực sự
 * tạo ra.
 */
export function sanitizeRichText(html: string): string {
  return sanitizeWith(html, {
    ALLOWED_TAGS: ['p', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'img', 'br'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel', 'class'],
  });
}

/**
 * Bài viết tin tức: rộng hơn mô tả dự án (bảng, trích dẫn, tiêu đề nhiều cấp, video nhúng)
 * nhưng vẫn chặn script, thuộc tính sự kiện (onerror, onclick...) và iframe lạ.
 */
export function sanitizeArticle(html: string): string {
  return sanitizeWith(html, {
    ALLOWED_TAGS: [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 's', 'mark',
      'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'br', 'hr', 'blockquote',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'iframe', 'sub', 'sup',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'width', 'height',
      'colspan', 'rowspan', 'allow', 'allowfullscreen', 'frameborder', 'loading',
    ],
    ADD_TAGS: ['iframe'],
  });
}
