// Quét responsive KHU ĐĂNG NHẬP (/dashboard) trên bản chạy local, khổ 360px và 390px.
// Cần chạy trước: node scripts/mobile-scan-setup-local.mjs (tạo tài khoản + tin thử).
// Đăng nhập qua chính form /login như người dùng thật, rồi quét từng trang — trang nhiều bước
// (Đăng tin, Sửa tin) thì bấm "Tiếp tục" qua từng bước và quét mỗi bước.
//   BASE=http://localhost:3001 OUT=/tmp/scan node scripts/mobile-scan-auth.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium, devices } from 'playwright';
import { measureInPage } from './mobile-scan-lib.mjs';

const BASE = process.env.BASE ?? 'http://localhost:3001';
const OUT = process.env.OUT ?? '/tmp';
const account = JSON.parse(readFileSync(new URL('./mobile-scan.local.json', import.meta.url), 'utf8'));

const PAGES = [
  { path: '/dashboard' },
  // Form trống không qua được bước 1 (trường bắt buộc); bước 2–3 dùng chung khối với Sửa tin.
  { path: '/dashboard/dang-tin' },
  { path: '/dashboard/quan-ly-tin' },
  { path: `/dashboard/quan-ly-tin/${account.propertyId}/edit`, steps: 3 },
  { path: '/dashboard/khach-hang' },
  { path: '/dashboard/nap-tien' },
  { path: '/dashboard/profile' },
  { path: '/dashboard/settings' },
  { path: '/dashboard/thong-bao' },
  { path: '/dashboard/tin-da-luu' },
  { path: '/dashboard/tin-nhan' },
];
const VIEWPORTS = [
  { name: '360', ...devices['Galaxy S9+'], viewport: { width: 360, height: 760 } },
  { name: '390', ...devices['iPhone 13'] },
];

async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];

for (const vp of VIEWPORTS) {
  const { name, ...ctxOpts } = vp;
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 120)));

  await page.goto(`${BASE}/login`, { waitUntil: 'load' });
  await page.fill('input[type="email"]', account.email);
  await page.fill('input[type="password"]', account.password);
  await page.getByRole('button', { name: /^Đăng nhập$/ }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 });

  for (const { path, steps = 1 } of PAGES) {
    errors.length = 0;
    await page.goto(BASE + path, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(3500);
    for (let step = 1; step <= steps; step++) {
      await settle(page);
      const r = await page.evaluate(measureInPage);
      const label = steps > 1 ? `${path} [bước ${step}]` : path;
      const shot = `${OUT}/auth${name}-${label.replace(/[^a-z0-9]+/gi, '_')}.png`;
      if (name === '390') await page.screenshot({ path: shot, fullPage: true });
      report.push({ vp: name, path: label, url: new URL(page.url()).pathname, errors: [...errors], ...r });
      if (step < steps) {
        const next = page.getByRole('button', { name: /Tiếp tục/ }).last();
        if (!(await next.count())) break;
        // Nút nằm cuối form: cuộn hẳn xuống đáy như người dùng thật rồi mới bấm.
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(500);
        await next.click({ timeout: 10000 });
        await page.waitForTimeout(1500);
      }
    }
  }
  await ctx.close();
}
await browser.close();
writeFileSync(`${OUT}/mobile-report-auth.json`, JSON.stringify(report, null, 1));
for (const x of report) {
  const flags = [];
  if (x.url !== x.path.split(' ')[0]) flags.push(`chuyển sang ${x.url}`);
  if (x.overflowPx > 0) flags.push(`TRÀN NGANG ${x.overflowPx}px`);
  if (x.zoomInputs?.length) flags.push(`ô nhập <16px: ${x.zoomInputs.length}`);
  if (x.smallTaps) flags.push(`nút nhỏ: ${x.smallTaps}`);
  if (x.tinyText) flags.push(`chữ <12px: ${x.tinyText}`);
  if (x.fixedCover?.length) flags.push(`che >25%: ${x.fixedCover.length}`);
  if (x.errors?.length) flags.push(`lỗi JS: ${x.errors.length}`);
  console.log(`${x.vp} ${x.path.padEnd(48).slice(0, 48)} ${flags.join(' | ') || 'ổn'}`);
}
