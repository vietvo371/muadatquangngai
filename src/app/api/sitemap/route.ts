import { NextResponse } from 'next/server';
import api from '@/lib/axios';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://batdongsanquangngai.vn';

export async function GET() {
  const baseUrl = SITE_URL;

  // Fetch data from backend
  let properties: Array<{ slug: string; updated_at: string }> = [];
  let projects: Array<{ slug: string; updated_at: string }> = [];

  try {
    const [propertiesRes, projectsRes] = await Promise.all([
      api.get('/api/v2/properties', { params: { limit: 1000 } }),
      api.get('/api/v2/projects', { params: { limit: 1000 } }),
    ]);

    properties = propertiesRes.data?.data || [];
    projects = projectsRes.data?.data || [];
  } catch (error) {
    console.error('Sitemap fetch error:', error);
  }

  const staticPages: Array<{ url: string; lastmod?: string; priority: string; changefreq: string }> = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/mua-ban', priority: '0.9', changefreq: 'daily' },
    { url: '/cho-thue', priority: '0.9', changefreq: 'daily' },
    { url: '/du-an', priority: '0.8', changefreq: 'weekly' },
    { url: '/tin-tuc', priority: '0.7', changefreq: 'daily' },
    { url: '/lien-he', priority: '0.6', changefreq: 'monthly' },
  ];

  const propertyPages = properties.map((p) => ({
    url: `/tin-dang/${p.slug}`,
    priority: '0.7',
    changefreq: 'weekly',
    lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
  }));

  const projectPages = projects.map((p) => ({
    url: `/du-an/${p.slug}`,
    priority: '0.7',
    changefreq: 'weekly',
    lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
  }));

  const allPages = [...staticPages, ...propertyPages, ...projectPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
