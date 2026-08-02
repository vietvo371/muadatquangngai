import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, absoluteUrl, propertyPath } from '@/lib/site';

/**
 * Dữ liệu có cấu trúc (JSON-LD) cho Google.
 *
 * Bản trước của file này KHÔNG chạy được và cũng chưa được dùng ở đâu:
 * - Bọc thẻ <script> trong `next/head` — đó là API của Pages Router, trong App Router nó không
 *   render ra gì cả. App Router chỉ cần render thẳng thẻ <script type="application/ld+json">.
 * - Hardcode tên miền chết `batdongsanquangngai.vn` và URL tin đăng `/tin-dang/{slug}` (404).
 * - Khai số điện thoại "+84-901-234-567" cùng Facebook/Zalo bịa — khai thông tin sai cho Google
 *   là rủi ro thật, nên đã bỏ; chỉ khai lại khi có thông tin liên hệ thật.
 *
 * Các component dưới đây là server component (không 'use client') để JSON-LD nằm sẵn trong HTML
 * lần đầu — đúng thứ crawler đọc.
 */

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Dữ liệu do mình tự dựng từ DB, không phải input người dùng thô; vẫn chặn `<` để không
      // thể đóng sớm thẻ script nếu tiêu đề tin có ký tự lạ.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export function WebsiteJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        inLanguage: 'vi-VN',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/mua-ban?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl('/images/logo.png'),
        areaServed: { '@type': 'AdministrativeArea', name: 'Quảng Ngãi' },
      }}
    />
  );
}

export interface PropertyJsonLdInput {
  title: string;
  slug: string;
  type: string | null;
  price: number;
  area?: number | null;
  address?: string | null;
  description?: string | null;
  images?: string[];
  latitude?: number | null;
  longitude?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
}

export function PropertyJsonLd({ property }: { property: PropertyJsonLdInput }) {
  const isRent = property.type === 'rent';
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: property.title,
        ...(property.description ? { description: property.description.slice(0, 500) } : {}),
        url: absoluteUrl(propertyPath(property.type, property.slug)),
        ...(property.images?.length ? { image: property.images.map((i) => absoluteUrl(i)) } : {}),
        ...(property.latitude != null && property.longitude != null
          ? { geo: { '@type': 'GeoCoordinates', latitude: property.latitude, longitude: property.longitude } }
          : {}),
        address: {
          '@type': 'PostalAddress',
          ...(property.address ? { streetAddress: property.address } : {}),
          addressRegion: 'Quảng Ngãi',
          addressCountry: 'VN',
        },
        ...(property.area
          ? { floorSize: { '@type': 'QuantitativeValue', value: property.area, unitCode: 'MTK' } }
          : {}),
        ...(property.bedrooms ? { numberOfBedrooms: property.bedrooms } : {}),
        ...(property.bathrooms ? { numberOfBathroomsTotal: property.bathrooms } : {}),
        ...(property.price > 0
          ? {
              offers: {
                '@type': 'Offer',
                price: property.price,
                priceCurrency: 'VND',
                availability: 'https://schema.org/InStock',
                ...(isRent ? { businessFunction: 'https://schema.org/LeaseOut' } : {}),
              },
            }
          : {}),
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: absoluteUrl(item.url),
        })),
      }}
    />
  );
}
