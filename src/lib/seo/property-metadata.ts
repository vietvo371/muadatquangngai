import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { SITE_NAME, absoluteUrl, propertyPath } from '@/lib/site';
import { formatPrice } from '@/lib/formatters';
import type { PropertyJsonLdInput } from '@/components/seo';

/**
 * Metadata + dữ liệu JSON-LD cho trang chi tiết tin đăng.
 *
 * Trước đây mọi trang `[slug]` đều là client component không có generateMetadata, nên HÀNG TRĂM
 * tin dùng chung đúng một title/description của layout — Google coi là nội dung trùng lặp và gần
 * như không xếp hạng được tin nào. Hàm này dựng title/description/canonical/OG riêng cho từng tin.
 *
 * Truy vấn Prisma trực tiếp (đang chạy phía server) thay vì gọi API qua HTTP — nhanh hơn và
 * không dính lỗi baseURL rỗng như sitemap cũ từng mắc.
 */

export interface PropertySeo {
  meta: Metadata;
  jsonLd: PropertyJsonLdInput | null;
  /**
   * True khi CHẮC CHẮN không có tin nào khớp slug (để trang trả HTTP 404 thật).
   * Lỗi kết nối DB tạm thời KHÔNG bật cờ này — 404 lúc đó sẽ khiến Google gỡ URL của tin
   * đang sống chỉ vì một sự cố thoáng qua.
   */
  notFound: boolean;
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

export async function getPropertySeo(slug: string, expectedType: 'sell' | 'rent'): Promise<PropertySeo> {
  let dbFailed = false;
  const property = await db.properties
    .findFirst({
      where: {
        slug,
        status: 'active',
        published_at: { not: null },
        OR: [{ expired_at: null }, { expired_at: { gt: new Date() } }],
      },
      select: {
        title: true, slug: true, type: true, price: true, price_unit: true, area: true,
        description: true, address: true, street: true, thumbnail: true,
        latitude: true, longitude: true, bedrooms: true, bathrooms: true,
        districts: { select: { name: true } },
        provinces: { select: { name: true } },
      },
    })
    .catch(() => {
      dbFailed = true;
      return null;
    });

  // Không có tin (slug sai/hết hạn) → noindex để Google không giữ URL rỗng trong index.
  if (!property) {
    return {
      meta: {
        title: 'Không tìm thấy tin đăng',
        robots: { index: false, follow: true },
      },
      jsonLd: null,
      notFound: !dbFailed,
    };
  }

  const price = Number(property.price) || 0;
  const area = Number(property.area) || 0;
  const area_ = area > 0 ? `${area} m²` : '';
  const place = [property.districts?.name, property.provinces?.name].filter(Boolean).join(', ');
  const priceText = price > 0 ? formatPrice(price, property.price_unit) : 'Giá thoả thuận';

  const title = clean(`${property.title}${place ? ` - ${place}` : ''}`).slice(0, 110);
  const description = clean(
    property.description
      ? property.description.slice(0, 200)
      : `${property.title}. ${[priceText, area_].filter(Boolean).join(' · ')}${place ? ` tại ${place}` : ''}. Xem chi tiết, hình ảnh và liên hệ chủ tin trên ${SITE_NAME}.`
  ).slice(0, 300);

  const path = propertyPath(property.type ?? expectedType, property.slug);
  const image = property.thumbnail ? absoluteUrl(property.thumbnail) : undefined;

  return {
    meta: {
      title,
      description,
      alternates: { canonical: path },
      openGraph: {
        title,
        description,
        type: 'article',
        url: absoluteUrl(path),
        locale: 'vi_VN',
        siteName: SITE_NAME,
        ...(image ? { images: [{ url: image, alt: property.title }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    },
    notFound: false,
    jsonLd: {
      title: property.title,
      slug: property.slug,
      type: property.type,
      price,
      area: area || null,
      address: property.address ?? property.street,
      description: property.description,
      images: property.thumbnail ? [property.thumbnail] : [],
      latitude: property.latitude != null ? Number(property.latitude) : null,
      longitude: property.longitude != null ? Number(property.longitude) : null,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
    },
  };
}
