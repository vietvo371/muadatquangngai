-- Tiện ích xung quanh tin đăng (Notion 06/10 "Chi tiết BĐS – Bản đồ & Tiện ích xung quanh").
-- Chạy SAU các file 01→08. Chạy lại nhiều lần vẫn an toàn.
--
-- Dự án (projects.nearby_places) đã có sẵn cơ chế này: tra Goong Place API một lần rồi lưu
-- lại, trang công khai không gọi API ngoài nữa. Tin đăng dùng đúng cách đó, chỉ khác thời
-- điểm tính: dự án tính lúc admin tạo/sửa, còn tin đăng NHIỀU hơn dự án rất nhiều và mỗi lần
-- tra tốn hàng chục lượt gọi Place API tính phí — nên tin đăng chỉ tra vào lần đầu có người
-- thực sự mở trang chi tiết, rồi dùng lại kết quả.
--
-- `nearby_places_at` lưu thời điểm tra để sau này làm mới được dữ liệu cũ; khi chủ tin dời
-- vị trí thì cột này bị xoá về NULL để lần xem sau tra lại theo toạ độ mới.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS nearby_places    jsonb,
  ADD COLUMN IF NOT EXISTS nearby_places_at timestamp(0);

COMMENT ON COLUMN properties.nearby_places IS
  'Tiện ích xung quanh (trường học/siêu thị/công viên/bệnh viện) trong 5km, tra bằng Goong Place API. NULL = chưa tra.';
COMMENT ON COLUMN properties.nearby_places_at IS
  'Thời điểm tra nearby_places. NULL khi toạ độ tin thay đổi, để lần xem sau tra lại.';

-- Kiểm tra (chỉ đọc).
SELECT 'tin da tra tien ich' AS muc, count(*)::text AS ket_qua
FROM properties WHERE nearby_places IS NOT NULL
UNION ALL
SELECT 'tin co toa do', count(*)::text FROM properties WHERE latitude IS NOT NULL AND longitude IS NOT NULL
UNION ALL
SELECT 'tong so tin', count(*)::text FROM properties;
