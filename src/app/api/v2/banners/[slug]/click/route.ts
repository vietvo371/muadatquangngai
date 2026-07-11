import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/** POST /api/v2/banners/[slug]/click — port của BannerController@trackClick (tăng click_count theo slug). */
export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const banner = await db.banners.findFirst({ where: { slug, deleted_at: null }, select: { id: true } });
  if (!banner) return NextResponse.json({ success: false, message: 'Không tìm thấy banner.' }, { status: 404 });

  await db.banners.update({ where: { id: banner.id }, data: { click_count: { increment: 1 } } });
  return NextResponse.json({ success: true });
}
