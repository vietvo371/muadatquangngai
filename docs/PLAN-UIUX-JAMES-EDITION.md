# PLAN NÂNG CẤP UI/UX — muadatquangngai.com

> Nguồn: feedback Notion "YÊU CẦU ĐIỀU CHỈNH UI/UX WEBSITE MUADATQUANGNGAI.COM".
> Mục tiêu: nâng trải nghiệm đăng tin + xem tin theo hướng James Edition / Zillow, phù hợp người dùng VN.
> Trạng thái tài liệu: **PLAN — chưa thực thi**. Ngày lập: 2026-08-02.

---

## 0. Hiện trạng code (đã khảo sát)

Stack: Next.js 16 / React 19 / Tailwind v4 / Radix (shadcn) / Zustand + React Query. Bản đồ: **Goong + MapLibre GL** (đã bỏ Leaflet).

Đã có sẵn (không phải làm lại):
- Upload ảnh: drag&drop, upload nhiều ảnh song song, card grid, kéo-thả sắp xếp (HTML5 native), đặt ảnh bìa, retry từng ảnh. (`src/components/shared/ImageUploader.tsx`)
- Video: YouTube link + upload MP4/WebM/MOV. (`VideoUploader` cùng file)
- Ghim bản đồ Goong + reverse geocode + auto-geocode từ địa chỉ gõ tay + check ngoài vùng Quảng Ngãi. (`src/components/map/MapPicker.tsx`)
- Giá: format phân cách nghìn + đơn vị + preset + quy đổi giá/m² 2 chiều.
- Lightbox tự viết: prev/next (nút + phím), Esc, đếm x/N, thumbnail strip, swipe mobile. (`HeroGallery.tsx`)
- Map split-view ở trang danh sách (đồng bộ 2 chiều list↔map).
- **Favorites: API + hook ĐÃ CÓ nhưng chưa nối dây** — `api/v2/my/saved`, hook `toggleSaveProperty`/`fetchSavedProperties` trong `useProperties.ts`. Nút tim hiện chỉ `preventDefault()` (nút chết). Trang `dashboard/tin-da-luu` dùng mock.

Chưa có: phân loại ảnh theo phòng, progress bar, cảnh báo ảnh mờ/nhỏ, preview gallery, min5/max50, chọn định dạng hiển thị giá, ô link Google Maps, Street View, Tour 360, upload mặt bằng, sticky search, favorites nối dây thật, tab media + nhóm ảnh + sticky tab + zoom lightbox, hiển thị video/bản đồ ở trang chi tiết.

**Nợ kỹ thuật quan trọng:** form sửa tin (`dashboard/quan-ly-tin/[id]/edit/page.tsx`) **copy nguyên** form đăng tin (`dashboard/dang-tin/page.tsx`), ~1600 dòng/file gần trùng.

---

## 1. Hai điểm phải chốt trước

### 1.1 Street View + link Google Maps (I.2, I.14, III.2)
- Lấy lat/lng từ link `maps.app.goo.gl`: **làm được** — resolve short-link phía server để bóc toạ độ.
- Street View: **chỉ Google có; Goong không có.** Cần Google Maps API key + billing, và **rủi ro tải chậm/bị chặn ở VN** (lý do dự án đã rời Google sang Goong).
- **3 phương án đề xuất:**
  - (a) Nhúng Google Street View qua key riêng — đúng feedback, chịu rủi ro VN + chi phí Google.
  - (b) Bỏ Street View — vẫn lấy lat/lng từ link, hiện bản đồ Goong.
  - (c) **[Khuyến nghị]** Giữ ô Street View nhưng fallback "Khu vực này chưa hỗ trợ Street View" — đúng phương án dự phòng feedback đã nêu, không phát sinh chi phí/rủi ro, có thể bật (a) sau.

### 1.2 Refactor form — ĐÃ CHỐT: refactor trước
Tách `PostForm` dùng chung cho cả đăng + sửa trước khi thêm tính năng Phần I, để mọi thay đổi chỉ sửa 1 nơi.

---

## 2. Plan theo đợt

### Đợt 0 — Nền dữ liệu ảnh (backbone)
Chặn: I.5, III.3/6/8. Backend + migration.
- Thêm `image_type`/category + thứ tự (`sort_order`) + cờ `is_cover` vào bảng media.
- Thêm field: floor plan, tour360 url, streetview (lat/lng đã có).
- API trả về ảnh kèm nhóm + thứ tự đúng.

### Đợt 1 — Tin yêu thích (nhanh, độc lập) — API+hook đã có
- Nối nút tim `PropertyCard` → `toggleSaveProperty` (optimistic + toast).
- `dashboard/tin-da-luu`: bỏ mock → gọi `fetchSavedProperties`.
- Nút tim trang chi tiết persist thật + đếm số. (Feedback II "Tin yêu thích", III.9)

### Đợt 2 — Form đăng tin (Phần I)
- (refactor) Tách `PostForm` dùng chung đăng + sửa.
- I.1 Sidebar: `truncate` + tự co giãn, không cắt chữ.
- I.5 Dropdown phân loại ảnh mỗi card (mặt tiền/phòng khách/phòng ngủ/bếp/WC/ban công/view/tiện ích/pháp lý/khác).
- I.8 Progress bar thật; I.4 min 5 / max 50; I.9 cảnh báo ảnh mờ/nhỏ <1280px (không bắt buộc thay); I.10 nút Xem trước gallery.
- I.3 Tick chọn cách hiển thị giá (6,5 tỷ / 6500 triệu / 6 tỷ 500 triệu).
- I.2 Ô link Google Maps → auto lat/lng + autofill, vẫn giữ ghim thủ công.
- I.12 Tour 360 (Matterport/Kuula); I.13 Mặt bằng (jpg/png/pdf).
- I.14 Street View — theo phương án chốt ở 1.1.

### Đợt 3 — Trang danh sách (Phần II)
- Thanh search sticky bám top khi cuộn (`FilterHorizontal`).

### Đợt 4 — Trang chi tiết James Edition (Phần III, lớn nhất)
- III.1 "Xem tất cả ảnh" → hiển thị inline (không popup/đổi trang).
- III.2 Tab Media: Ảnh / Video / Tour / Mặt bằng / Bản đồ / Street View (bổ sung hiển thị video + bản đồ đang thiếu).
- III.3/6 Nhóm ảnh theo loại có đếm số + III.4 smooth scroll + III.5 sticky sub-tab.
- III.7 Lightbox thêm zoom + fullscreen (đã có prev/next/swipe).
- III.8 Đồng bộ thứ tự/ảnh bìa/nhóm từ form đăng.

---

## 3. Thứ tự đề xuất
`Đợt 1` → `Đợt 0 + 2` → `Đợt 4` → `Đợt 3`.
Lý do: favorites gọn + có win sớm; backbone ảnh (Đợt 0) phải xong trước nhóm ảnh trang chi tiết (Đợt 4).

## 4. Ghi chú thư viện
- Kéo-thả hiện dùng HTML5 native (ổn). Nếu muốn UX mượt hơn có thể thêm `@dnd-kit/*`.
- Lightbox tự viết — thêm zoom/fullscreen tự làm được, không cần lib.
- Bản đồ giữ Goong/MapLibre. Google chỉ dùng cho resolve link + (tùy chọn) Street View.
