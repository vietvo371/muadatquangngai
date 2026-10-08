// Quét responsive trên điện thoại (360px Android, 390px iPhone) bằng Chromium thật.
// Kiểm: tràn ngang, ô nhập < 16px (iPhone tự phóng to), nút < 36px, chữ < 12px, thanh cố định
// che > 25% màn hình, lỗi JS. Dùng:
//   BASE=https://muadatquangngai.com OUT=/tmp/scan node scripts/mobile-scan.mjs
// Slug trong PAGES là dữ liệu production; chạy với bản local thì sửa slug cho khớp DB local.
// Lưu ý: "nút nhỏ" có báo nhầm cố hữu (link breadcrumb, ghim giá trên bản đồ) và "thanh cố định"
// báo nhầm khi khối sticky cao bằng khung chứa nó (không có chỗ để dính).
import { chromium, devices } from 'playwright';
import { writeFileSync } from 'node:fs';
import { measureInPage } from './mobile-scan-lib.mjs';

const BASE = process.env.BASE ?? 'https://muadatquangngai.com';
const OUT = process.env.OUT ?? '/tmp';
const PAGES = [
  '/', '/mua-ban', '/cho-thue', '/du-an', '/du-an/tinh-phong-new-city',
  '/mua-ban/ban-can-goc-421m2-duy-nhat-tai-khu-do-thi-nam-song-tra-IKb9Ou',
  '/moi-gioi', '/moi-gioi/940', '/doanh-nghiep', '/doanh-nghiep/hop-nghia-land',
  '/tin-tuc', '/login', '/register', '/forgot-password', '/login-phone', '/chinh-sach', '/dieu-khoan',
];
const VIEWPORTS = [
  { name: '360', ...devices['Galaxy S9+'], viewport: { width: 360, height: 760 } },
  { name: '390', ...devices['iPhone 13'] },
];

const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ headless: true }));
const report = [];

for (const vp of VIEWPORTS) {
  const { name, ...ctxOpts } = vp;
  const ctx = await browser.newContext(ctxOpts);
  for (const path of PAGES) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 120)));
    let status = 0;
    try {
      const resp = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
      status = resp?.status() ?? 0;
    } catch (e) {
      report.push({ vp: name, path, status: 'TIMEOUT' });
      await page.close();
      continue;
    }
    // Cuộn hết trang để nội dung tải lười hiện ra, rồi về đầu.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);

    const r = await page.evaluate(measureInPage);
    if (OUT && name === '390') {
      await page.screenshot({ path: `${OUT}/m390-${path.replace(/[^a-z0-9]+/gi, '_') || 'home'}.png`, fullPage: true });
    }
    report.push({ vp: name, path, status, errors: errors.slice(0, 3), ...r });
    await page.close();
  }
  await ctx.close();
}
await browser.close();
writeFileSync(`${OUT}/mobile-report.json`, JSON.stringify(report, null, 1));
for (const x of report) {
  const flags = [];
  if (x.status !== 200) flags.push(`HTTP ${x.status}`);
  if (x.overflowPx > 0) flags.push(`TRÀN NGANG ${x.overflowPx}px`);
  if (x.zoomInputs?.length) flags.push(`ô nhập <16px: ${x.zoomInputs.length}`);
  if (x.smallTaps) flags.push(`nút nhỏ: ${x.smallTaps}`);
  if (x.tinyText) flags.push(`chữ <12px: ${x.tinyText}`);
  if (x.fixedCover?.length) flags.push(`thanh cố định che >25%: ${x.fixedCover.length}`);
  if (x.errors?.length) flags.push(`lỗi JS: ${x.errors.length}`);
  console.log(`${x.vp} ${x.path.padEnd(58).slice(0, 58)} ${flags.join(' | ') || 'ổn'}`);
}
