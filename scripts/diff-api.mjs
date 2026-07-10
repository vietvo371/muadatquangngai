#!/usr/bin/env node
/**
 * Diff API — so sánh response Laravel (nguồn cũ) vs Next.js (route đang port sang)
 * byte-for-byte, dùng cho chiến lược strangler migration (xem trao đổi trong session).
 *
 * Chạy: node scripts/diff-api.mjs
 * Yêu cầu: Laravel chạy ở LARAVEL_BASE (mặc định :8000), Next.js dev ở NEXT_BASE (mặc định :3000).
 *
 * Mỗi test case khai báo field cần bỏ qua khi so sánh (đã ghi chú lý do) — KHÔNG bỏ qua
 * field tuỳ tiện, mỗi field bị ignore đều phải có lý do cụ thể ở đây.
 *
 * CASES chỉ chứa request KHÔNG side-effect (GET, hoặc POST thất bại validation trước khi
 * ghi DB) — vì diff() so 2 response tĩnh. Route có side-effect thật (register/login thành
 * công, create/update/delete property) được test riêng ở phần "LUỒNG TƯƠNG TÁC" bên dưới,
 * verify bằng cách gọi chéo 2 backend trên CÙNG token/data thay vì so JSON tĩnh.
 */

const LARAVEL_BASE = process.env.LARAVEL_BASE ?? 'http://localhost:8000';
const NEXT_BASE = process.env.NEXT_BASE ?? 'http://localhost:3000/api/v2';

// Field bị bỏ qua khi so sánh — luôn kèm lý do, không âm thầm nới lỏng test.
const GLOBAL_IGNORE = new Set([
  'view_count', // cả 2 backend cùng ghi vào 1 DB khi gọi show() — count trôi tự nhiên khi test cả 2
]);

// Giai đoạn 1 chưa nối auth cho route public (xem property-resource.ts) — 3 field này chỉ
// xuất hiện cho user đã đăng nhập. Next.js luôn lược bỏ khoá đúng chuẩn; Laravel index() (do
// gọi toArray() thủ công, không qua resolve()) serialize MissingValue thành `{}` thay vì lược
// bỏ — coi `{}`/null ở Laravel khớp với "vắng mặt" ở Next.js.
const AUTH_GATED_KEYS = new Set(['features', 'is_saved', 'phone']);

function diff(a, b, path = '') {
  const diffs = [];
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of [...keys].sort()) {
      if (GLOBAL_IGNORE.has(k)) continue;
      const inA = k in a;
      const inB = k in b;
      if (AUTH_GATED_KEYS.has(k)) {
        const lv = a[k];
        const laravelEmpty = !inA || lv === null || (typeof lv === 'object' && lv !== null && Object.keys(lv).length === 0);
        if (!inB && laravelEmpty) continue;
      }
      if (!inA) diffs.push(`${path}.${k}: MISSING in laravel (nextjs=${JSON.stringify(b[k])})`);
      else if (!inB) diffs.push(`${path}.${k}: MISSING in nextjs (laravel=${JSON.stringify(a[k])})`);
      else diffs.push(...diff(a[k], b[k], `${path}.${k}`));
    }
  } else if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) diffs.push(`${path}: length laravel=${a.length} nextjs=${b.length}`);
    for (let i = 0; i < Math.min(a.length, b.length); i++) diffs.push(...diff(a[i], b[i], `${path}[${i}]`));
  } else if (a !== b) {
    diffs.push(`${path}: laravel=${JSON.stringify(a)} != nextjs=${JSON.stringify(b)}`);
  }
  return diffs;
}

