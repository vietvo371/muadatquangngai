// Phần đo dùng chung cho scripts/mobile-scan.mjs (trang công khai) và
// scripts/mobile-scan-auth.mjs (khu đăng nhập). Hàm này chạy BÊN TRONG trang (page.evaluate).
export function measureInPage() {
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

  // Bỏ qua phần tử ẩn kiểu "sr-only"/ô thật nằm sau nút tuỳ biến (1×1px) — người dùng không bấm
// trực tiếp vào chúng, đưa vào chỉ làm báo nhầm "nút nhỏ" và "ô nhập < 16px".
const all = [...document.querySelectorAll('body *')].filter(visible).filter((el) => {
  const b = el.getBoundingClientRect();
  return b.width > 4 && b.height > 4;
});

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
}
