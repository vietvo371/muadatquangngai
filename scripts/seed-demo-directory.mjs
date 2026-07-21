/**
 * Sinh dữ liệu demo cho danh bạ môi giới + doanh nghiệp + tin đăng, để xem trang danh bạ
 * trông thế nào khi có nhiều nội dung hơn 5 môi giới / 5 doanh nghiệp hiện có.
 *
 * KHÔNG lấy dữ liệu từ nguồn ngoài — mọi tên, số điện thoại, email đều tự sinh và rõ ràng
 * là giả (không gắn với người thật). Ảnh dùng picsum.photos (dịch vụ ảnh placeholder công
 * khai, đã whitelist sẵn trong next.config).
 *
 * CHỈ DÙNG CHO DEV/DEMO LOCAL — không tự chạy trên production. Đổi DATABASE_URL trong
 * .env.local nếu vô tình trỏ production thì script sẽ dừng lại hỏi trước.
 *
 * Dùng: npx tsx scripts/seed-demo-directory.mjs [--agents=10] [--agencies=5] [--apply]
 * Không có --apply thì chỉ in dự định, không ghi gì.
 */
import 'dotenv/config';
import crypto from 'node:crypto';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.slice(2).split('=');
    return [k, v ?? true];
  })
);
const APPLY = args.apply === true;
const N_AGENTS = Number(args.agents ?? 10);
const N_AGENCIES = Number(args.agencies ?? 5);
const PROPS_PER_AGENT = Number(args.properties ?? 4);

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// Chốt an toàn: không cho chạy nếu DATABASE_URL trỏ tới host Supabase (production/staging).
// Sửa danh sách này nếu bạn có staging riêng cần loại trừ thêm.
const dbUrl = process.env.DATABASE_URL ?? '';
if (/supabase\.co|supabase\.com/.test(dbUrl)) {
  console.error('DATABASE_URL đang trỏ tới Supabase — script này chỉ chạy trên DB local. Dừng lại.');
  process.exit(1);
}

const FAMILY_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Đặng', 'Bùi'];
const MIDDLE_NAMES = ['Văn', 'Thị', 'Hữu', 'Minh', 'Ngọc', 'Đức', 'Thanh', 'Quốc', 'Kim', 'Xuân'];
const GIVEN_NAMES = ['An', 'Bình', 'Cường', 'Dũng', 'Giang', 'Hà', 'Khang', 'Linh', 'Nam', 'Oanh', 'Phúc', 'Quân', 'Sơn', 'Trang', 'Uyên', 'Vy'];

const AGENCY_WORDS = ['Đất Vàng', 'Sông Trà', 'Thiên Ấn', 'Phú Gia', 'Việt Phát', 'An Khang', 'Miền Trung', 'Núi Ấn', 'Hưng Thịnh', 'Tân Phát'];
const AGENCY_SUFFIX = ['Land', 'Real Estate', 'Địa Ốc', 'BĐS'];

