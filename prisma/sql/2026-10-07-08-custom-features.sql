-- Tiện ích tùy chỉnh của từng tin đăng (Notion 06/10 "Đăng tin / Chỉnh sửa tin – Tiện ích
-- tùy chỉnh"). Chạy SAU các file 01→07. Chạy lại nhiều lần vẫn an toàn.
--
-- Khách chốt: tiện ích người đăng tự nhập phải lưu RIÊNG theo tin, KHÔNG thêm vào bảng
-- `features` dùng chung — nếu thêm vào bảng chung thì một người gõ sai chính tả là cả site
-- nhìn thấy, và danh sách tiện ích mặc định sẽ phình ra mất kiểm soát.
--
-- Vì vậy lưu thẳng vào một cột JSON trên chính tin đăng: mảng chuỗi, ví dụ
--   ["Gần chợ Quảng Ngãi", "Có giếng khoan"]
-- Xoá tin thì tiện ích riêng mất theo, không để lại rác.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS custom_features jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN properties.custom_features IS
  'Tiện ích người đăng tự nhập, riêng cho tin này. Mảng chuỗi JSON. Tiện ích dùng chung nằm ở bảng features.';

-- Chặn dữ liệu sai kiểu ngay từ tầng DB: phải là mảng JSON.
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_custom_features_is_array;
ALTER TABLE properties ADD CONSTRAINT properties_custom_features_is_array
  CHECK (jsonb_typeof(custom_features) = 'array');

-- Kiểm tra (chỉ đọc).
SELECT 'tin co tien ich rieng' AS muc, count(*)::text AS ket_qua
FROM properties WHERE jsonb_array_length(custom_features) > 0
UNION ALL
SELECT 'tong so tin', count(*)::text FROM properties;
