/**
 * Danh sách nhà cung cấp được phép nhúng bằng iframe (Notion 07/10 "Bảo mật / Embed").
 *
 * Mọi iframe có nguồn từ dữ liệu người dùng (link tour 360, video, HTML bài viết) đều phải qua
 * đây. Bắt buộc HTTPS: trang mình chạy HTTPS, nhúng http:// thì trình duyệt chặn khung, còn nếu
 * không chặn thì nội dung trong khung có thể bị tráo trên đường truyền.
 *
 * Muốn thêm nhà cung cấp mới: thêm tên miền vào đúng nhóm dưới đây, không nới lỏng ở chỗ khác.
 */

export const EMBED_PROVIDERS = {
  video: ['youtube.com', 'youtube-nocookie.com', 'player.vimeo.com'],
  tour360: ['matterport.com', 'kuula.co'],
  map: ['google.com', 'maps.google.com'],
} as const;

export type EmbedKind = keyof typeof EMBED_PROVIDERS;

/** Đường dẫn nhúng của Google Maps — tránh nhận mọi trang bất kỳ dưới google.com. */
const GOOGLE_MAP_PATH = /^\/maps(\/|$)|^\/maps\/embed/;

function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

/**
 * `kind` bỏ trống = chấp nhận mọi nhóm (dùng khi lọc HTML bài viết). Truyền `kind` khi biết
 * chắc ô đó chỉ được chứa một loại — vd. ô tour 360 không được nhận link YouTube.
 */
export function isAllowedEmbedUrl(raw: string, kind?: EmbedKind): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;

  const host = url.hostname.replace(/^www\./, '');
  const kinds = kind ? [kind] : (Object.keys(EMBED_PROVIDERS) as EmbedKind[]);

  return kinds.some((k) =>
    EMBED_PROVIDERS[k].some((domain) => {
      if (!hostMatches(host, domain)) return false;
      // google.com chỉ nhận đúng đường dẫn bản đồ.
      if (k === 'map' && domain === 'google.com') return GOOGLE_MAP_PATH.test(url.pathname);
      return true;
    })
  );
}
