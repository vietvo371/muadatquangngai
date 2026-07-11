import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';

/**
 * GET /api/v2/search/suggest — port của SearchController@suggest (autocomplete).
 *
 * Laravel dùng Postgres FTS `to_tsvector('vietnamese', title||' '||address)` nhưng config
 * text-search 'vietnamese' KHÔNG có sẵn/không match ở DB này (endpoint thật luôn trả []),
 * và Supabase cũng không có config đó mặc định. Thay bằng ILIKE contains trên title+address
 * — CHỦ ĐÍCH cải thiện (autocomplete chạy thật thay vì luôn rỗng), disclose rõ. Trả raw
 * select id/title/slug/thumbnail/price/address giống Laravel (price decimal -> string).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();
  if (q.length < 2) return apiSuccess([]);

  const rows = await db.properties.findMany({
    where: {
      status: 'active',
      OR: [{ expired_at: null }, { expired_at: { gt: new Date() } }],
      published_at: { not: null },
      AND: [{ OR: [{ title: { contains: q, mode: 'insensitive' } }, { address: { contains: q, mode: 'insensitive' } }] }],
    },
    select: { id: true, title: true, slug: true, thumbnail: true, price: true, address: true },
    take: 8,
  });

  return apiSuccess(
    rows.map((p) => ({
      id: Number(p.id),
      title: p.title,
      slug: p.slug,
      thumbnail: p.thumbnail,
      price: String(p.price),
      address: p.address,
    }))
  );
}
