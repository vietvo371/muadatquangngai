import { parseYoutubeId } from '@/components/shared/ImageUploader';

/**
 * Nhận diện nguồn video và lấy ảnh đại diện / link nhúng (Notion 06/10 "Thumbnail Media – Video").
 *
 * Ba nguồn đang hỗ trợ:
 *  - YouTube: ảnh đại diện lấy thẳng theo mã video, không cần khoá API.
 *  - Vimeo: Vimeo không có đường dẫn ảnh đoán được, phải hỏi dịch vụ oEmbed công khai của họ
 *    (cũng không cần khoá) — xem /api/v2/video-thumbnail.
 *  - File tải lên Cloudinary: đổi đuôi file sang .jpg là Cloudinary tự dựng khung hình đầu.
 * Nguồn khác (file mp4 ở nơi khác) thì không có ảnh — ô sẽ là nền tối kèm biểu tượng play.
 */

export type VideoSource = 'youtube' | 'vimeo' | 'file';

const VIMEO_PATTERNS = [
  /vimeo\.com\/(?:video\/)?(\d{6,12})/,
  /player\.vimeo\.com\/video\/(\d{6,12})/,
];

export function parseVimeoId(url: string): string | null {
  for (const re of VIMEO_PATTERNS) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export function videoSource(url: string): VideoSource {
  if (parseYoutubeId(url)) return 'youtube';
  if (parseVimeoId(url)) return 'vimeo';
  return 'file';
}

/** Ảnh đại diện video YouTube theo mã video. */
export function youtubeThumbnail(url: string): string | undefined {
  const id = parseYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined;
}

/** Khung hình đầu của video tải lên Cloudinary — đổi đuôi file sang .jpg. */
export function cloudinaryVideoFrame(url: string): string | undefined {
  if (!/^https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\//.test(url)) return undefined;
  return `${url.replace(/\.[A-Za-z0-9]+$/, '')}.jpg`;
}

/**
 * Ảnh đại diện lấy được NGAY, không phải gọi mạng. Vimeo trả undefined vì cần hỏi oEmbed —
 * nơi gọi tự quyết định có đi lấy thêm hay không.
 */
export function immediateVideoCover(video: { url: string; thumbnail?: string }): string | undefined {
  return (
    youtubeThumbnail(video.url) ??
    cloudinaryVideoFrame(video.url) ??
    // `thumbnail` của API rơi về chính đường dẫn video khi người đăng không tải ảnh riêng —
    // dùng thẳng thì ô video trống trơn, nên chỉ nhận khi nó thực sự khác đường dẫn video.
    (video.thumbnail && video.thumbnail !== video.url ? video.thumbnail : undefined)
  );
}

/**
 * Link nhúng để phát video. `autoplay` bật thì kèm luôn tắt tiếng, vì trình duyệt chặn tự phát
 * có tiếng — tắt tiếng là cách duy nhất để video chạy ngay khi mở, người xem bật tiếng lại
 * bằng nút trên trình phát.
 */
export function videoEmbedUrl(url: string, { autoplay = false } = {}): string | null {
  const youtubeId = parseYoutubeId(url);
  if (youtubeId) {
    const params = autoplay ? '?autoplay=1&mute=1&playsinline=1' : '?playsinline=1';
    return `https://www.youtube.com/embed/${youtubeId}${params}`;
  }
  const vimeoId = parseVimeoId(url);
  if (vimeoId) {
    const params = autoplay ? '?autoplay=1&muted=1&playsinline=1' : '?playsinline=1';
    return `https://player.vimeo.com/video/${vimeoId}${params}`;
  }
  return null;
}
