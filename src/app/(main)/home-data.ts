import { db } from '@/lib/db';
import { mapPropertyResource, loadWardsMap } from '@/lib/api-resources/property-resource';
import { mapProjectResource } from '@/lib/api-resources/project-resource';
import { fetchPublishedPosts, POST_TYPE_LABEL } from '@/lib/api-resources/post-list';
import { timeAgo, formatDate } from '@/lib/formatters';
import { vipRank } from '@/lib/vip';

/**
 * Data fetcher phía server cho trang chủ — thay toàn bộ mảng hardcode cũ bằng dữ liệu thật
 * từ DB (Prisma). Tái dùng đúng where-clause + resource mapper của các route /api/v2/*
 * để card hiển thị nhất quán với trang danh sách/chi tiết.
 *
 * Ảnh mặc định khi tin/dự án chưa có thumbnail — dùng file tĩnh có sẵn trong /public để
 * next/image không vỡ (fill cần src hợp lệ).
 */
const FALLBACK_IMAGE = '/images/og-default.jpg';

/* ─────────────────────── PROPERTIES (BĐS dành cho bạn) ─────────────────────── */

// Sao chép nguyên trạng từ src/app/api/v2/properties/route.ts để card trang chủ khớp
// shape trang danh sách.
const PROPERTY_INCLUDE = {
  provinces: { select: { id: true, name: true, slug: true } },
  districts: { select: { id: true, name: true, slug: true } },
  categories: { select: { id: true, name: true, slug: true, icon: true } },
  users: { select: { id: true, name: true, phone: true, avatar: true, role: true, rating: true, total_listings: true } },
  property_media: {
    select: { id: true, type: true, image_type: true, url: true, thumbnail: true, caption: true, is_primary: true, sort_order: true },
  },
} as const;

// vipRank dùng chung ở src/lib/vip.ts — tin hết hạn gói tự về Tin thường.

export interface ListingCardData {
  id: number;
  title: string;
  price: string;
  area: string;
  address: string;
  postedAt: string;
  image: string;
  href: string;
  category?: string;
}

async function fetchListingsByType(type: 'sell' | 'rent', limit: number): Promise<ListingCardData[]> {
  const rows = await db.properties.findMany({
    // scopeActive() + scopePublished(): giống hệt route /api/v2/properties.
    where: {
      status: 'active',
      OR: [{ expired_at: null }, { expired_at: { gt: new Date() } }],
      published_at: { not: null },
      type,
    },
    include: PROPERTY_INCLUDE,
  });

  // Sort mặc định "newest": rank VIP (diamond>vip_plus>vip>normal) rồi published_at desc.
  rows.sort((a, b) => {
    const rankDiff = vipRank(a.is_vip, a.vip_expired_at) - vipRank(b.is_vip, b.vip_expired_at);
    if (rankDiff !== 0) return rankDiff;
    return (b.published_at?.getTime() ?? 0) - (a.published_at?.getTime() ?? 0);
  });

  const top = rows.slice(0, limit);
  const wardMap = await loadWardsMap(top);

  return top.map((row) => {
    const r = mapPropertyResource(
      row,
      row.ward_id !== null ? (wardMap.get(row.ward_id.toString()) ?? null) : null
    );
    const image = r.thumbnail_url ?? r.media?.[0]?.url ?? FALLBACK_IMAGE;
    return {
      id: Number(r.id),
      title: r.title,
      price: r.price > 0 ? r.price_formatted : 'Thỏa thuận',
      area: r.area > 0 ? `${r.area.toLocaleString('vi-VN')}m²` : '',
      address: r.address,
      postedAt: r.published_at ? timeAgo(r.published_at) : '',
      image,
      href: `/${r.type === 'sell' ? 'mua-ban' : 'cho-thue'}/${r.slug}`,
      category: r.category?.name,
    };
  });
}

export async function getHomeListings(): Promise<{ sale: ListingCardData[]; rent: ListingCardData[] }> {
  const [sale, rent] = await Promise.all([fetchListingsByType('sell', 8), fetchListingsByType('rent', 8)]);
  return { sale, rent };
}

/* ─────────────────────── PROJECTS (Dự án nổi bật) ─────────────────────── */

export interface ProjectCardData {
  id: number;
  name: string;
  area: string;
  address: string;
  status: string;
  image: string;
  slug: string;
  developer?: string;
}

export async function getFeaturedProjects(limit = 6): Promise<ProjectCardData[]> {
  const rows = await db.projects.findMany({
    // Chỉ dự án hiển thị công khai: loại draft (ẩn) + paused/archived (scopeActive loại).
    where: { status: { notIn: ['draft', 'paused', 'archived'] } },
    orderBy: { created_at: 'desc' },
    take: limit,
    include: {
      provinces: { select: { id: true, name: true } },
      districts: { select: { id: true, name: true } },
      users_projects_user_idTousers: { select: { id: true, name: true, avatar: true } },
      users_projects_agent_idTousers: { select: { id: true, name: true, avatar: true, phone: true } },
    },
  });

  const wardIds = [...new Set(rows.map((r) => r.ward_id).filter((id): id is bigint => id !== null))];
  const wards = wardIds.length
    ? await db.wards.findMany({ where: { id: { in: wardIds } }, select: { id: true, name: true } })
    : [];
  const wardMap = new Map(wards.map((w) => [w.id.toString(), w]));

  return rows.map((row) => {
    const p = mapProjectResource(row, row.ward_id !== null ? (wardMap.get(row.ward_id.toString()) ?? null) : null);
    const totalArea = p.scale.total_area;
    const address = p.location.address || [p.location.district?.name, p.location.province?.name].filter(Boolean).join(', ');
    return {
      id: Number(p.id),
      name: p.name,
      // scale.total_area lưu theo HA (Haus Coastal 93.9, De Palace 1.6) — không phải m².
      area: totalArea && totalArea > 0 ? `${totalArea.toLocaleString('vi-VN')} ha` : '',
      address,
      status: p.status_label,
      image: p.thumbnail ?? FALLBACK_IMAGE,
      slug: p.slug,
      developer: p.developer ?? undefined,
    };
  });
}

/* ─────────────────────── AGENCIES (Doanh nghiệp tiêu biểu) ─────────────────────── */

export interface PartnerData {
  name: string;
  logo: string;
}

export async function getPartners(limit = 12): Promise<PartnerData[]> {
  const rows = await db.agencies.findMany({
    // Lọc bỏ dữ liệu demo (is_demo) — chỉ doanh nghiệp thật, đang hoạt động, có logo.
    where: { is_active: true, is_demo: false, logo: { not: null } },
    select: { id: true, name: true, logo: true },
    orderBy: { created_at: 'desc' },
    take: limit,
  });

  // where đã ràng buộc logo not null → an toàn ép kiểu string.
  return rows.map((a) => ({ name: a.name, logo: a.logo as string }));
}

/* ─────────────────────── POSTS (Tin tức) ─────────────────────── */

export interface HomeNewsItem {
  id: number;
  title: string;
  category: string;
  date: string;
  image: string;
  href: string;
  excerpt?: string;
}

export async function getHomeNews(limit = 7): Promise<HomeNewsItem[]> {
  const posts = await fetchPublishedPosts(limit);

  return posts.map((post) => ({
    id: Number(post.id),
    title: post.title,
    category: post.post_categories?.name ?? POST_TYPE_LABEL[post.type] ?? post.type,
    date: post.published_at ? formatDate(post.published_at) : '',
    image: post.thumbnail ?? FALLBACK_IMAGE,
    href: `/tin-tuc/${post.slug}`,
    excerpt: post.excerpt ?? undefined,
  }));
}
