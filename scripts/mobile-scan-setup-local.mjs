// Dựng dữ liệu thử trên bản chạy LOCAL cho bộ quét giao diện khu đăng nhập:
// đăng ký một tài khoản thử + đăng một tin thử, lưu thông tin vào scripts/mobile-scan.local.json
// (đã .gitignore). Chỉ chạy với localhost — từ chối mọi địa chỉ khác để không bao giờ tạo
// tài khoản hay tin rác trên production.
//   BASE=http://localhost:3001 node scripts/mobile-scan-setup-local.mjs
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:3001';
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) {
  console.error('Chỉ chạy với localhost.');
  process.exit(1);
}
const FILE = new URL('./mobile-scan.local.json', import.meta.url);

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
  return json;
}

let saved = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : null;

if (!saved) {
  const email = `quet-giao-dien-${randomBytes(3).toString('hex')}@example.test`;
  const password = randomBytes(12).toString('base64url');
  const reg = await api('/api/v2/auth/register', {
    method: 'POST',
    body: { name: 'Quét Giao Diện', email, password, password_confirmation: password, phone: '0901000111' },
  });
  saved = { email, password, userId: reg.data?.user?.id ?? null };
  writeFileSync(FILE, JSON.stringify(saved, null, 2));
}

const login = await api('/api/v2/auth/login', { method: 'POST', body: { email: saved.email, password: saved.password } });
const token = login.data?.access_token;

const mine = await api('/api/v2/my/properties', { token });
if (!mine.data?.length) {
  const sample = (await api('/api/v2/properties?per_page=5')).data;
  const urls = [...new Set(sample.flatMap((p) => (p.media ?? []).map((m) => m.url)).concat(sample.map((p) => p.thumbnail)).filter(Boolean))];
  while (urls.length < 5) urls.push(urls[0]);
  const ref = sample[0];
  // Gói miễn phí — gói mặc định có thể là gói trả phí, tài khoản thử không có tiền trong ví.
  const packages = (await api('/api/v2/packages')).data ?? [];
  const freePkg = packages.find((p) => Number(p.price) === 0);
  const created = await api('/api/v2/my/properties', {
    method: 'POST',
    token,
    body: {
      title: 'Tin thử cho bộ quét giao diện — bán nhà phố mặt tiền',
      description:
        'Tin tạo tự động trên máy local để kiểm tra giao diện trang sửa tin trên điện thoại. Không phải tin thật, không có trên production.',
      type: 'sell',
      category_id: Number(ref.category.id),
      price: 2500000000,
      price_unit: 'total',
      area: 100,
      province_id: Number(ref.location.province.id),
      district_id: Number(ref.location.district.id),
      address: ref.location.address ?? 'Quảng Ngãi',
      street: 'Đường thử',
      latitude: ref.location.latitude ?? undefined,
      longitude: ref.location.longitude ?? undefined,
      contact_name: 'Quét Giao Diện',
      contact_phone: '0901000111',
      images: urls.slice(0, 5).map((url, i) => ({ url, is_primary: i === 0 })),
      ...(freePkg ? { package_id: Number(freePkg.id) } : {}),
    },
  });
  saved.propertyId = created.data?.id;
  writeFileSync(FILE, JSON.stringify(saved, null, 2));
}
saved.propertyId ??= (await api('/api/v2/my/properties', { token })).data?.[0]?.id;
writeFileSync(FILE, JSON.stringify(saved, null, 2));
console.log(JSON.stringify({ taiKhoan: 'đã có (xem scripts/mobile-scan.local.json)', tinThuId: saved.propertyId }));
