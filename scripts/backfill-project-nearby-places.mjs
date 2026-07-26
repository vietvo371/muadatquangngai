/**
 * Tính latitude/longitude/nearby_places cho các dự án ĐÃ TỒN TẠI từ trước khi có tính năng
 * "tiện ích lân cận thật" (xem src/lib/nearby-places.ts, admin/projects routes). Chỉ chạy
 * cho project chưa có nearby_places — chạy lại nhiều lần an toàn, không ghi đè dữ liệu đã có.
 *
 * Dùng: npx tsx scripts/backfill-project-nearby-places.mjs [--apply]
 * Không có --apply thì chỉ in ra dự định, không ghi gì.
 */
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';
import { computeProjectLocationData } from '../src/lib/nearby-places.ts';

const APPLY = process.argv.includes('--apply');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// Lọc bằng JS thay vì Prisma `where: { nearby_places: { equals: null } }` — cột Json?
// phân biệt DbNull/JsonNull rất dễ nhầm, lọc tay cho chắc.
const allProjects = await db.projects.findMany({
  select: { id: true, name: true, address: true, nearby_places: true, provinces: { select: { name: true } } },
});
const projects = allProjects.filter((p) => p.nearby_places === null);

if (projects.length === 0) {
  console.log('Không có dự án nào cần backfill (đều đã có nearby_places).');
  await db.$disconnect();
  process.exit(0);
}

console.log(`Tìm thấy ${projects.length} dự án chưa có nearby_places.`);

for (const p of projects) {
  const fullAddress = `${p.address}, ${p.provinces.name}`;
  process.stdout.write(`- [${p.id}] ${p.name} — geocode "${fullAddress}"... `);

  const locationData = await computeProjectLocationData(fullAddress);
  if (!locationData) {
    console.log('KHÔNG geocode được, bỏ qua.');
    // Nghỉ giữa các request để tôn trọng rate-limit Nominatim (1 req/giây).
    await new Promise((r) => setTimeout(r, 3000));
    continue;
  }

  const counts = Object.entries(locationData.nearbyPlaces)
    .map(([k, v]) => `${k}=${v.length}`)
    .join(' ');
  console.log(`OK (${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}) ${counts}`);

  if (APPLY) {
    await db.projects.update({
      where: { id: p.id },
      data: {
        latitude: String(locationData.lat),
        longitude: String(locationData.lng),
        nearby_places: locationData.nearbyPlaces,
      },
    });
  }

  await new Promise((r) => setTimeout(r, 3000));
}

if (!APPLY) console.log('\n(Chạy thử — thêm --apply để thực sự lưu vào DB.)');
await db.$disconnect();