async function fetchJson(base, path, opts = {}) {
  const res = await fetch(base + path, {
    method: opts.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.headers ?? {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

const CASES = [
  { name: 'projects list', path: '/projects', laravelPath: '/api/projects' },
  { name: 'projects list ?type=townhouse', path: '/projects?type=townhouse', laravelPath: '/api/projects?type=townhouse' },
  {
    name: 'project show (de-palace-river)',
    path: '/projects/de-palace-river-nam-song-tra-khuc',
    laravelPath: '/api/projects/de-palace-river-nam-song-tra-khuc',
  },
  { name: 'properties list', path: '/properties', laravelPath: '/api/properties' },
  { name: 'properties list ?sort=price_asc', path: '/properties?sort=price_asc', laravelPath: '/api/properties?sort=price_asc' },
  { name: 'properties list ?type=rent', path: '/properties?type=rent', laravelPath: '/api/properties?type=rent' },

  // ── Auth: validation errors (không side-effect, thất bại trước khi chạm DB ghi) ──
  {
    name: 'login: thiếu email+password',
    method: 'POST',
    path: '/auth/login',
    laravelPath: '/api/auth/login',
    body: {},
  },
  {
    name: 'login: email sai định dạng',
    method: 'POST',
    path: '/auth/login',
    laravelPath: '/api/auth/login',
    body: { email: 'not-an-email', password: '123456' },
  },
  {
    name: 'login: sai mật khẩu (422 validation, không phải 401)',
    method: 'POST',
    path: '/auth/login',
    laravelPath: '/api/auth/login',
    body: { email: 'admin@batdongsan.local', password: 'wrong-password-xyz' },
  },
  {
    name: 'register: thiếu hết field',
    method: 'POST',
    path: '/auth/register',
    laravelPath: '/api/auth/register',
    body: {},
  },
  {
    name: 'register: email đã tồn tại',
    method: 'POST',
    path: '/auth/register',
    laravelPath: '/api/auth/register',
    body: { name: 'X', email: 'admin@batdongsan.local', password: 'password123', password_confirmation: 'password123' },
  },
  {
    name: 'forgot-password: thiếu email',
    method: 'POST',
    path: '/auth/forgot-password',
    laravelPath: '/api/auth/forgot-password',
    body: {},
  },
  {
    name: 'user/me: chưa đăng nhập (401)',
    path: '/user/me',
    laravelPath: '/api/user/me',
  },
];

let failCount = 0;

for (const c of CASES) {
  const opts = { method: c.method, body: c.body };
  const [l, n] = await Promise.all([
    fetchJson(LARAVEL_BASE, c.laravelPath, opts),
    fetchJson(NEXT_BASE, c.path, opts),
  ]);

  if (l.status !== n.status) {
    console.log(`❌ ${c.name}: HTTP status khác nhau — laravel=${l.status} nextjs=${n.status}`);
    failCount++;
    continue;
  }

  const result = diff(l.body, n.body);
  if (result.length === 0) {
    console.log(`✅ ${c.name}`);
  } else {
    console.log(`❌ ${c.name}: ${result.length} khác biệt`);
    for (const d of result.slice(0, 20)) console.log('   -', d);
    failCount++;
  }
}

console.log(`\n${CASES.length - failCount}/${CASES.length} test case tĩnh khớp.`);

// ── Luồng tương tác: xác nhận token/data tạo bởi backend này dùng được ở backend kia ──
// (không diff JSON tĩnh được vì mỗi lần chạy sinh id/token khác nhau)
console.log('\n── Luồng tương tác (cross-backend) ──');
let interactionFail = 0;

async function checkInteraction(name, fn) {
  try {
    const ok = await fn();
    console.log(ok ? `✅ ${name}` : `❌ ${name}`);
    if (!ok) interactionFail++;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    interactionFail++;
  }
}

await checkInteraction('login qua Laravel -> /me qua Next.js dùng cùng token', async () => {
  const login = await fetchJson(LARAVEL_BASE, '/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@batdongsan.local', password: 'password' },
  });
  if (login.status !== 200) return false;
  const token = login.body.data.access_token;
  const me = await fetchJson(NEXT_BASE, '/user/me', { headers: { Authorization: `Bearer ${token}` } });
  // dọn token vừa tạo để không rác DB
  await fetchJson(LARAVEL_BASE, '/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  return me.status === 200 && me.body.data.email === 'admin@batdongsan.local';
});

await checkInteraction('login qua Next.js -> /user/me qua Laravel dùng cùng token', async () => {
  const login = await fetchJson(NEXT_BASE, '/auth/login', {
    method: 'POST',
    body: { email: 'admin@batdongsan.local', password: 'password' },
  });
  if (login.status !== 200) return false;
  const token = login.body.data.access_token;
  const me = await fetchJson(LARAVEL_BASE, '/api/user/me', { headers: { Authorization: `Bearer ${token}` } });
  await fetchJson(LARAVEL_BASE, '/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  return me.status === 200 && me.body.data.email === 'admin@batdongsan.local';
});

await checkInteraction('tạo tin qua Next.js -> đọc + xoá qua Laravel', async () => {
  const login = await fetchJson(LARAVEL_BASE, '/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@batdongsan.local', password: 'password' },
  });
  if (login.status !== 200) return false;
  const token = login.body.data.access_token;
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const created = await fetchJson(NEXT_BASE, '/my/properties', {
    ...auth,
    method: 'POST',
    body: {
      title: 'Diff-api tự động kiểm thử luồng tương tác CRUD',
      description: 'Mô tả kiểm thử tự động phải có ít nhất 50 ký tự để pass validation của backend theo đúng rule.',
      type: 'sale',
      category_id: 1,
      price: 1000000000,
      area: 50,
      province_id: 64,
      district_id: 627,
      address: 'Diff-api test address',
    },
  });
  if (created.status !== 201) return false;
  const id = created.body.data.id;

  const readViaLaravel = await fetchJson(LARAVEL_BASE, `/api/my/properties/${id}`, auth);
  const matches = readViaLaravel.status === 200 && readViaLaravel.body.data.title === created.body.data.title;

  await fetchJson(LARAVEL_BASE, `/api/my/properties/${id}`, { ...auth, method: 'DELETE' }); // dọn dẹp
  await fetchJson(LARAVEL_BASE, '/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });

  return matches;
});

console.log(`\n${3 - interactionFail}/3 luồng tương tác khớp.`);

if (failCount > 0 || interactionFail > 0) process.exit(1);
