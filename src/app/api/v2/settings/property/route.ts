import { db } from '@/lib/db';
import { apiSuccess } from '@/lib/api-response';

/**
 * GET /api/v2/settings/property
 *
 * Giới hạn media và nội dung cho form đăng tin (spec mục 7.1 "Cấu hình cần có").
 * Công khai vì form đăng tin cần đọc trước khi submit; đây chỉ là hằng số cấu hình,
 * không có dữ liệu nhạy cảm. Các nhóm setting khác vẫn nằm sau route admin.
 *
 * Trước đây property_images_limit / property_description_min có hiện trên trang cấu hình
 * admin nhưng không nơi nào đọc — sửa xong không có tác dụng gì.
 */

const DEFAULTS = {
  images_min: 5,
  images_limit: 50,
  image_max_size_mb: 10,
  image_min_width: 1280,
  image_formats: ['jpg', 'jpeg', 'png', 'webp'],
  video_limit: 2,
  video_max_size_mb: 100,
  description_min: 50,
};

function num(raw: string | null | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET() {
  const rows = await db.settings.findMany({
    where: { group: 'property' },
    select: { key: true, value: true },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const formatsRaw = map.get('property_image_formats');
  const formats = formatsRaw
    ? formatsRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    : DEFAULTS.image_formats;

  return apiSuccess({
    images_min: num(map.get('property_images_min'), DEFAULTS.images_min),
    images_limit: num(map.get('property_images_limit'), DEFAULTS.images_limit),
    image_max_size_mb: num(map.get('property_image_max_size_mb'), DEFAULTS.image_max_size_mb),
    image_min_width: num(map.get('property_image_min_width'), DEFAULTS.image_min_width),
    image_formats: formats.length > 0 ? formats : DEFAULTS.image_formats,
    video_limit: num(map.get('property_video_limit'), DEFAULTS.video_limit),
    video_max_size_mb: num(map.get('property_video_max_size_mb'), DEFAULTS.video_max_size_mb),
    description_min: num(map.get('property_description_min'), DEFAULTS.description_min),
  });
}
