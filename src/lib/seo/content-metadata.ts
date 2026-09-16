import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL, absoluteUrl } from '@/lib/site';

/**
 * Metadata cho 4 nhóm trang công khai còn lại: dự án, tin tức, doanh nghiệp, môi giới.
 *
 * Đợt SEO 31/07 mới chỉ làm cho tin đăng bán/thuê (`property-metadata.ts`). Bốn nhóm này vẫn là
 * client component KHÔNG có metadata, nên mọi dự án dùng chung một `<title>`, mọi bài viết dùng
 * chung một `<title>`... trong khi `sitemap.ts` lại khai đủ slug của chúng cho Google. Tức là
 * mình chủ động dẫn Google vào hàng chục URL trùng tiêu đề — tệ hơn là không khai.
 *
 * Cùng khuôn với `property-metadata.ts`: mỗi hàm trả `meta` để `generateMetadata` dùng, cờ
 * `notFound` để trang trả 404 THẬT, và `dbFailed` để phân biệt "không có bản ghi" với "DB lỗi".
 * Phân biệt này quan trọng: lỗi DB tạm thời mà trả 404 thì Google gỡ URL khỏi index oan.
 */

const DESCRIPTION_MAX = 160;

/** Cắt mô tả cho vừa ô kết quả tìm kiếm, cắt theo từ chứ không cắt giữa chữ. */
function trimDescription(raw: string | null | undefined, fallback: string): string {
  const text = (raw ?? '')
    .replace(/<[^>]*>/g, ' ') // mô tả có thể chứa HTML từ trình soạn thảo
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return fallback;
  if (text.length <= DESCRIPTION_MAX) return text;
  const cut = text.slice(0, DESCRIPTION_MAX);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** Ảnh OG: ưu tiên ảnh thật của bản ghi, không có thì dùng ảnh mặc định của site. */
function ogImage(image: string | null | undefined): string {
  if (!image) return SITE_OG_IMAGE;
  return image.startsWith('http') ? image : absoluteUrl(image);
}

interface SeoResult<T> {
  meta: Metadata;
  data: T | null;
  notFound: boolean;
  dbFailed: boolean;
}

function buildMeta(opts: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: 'website' | 'article';
  publishedTime?: Date | null;
  modifiedTime?: Date | null;
}): Metadata {
  const url = absoluteUrl(opts.path);
  const image = ogImage(opts.image);

  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE_NAME,
      type: opts.type ?? 'website',
      locale: 'vi_VN',
      images: [{ url: image }],
      ...(opts.publishedTime ? { publishedTime: opts.publishedTime.toISOString() } : {}),
      ...(opts.modifiedTime ? { modifiedTime: opts.modifiedTime.toISOString() } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
      images: [image],
    },
  };
}

/** Metadata tối thiểu khi không tìm thấy bản ghi — kèm noindex để Google không giữ URL rác. */
function notFoundMeta(label: string): Metadata {
  return {
    title: `Không tìm thấy ${label}`,
    robots: { index: false, follow: false },
  };
}

// ── Dự án ────────────────────────────────────────────────────────────────────

export interface ProjectSeoData {
  slug: string;
  name: string;
  description: string | null;
  address: string;
  thumbnail: string | null;
  updated_at: Date | null;
}

export async function getProjectSeo(slug: string): Promise<SeoResult<ProjectSeoData>> {
  let row: ProjectSeoData | null = null;
  let dbFailed = false;

  try {
    row = await db.projects.findFirst({
      where: { slug },
      select: { slug: true, name: true, description: true, address: true, thumbnail: true, updated_at: true },
    });
  } catch (error) {
    console.error('[seo] Không đọc được dự án cho metadata:', error);
    dbFailed = true;
  }

  if (!row) {
    return {
      meta: dbFailed ? { title: 'Dự án bất động sản' } : notFoundMeta('dự án'),
      data: null,
      notFound: !dbFailed,
      dbFailed,
    };
  }

  return {
    meta: buildMeta({
      title: `${row.name} — ${row.address}`,
      description: trimDescription(
        row.description,
        `Thông tin dự án ${row.name} tại ${row.address}: vị trí, quy mô, tiện ích và các sản phẩm đang mở bán.`,
      ),
      path: `/du-an/${row.slug}`,
      image: row.thumbnail,
      modifiedTime: row.updated_at,
    }),
    data: row,
    notFound: false,
    dbFailed: false,
  };
}

// ── Tin tức ──────────────────────────────────────────────────────────────────

export interface PostSeoData {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  thumbnail: string | null;
  published_at: Date | null;
  updated_at: Date | null;
}

