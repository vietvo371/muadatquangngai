-- Công ty/Sàn lấy từ danh bạ Doanh nghiệp (khách chốt 24/09: "sàn đang hoạt động", BỎ sàn demo).
-- Chạy SAU file 02. Chạy lại nhiều lần vẫn an toàn. KHÔNG chép hay sửa dữ liệu có sẵn.
--
-- Ô chọn Công ty/Sàn ở Hồ sơ môi giới hiện thêm các sàn môi giới thật đang hoạt động trong bảng
-- agencies (business_type='brokerage', is_active, không is_demo). Khi môi giới chọn một sàn như vậy,
-- hệ thống tạo một dòng broker_companies đã duyệt trỏ về sàn đó qua agency_id. Nhờ vậy sàn mới thêm
-- vào danh bạ sau này chọn được ngay, không phải nhập lại.

ALTER TABLE broker_companies ADD COLUMN IF NOT EXISTS agency_id bigint NULL
  REFERENCES agencies (id) ON DELETE SET NULL;
-- Mỗi sàn trong danh bạ ứng với tối đa một dòng Công ty/Sàn.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_broker_companies_agency_id
  ON broker_companies (agency_id) WHERE agency_id IS NOT NULL;
