// Quét responsive trên điện thoại (360px Android, 390px iPhone) bằng Chromium thật.
// Kiểm: tràn ngang, ô nhập < 16px (iPhone tự phóng to), nút < 36px, chữ < 12px, thanh cố định
// che > 25% màn hình, lỗi JS. Dùng:
//   BASE=https://muadatquangngai.com OUT=/tmp/scan node scripts/mobile-scan.mjs
// Slug trong PAGES là dữ liệu production; chạy với bản local thì sửa slug cho khớp DB local.
// Lưu ý: "nút nhỏ" có báo nhầm cố hữu (link breadcrumb, ghim giá trên bản đồ) và "thanh cố định"
// báo nhầm khi khối sticky cao bằng khung chứa nó (không có chỗ để dính).
import { chromium, devices } from 'playwright';
import { writeFileSync } from 'node:fs';

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

    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const visible = (el) => {
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
        const b = el.getBoundingClientRect();
        return b.width > 0 && b.height > 0;
      };
      const label = (el) => {
        const cls = (el.className && typeof el.className === 'string' ? el.className : '').split(/\s+/).slice(0, 3).join('.');
        const txt = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
        return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${txt ? ` "${txt}"` : ''}`;
      };
      // Phần tử nằm trong khung tự cuộn ngang (carousel, bảng) thì tràn là chủ đích.
      const insideScroller = (el) => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const ox = getComputedStyle(p).overflowX;
          if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') return true;
        }
        return false;
      };

      const all = [...document.querySelectorAll('body *')].filter(visible);

      // 1. Tràn ngang
      const overflowPx = document.documentElement.scrollWidth - vw;
      const overflowEls = all
        .filter((el) => {
          const b = el.getBoundingClientRect();
          return (b.right > vw + 1 || b.left < -1) && !insideScroller(el) && getComputedStyle(el).position !== 'fixed';
        })
        .map((el) => `${label(el)} [${Math.round(el.getBoundingClientRect().left)}→${Math.round(el.getBoundingClientRect().right)}]`)
        .slice(0, 6);

      // 2. Nút/link quá nhỏ để bấm bằng ngón tay (< 36px), bỏ link chữ nằm trong đoạn văn.
      const tappables = all.filter((el) => el.matches('a, button, [role=button], input:not([type=hidden]), select, textarea, label[for]'));
      const smallTaps = tappables
        .filter((el) => {
          const b = el.getBoundingClientRect();
          if (el.closest('p, li p, article p')) return false;
          if (b.top > document.body.scrollHeight) return false;
          return b.width < 36 || b.height < 36;
        })
        .map((el) => `${label(el)} ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`);

      // 3. Chữ quá nhỏ (< 12px) có nội dung thật
      const tinyText = all
        .filter((el) => {
          const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
          return own && parseFloat(getComputedStyle(el).fontSize) < 12;
        })
        .map((el) => `${label(el)} ${getComputedStyle(el).fontSize}`);

      // 4. Ô nhập chữ < 16px: iPhone tự phóng to cả trang khi bấm vào → người dùng khó chịu.
      const zoomInputs = all
        .filter((el) => el.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]), select, textarea'))
        .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
        .map((el) => `${label(el)} ${getComputedStyle(el).fontSize}`);

      // 5. Thanh cố định che màn hình
      const fixedBars = all
        .filter((el) => ['fixed', 'sticky'].includes(getComputedStyle(el).position))
        .map((el) => ({ el: label(el), h: Math.round(el.getBoundingClientRect().height), top: Math.round(el.getBoundingClientRect().top) }))
        .filter((f) => f.h > 0);
      const fixedCover = fixedBars.filter((f) => f.h > vh * 0.25);

      return { vw, overflowPx, overflowEls, smallTaps: smallTaps.length, smallTapSamples: smallTaps.slice(0, 8), tinyText: tinyText.length, tinySamples: tinyText.slice(0, 6), zoomInputs, fixedBars: fixedBars.slice(0, 6), fixedCover };
    });
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