export async function getPostSeo(slug: string): Promise<SeoResult<PostSeoData>> {
  let row: PostSeoData | null = null;
  let dbFailed = false;

  try {
    row = await db.posts.findFirst({
      // Bài nháp không được lọt ra ngoài: chưa publish thì coi như không tồn tại.
      where: { slug, status: 'published' },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        thumbnail: true,
        published_at: true,
        updated_at: true,
      },
    });
  } catch (error) {
    console.error('[seo] Không đọc được bài viết cho metadata:', error);
    dbFailed = true;
  }

  if (!row) {
    return {
      meta: dbFailed ? { title: 'Tin tức bất động sản' } : notFoundMeta('bài viết'),
      data: null,
      notFound: !dbFailed,
      dbFailed,
    };
  }

  return {
    meta: buildMeta({
      title: row.title,
      // Không có tóm tắt thì lấy phần đầu nội dung — vẫn là chữ THẬT trên trang, không bịa.
      description: trimDescription(row.excerpt || row.content, `Bài viết ${row.title}`),
      path: `/tin-tuc/${row.slug}`,
      image: row.thumbnail,
      type: 'article',
      publishedTime: row.published_at,
      modifiedTime: row.updated_at,
    }),
    data: row,
    notFound: false,
    dbFailed: false,
  };
}

// ── Doanh nghiệp ─────────────────────────────────────────────────────────────

export interface AgencySeoData {
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  logo: string | null;
  updated_at: Date | null;
}

export async function getAgencySeo(slug: string): Promise<SeoResult<AgencySeoData>> {
  let row: AgencySeoData | null = null;
  let dbFailed = false;

  try {
    row = await db.agencies.findFirst({
      where: { slug },
      select: { slug: true, name: true, description: true, address: true, logo: true, updated_at: true },
    });
  } catch (error) {
    console.error('[seo] Không đọc được doanh nghiệp cho metadata:', error);
    dbFailed = true;
  }

  if (!row) {
    return {
      meta: dbFailed ? { title: 'Doanh nghiệp bất động sản' } : notFoundMeta('doanh nghiệp'),
      data: null,
      notFound: !dbFailed,
      dbFailed,
    };
  }

  const place = row.address ? ` tại ${row.address}` : ' tại Quảng Ngãi';

  return {
    meta: buildMeta({
      title: row.name,
      description: trimDescription(
        row.description,
        `${row.name} — doanh nghiệp bất động sản${place}. Xem thông tin liên hệ và các tin đăng đang có.`,
      ),
      path: `/doanh-nghiep/${row.slug}`,
      image: row.logo,
      modifiedTime: row.updated_at,
    }),
    data: row,
    notFound: false,
    dbFailed: false,
  };
}

// ── Môi giới ─────────────────────────────────────────────────────────────────

export interface AgentSeoData {
  id: bigint;
  name: string;
  bio: string | null;
  avatar: string | null;
  address: string | null;
  agency_name: string | null;
  updated_at: Date | null;
}

export async function getAgentSeo(id: string): Promise<SeoResult<AgentSeoData>> {
  // Route dùng id số. Chuỗi lạ thì trả 404 luôn, khỏi đụng DB.
  if (!/^\d+$/.test(id)) {
    return { meta: notFoundMeta('môi giới'), data: null, notFound: true, dbFailed: false };
  }

  let row: AgentSeoData | null = null;
  let dbFailed = false;

  try {
    row = await db.users.findFirst({
      // Chỉ môi giới đang hoạt động mới có trang công khai — khớp bộ lọc của /api/v2/agents.
      where: { id: BigInt(id), role: 'agent', status: 'active' },
      select: {
        id: true,
        name: true,
        bio: true,
        avatar: true,
        address: true,
        agency_name: true,
        updated_at: true,
      },
    });
  } catch (error) {
    console.error('[seo] Không đọc được môi giới cho metadata:', error);
    dbFailed = true;
  }

  if (!row) {
    return {
      meta: dbFailed ? { title: 'Môi giới bất động sản' } : notFoundMeta('môi giới'),
      data: null,
      notFound: !dbFailed,
      dbFailed,
    };
  }

  const company = row.agency_name ? ` — ${row.agency_name}` : '';
  const place = row.address ? ` tại ${row.address}` : ' tại Quảng Ngãi';

  return {
    meta: buildMeta({
      title: `Môi giới ${row.name}${company}`,
      description: trimDescription(
        row.bio,
        `Hồ sơ môi giới bất động sản ${row.name}${place}. Xem đánh giá và các tin đăng đang có.`,
      ),
      path: `/moi-gioi/${row.id}`,
      image: row.avatar,
      modifiedTime: row.updated_at,
    }),
    data: row,
    notFound: false,
    dbFailed: false,
  };
}

/** Dùng cho JSON-LD Article ở trang tin tức. */
export { SITE_URL };