const PROPERTY_TYPES = ['sell', 'rent'];
const PRICE_UNIT_BY_TYPE = { sell: 'total', rent: 'per_month' };

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomName() {
  return `${pick(FAMILY_NAMES)} ${pick(MIDDLE_NAMES)} ${pick(GIVEN_NAMES)}`;
}
function randomPhone() {
  // Đúng định dạng số di động VN: 10 chữ số, bắt đầu bằng 0. Không cần khớp đầu số nhà
  // mạng thật — uniquePhone() bên dưới đảm bảo không đụng số đã có trong DB.
  return '0' + String(randomInt(100000000, 999999999));
}
function slugify(s) {
  return s
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd')
    .toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

async function uniquePhone() {
  for (let i = 0; i < 20; i++) {
    const phone = randomPhone();
    const exists = await db.users.findUnique({ where: { phone }, select: { id: true } });
    if (!exists) return phone;
  }
  throw new Error('Không sinh được số điện thoại chưa dùng sau 20 lần thử.');
}

async function uniqueSlug(base) {
  let slug = base;
  for (let i = 2; await db.agencies.findUnique({ where: { slug }, select: { id: true } }); i++) {
    slug = `${base}-${i}`;
  }
  return slug;
}

const categories = await db.categories.findMany({ where: { type: 'sell' }, select: { id: true } });
const districts = await db.districts.findMany({ select: { id: true } });
const province = await db.provinces.findFirst({ select: { id: true } });

if (categories.length === 0 || districts.length === 0 || !province) {
  console.error('Thiếu categories/districts/provinces trong DB — chạy migrate/seed cơ bản trước.');
  process.exit(1);
}

console.log(`Dự định tạo: ${N_AGENTS} môi giới, ${N_AGENCIES} doanh nghiệp, ~${N_AGENTS * PROPS_PER_AGENT} tin đăng.\n`);

const plan = { agents: [], agencies: [] };

const usedAgencyNames = new Set();
for (let i = 0; i < N_AGENCIES; i++) {
  // Tránh trùng tên trong cùng lượt sinh — kiểm tra DB không bắt được trùng nội bộ vì
  // chưa ghi gì lúc đang lập kế hoạch (dry-run) hoặc chưa insert xong (khi --apply).
  let name;
  do {
    name = `${pick(AGENCY_WORDS)} ${pick(AGENCY_SUFFIX)}`;
  } while (usedAgencyNames.has(name) && usedAgencyNames.size < AGENCY_WORDS.length * AGENCY_SUFFIX.length);
  usedAgencyNames.add(name);
  plan.agencies.push({ name, slug: await uniqueSlug(slugify(name)), district_id: pick(districts).id });
}

for (let i = 0; i < N_AGENTS; i++) {
  const name = randomName();
  plan.agents.push({
    name,
    email: `demo.agent.${Date.now()}.${i}@seed.local`,
    phone: await uniquePhone(),
    district_id: pick(districts).id,
    agency: Math.random() < 0.7 && plan.agencies.length > 0 ? pick(plan.agencies) : null,
  });
}

plan.agents.forEach((a) => console.log(`  môi giới: ${a.name} (${a.phone}) -> ${a.agency?.name ?? 'không thuộc công ty nào'}`));
plan.agencies.forEach((a) => console.log(`  doanh nghiệp: ${a.name} (/${a.slug})`));

if (!APPLY) {
  console.log('\n(chạy thử — thêm --apply để ghi thật vào DB local)');
  await db.$disconnect();
  process.exit(0);
}

const now = new Date();

const createdAgencies = new Map();
for (const a of plan.agencies) {
  const row = await db.agencies.create({
    data: {
      name: a.name,
      slug: a.slug,
      district_id: a.district_id,
      province_id: province.id,
      is_active: true,
      is_verified: Math.random() < 0.3,
      created_at: now,
      updated_at: now,
    },
  });
  createdAgencies.set(a.name, row.id);
}

const passwordHash = crypto.createHash('sha256').update('demo-seed-not-a-real-login').digest('hex');

let totalProperties = 0;
for (const a of plan.agents) {
  const user = await db.users.create({
    data: {
      uuid: crypto.randomUUID(),
      name: a.name,
      email: a.email,
      // Không phải hash bcrypt thật — tài khoản demo này không dùng để đăng nhập. Nếu cần
      // đăng nhập thử, đặt lại mật khẩu qua luồng quên mật khẩu như bình thường.
      password: passwordHash,
      phone: a.phone,
      role: 'agent',
      status: 'active',
      district_id: a.district_id,
      province_id: province.id,
      agency_id: a.agency ? createdAgencies.get(a.agency.name) : null,
      agency_name: a.agency?.name ?? null,
      rating: (Math.random() * 2 + 3).toFixed(2), // 3.00–5.00, giống khoảng của dữ liệu thật
      created_at: now,
      updated_at: now,
    },
  });

  const propsForThisAgent = randomInt(0, PROPS_PER_AGENT * 2); // lệch quanh mức trung bình
  for (let p = 0; p < propsForThisAgent; p++) {
    const category = pick(categories);
    const district = pick(districts);
    const type = pick(PROPERTY_TYPES);
    const area = randomInt(35, 200);
    const price = type === 'sell' ? randomInt(800, 15000) * 1_000_000 : randomInt(3, 40) * 1_000_000;
    const title = `${type === 'sell' ? 'Bán' : 'Cho thuê'} nhà đất demo #${totalProperties + 1}`;

    await db.properties.create({
      data: {
        uuid: crypto.randomUUID(),
        slug: `${slugify(title)}-${crypto.randomBytes(3).toString('hex')}`,
        user_id: user.id,
        category_id: category.id,
        type,
        status: 'active',
        title,
        // Đủ dài để qua validate mô tả tối thiểu 50 ký tự của form đăng tin thật.
        description: `Tin đăng demo dùng để xem thử giao diện danh bạ, không phải bất động sản có thật. Diện tích ${area}m², khu vực demo. Dữ liệu này chỉ tồn tại trên máy phát triển, không đưa lên production.`,
        price: String(price),
        price_unit: PRICE_UNIT_BY_TYPE[type],
        area: String(area),
        province_id: province.id,
        district_id: district.id,
        address: 'Địa chỉ demo, không có thật',
        thumbnail: `https://picsum.photos/seed/demo-prop-${totalProperties}/800/600`,
        published_at: now,
        created_at: now,
        updated_at: now,
        property_media: {
          create: [
            {
              type: 'image',
              url: `https://picsum.photos/seed/demo-prop-${totalProperties}/800/600`,
              is_primary: true,
              sort_order: 0,
              created_at: now,
              updated_at: now,
            },
          ],
        },
      },
    });
    totalProperties++;
  }

  await db.users.update({ where: { id: user.id }, data: { total_listings: propsForThisAgent } });
}

console.log(`\nXong: ${plan.agencies.length} doanh nghiệp, ${plan.agents.length} môi giới, ${totalProperties} tin đăng.`);
await db.$disconnect();
