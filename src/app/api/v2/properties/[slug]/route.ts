import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapPropertyResource } from '@/lib/api-resources/property-resource';

/** GET /api/v2/properties/[slug] — port của PropertyController@show (Laravel). */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const property = await db.properties.findFirst({
    // Chỉ scopeActive() — KHÔNG có scopePublished() (khác index(), đã đối chiếu code Laravel)
    where: { slug, status: 'active', OR: [{ expired_at: null }, { expired_at: { gt: new Date() } }] },
    include: {
      provinces: { select: { id: true, name: true, slug: true } },
      districts: { select: { id: true, name: true, slug: true } },
      categories: { select: { id: true, name: true, slug: true, icon: true } },
      users: {
        select: { id: true, name: true, phone: true, avatar: true, role: true, rating: true, total_listings: true },
      },
      property_media: {
        select: { id: true, type: true, image_type: true, url: true, thumbnail: true, caption: true, is_primary: true, sort_order: true },
      },
      property_features: { include: { features: { select: { id: true, name: true, icon: true } } } },
    },
  });

  if (!property) {
    return apiError('Không tìm thấy tin đăng.', 404);
  }

  const ward =
    property.ward_id !== null
      ? await db.wards.findUnique({ where: { id: property.ward_id }, select: { id: true, name: true, slug: true } })
      : null;

  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? null;
  const userAgent = request.headers.get('user-agent');

  // Giai đoạn 1 chưa nối auth nên luôn ghi property_views ở nhánh "khách vãng lai"
  // (user_id null) — giống hệt nhánh else trong PropertyController@show của Laravel.
  await Promise.all([
    db.properties.update({ where: { id: property.id }, data: { view_count: { increment: 1 } } }),
    db.property_views.create({
      data: { property_id: property.id, ip_address: ipAddress, user_agent: userAgent },
    }),
  ]);

  return apiSuccess(mapPropertyResource(property, ward));
}
