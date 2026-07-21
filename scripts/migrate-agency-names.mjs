/**
 * Chuyển `users.agency_name` (ô chữ tự do) thành bản ghi trong bảng `agencies`.
 *
 * Gộp theo tên đã chuẩn hoá (bỏ dấu, thường hoá) để hai môi giới gõ lệch dấu vẫn về cùng
 * một doanh nghiệp. Cột `agency_name` cũ giữ nguyên — không xoá gì.
 *
 * Chạy được nhiều lần: doanh nghiệp đã tồn tại thì dùng lại, user đã có agency_id thì bỏ qua.
 *
 * Dùng: npx tsx scripts/migrate-agency-names.mjs [--apply]
 * Không có --apply thì chỉ in ra dự định, không ghi gì.
 */
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';

const APPLY = process.argv.includes('--apply');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const normalize = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd')
    .toLowerCase().replace(/\s+/g, ' ').trim();

const slugify = (s) =>
  normalize(s).replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 200);

const users = await db.users.findMany({
  where: { agency_name: { not: null }, agency_id: null },
  select: { id: true, name: true, agency_name: true, district_id: true, province_id: true, phone: true },
});

if (users.length === 0) {
  console.log('Không có user nào cần chuyển (đều đã có agency_id hoặc không có agency_name).');
  await db.$disconnect();
  process.exit(0);
}

// Gộp user theo tên công ty đã chuẩn hoá.
const groups = new Map();
for (const u of users) {
  const key = normalize(u.agency_name);
  if (!groups.has(key)) groups.set(key, { display: u.agency_name.trim(), users: [] });
  groups.get(key).users.push(u);
}

console.log(`${users.length} user -> ${groups.size} doanh nghiệp\n`);

for (const [key, g] of groups) {
  // Khu vực và điện thoại lấy từ user đầu tiên có dữ liệu — chỉ là giá trị khởi tạo, admin
  // sửa lại sau trong trang quản lý doanh nghiệp.
  const seed = g.users.find((u) => u.district_id) ?? g.users[0];
  let slug = slugify(g.display);

  const existing = await db.agencies.findFirst({
    where: { OR: [{ slug }, { name: g.display }] },
    select: { id: true, name: true },
  });

  console.log(`  "${g.display}" (slug: ${slug})`);
  console.log(`     ${existing ? `dùng lại doanh nghiệp #${Number(existing.id)}` : 'tạo mới'}`);
  g.users.forEach((u) => console.log(`     gán user#${Number(u.id)} ${u.name}`));

  if (!APPLY) continue;

  let agencyId = existing?.id;
  if (!agencyId) {
    // Slug phải là duy nhất — thêm hậu tố nếu đụng.
    let candidate = slug;
    for (let i = 2; await db.agencies.findUnique({ where: { slug: candidate }, select: { id: true } }); i++) {
      candidate = `${slug}-${i}`;
    }
    const created = await db.agencies.create({
      data: {
        name: g.display,
        slug: candidate,
        district_id: seed.district_id,
        province_id: seed.province_id,
        phone: seed.phone,
        is_active: true,
        is_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: { id: true },
    });
    agencyId = created.id;
  }

  await db.users.updateMany({
    where: { id: { in: g.users.map((u) => u.id) } },
    data: { agency_id: agencyId },
  });
}

if (!APPLY) {
  console.log('\n(chạy thử — thêm --apply để ghi thật)');
} else {
  const n = await db.agencies.count();
  const linked = await db.users.count({ where: { agency_id: { not: null } } });
  console.log(`\nXong: ${n} doanh nghiệp, ${linked} user đã gán.`);
}

await db.$disconnect();
