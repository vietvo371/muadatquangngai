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
 */

const LARAVEL_BASE = process.env.LARAVEL_BASE ?? 'http://localhost:8000';
const NEXT_BASE = process.env.NEXT_BASE ?? 'http://localhost:3000/api/v2';

// Field bị bỏ qua khi so sánh — luôn kèm lý do, không âm thầm nới lỏng test.
const GLOBAL_IGNORE = new Set([
  'view_count', // cả 2 backend cùng ghi vào 1 DB khi gọi show() — count trôi tự nhiên khi test cả 2
]);

// Giai đoạn 1 chưa nối auth (xem property-resource.ts) — 3 field này chỉ xuất hiện cho
// user đã đăng nhập. Next.js luôn lược bỏ khoá đúng chuẩn; Laravel index() (do gọi
// toArray() thủ công, không qua resolve()) serialize MissingValue thành `{}` thay vì lược
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

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

const CASES = [
  { name: 'projects list', laravel: '/api/projects', nextjs: '/projects' },
  { name: 'projects list ?type=townhouse', laravel: '/api/projects?type=townhouse', nextjs: '/projects?type=townhouse' },
  {
    name: 'project show (de-palace-river)',
    laravel: '/api/projects/de-palace-river-nam-song-tra-khuc',
    nextjs: '/projects/de-palace-river-nam-song-tra-khuc',
  },
  { name: 'properties list', laravel: '/api/properties', nextjs: '/properties' },
  { name: 'properties list ?sort=price_asc', laravel: '/api/properties?sort=price_asc', nextjs: '/properties?sort=price_asc' },
  { name: 'properties list ?type=rent', laravel: '/api/properties?type=rent', nextjs: '/properties?type=rent' },
];

let failCount = 0;

for (const c of CASES) {
  const [l, n] = await Promise.all([fetchJson(LARAVEL_BASE + c.laravel), fetchJson(NEXT_BASE + c.nextjs)]);

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

console.log(`\n${CASES.length - failCount}/${CASES.length} test case khớp.`);
if (failCount > 0) process.exit(1);
