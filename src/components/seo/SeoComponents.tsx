'use client';

import { useEffect } from 'react';
import Head from 'next/head';

interface SeoMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  noIndex?: boolean;
}

interface JsonLdProps {
  data: Record<string, unknown>;
}

interface PropertyJsonLdProps {
  property: {
    id: number;
    title: string;
    slug: string;
    price: number;
    priceType: 'rent' | 'sell';
    address: string;
    latitude?: number;
    longitude?: number;
    images: string[];
    description: string;
  };
}

const SITE_NAME = 'BatDongSan Quang Ngai';
const DEFAULT_DESCRIPTION = 'Bat dong san Quang Ngai - Mua ban, cho thue nha dat, can ho, dat nen. Tin tuc bat dong san, gia nha dat, du an noi bat.';
const DEFAULT_OG_IMAGE = '/images/og-image.jpg';

export function SeoMetadata({
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
  canonical,
  noIndex = false,
}: SeoMetadata) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const metaImage = ogImage || DEFAULT_OG_IMAGE;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      {canonical && <meta property="og:url" content={canonical} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* No Index */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Head>
  );
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
    </Head>
  );
}

export function WebsiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://batdongsanquangngai.vn',
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL}/tim-kiem?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return <JsonLd data={data} />;
}

export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://batdongsanquangngai.vn',
    logo: `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+84-901-234-567',
      contactType: 'customer service',
      availableLanguage: 'Vietnamese',
    },
    sameAs: [
      'https://facebook.com/batdongsanquangngai',
      'https://zalo.me/batdongsanquangngai',
    ],
  };

  return <JsonLd data={data} />;
}

export function PropertyJsonLd({ property }: PropertyJsonLdProps) {
  const priceString = property.priceType === 'rent'
    ? `${property.price} VND/tháng`
    : `${property.price} VND`;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/tin-dang/${property.slug}`,
    image: property.images,
    ...(property.latitude && property.longitude
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: property.latitude,
            longitude: property.longitude,
          },
        }
      : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: 'Quang Ngai',
      addressCountry: 'VN',
    },
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'VND',
      availability: 'https://schema.org/InStock',
    },
  };

  return <JsonLd data={data} />;
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={data} />;
}

export function FAQJsonLd({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return <JsonLd data={data} />;
}
