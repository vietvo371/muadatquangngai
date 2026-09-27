-- Gộp bản trùng "Hợp Nghĩa Land" sau SQL 05 (27/09). Chạy SAU file 05, chỉ chạy một lần.
--
-- SQL 05 tạo doanh nghiệp #18 từ một Công ty/Sàn môi giới đề xuất trước đó ở bảng cũ: tên trùng #5
-- (danh bạ gốc, link /doanh-nghiep/hop-nghia-land) nhưng địa chỉ / số điện thoại khác nên không tự gộp.
-- Giữ #5 (link công khai gốc), chép MST + địa chỉ + người đề xuất của #18 sang, chuyển môi giới trực
-- thuộc sang #5, rồi xoá #18. Dừng ngay nếu dữ liệu không đúng như trên.

BEGIN;

DO $$
DECLARE
  v_tax      varchar(20);
  v_address  varchar(500);
  v_proposer bigint;
  v_moved    int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM businesses WHERE id = 5 AND name = 'Hợp Nghĩa Land')
     OR NOT EXISTS (SELECT 1 FROM businesses WHERE id = 18 AND name = 'Hợp Nghĩa Land') THEN
    RAISE EXCEPTION 'Dữ liệu không khớp (#5 / #18 không cùng là "Hợp Nghĩa Land") — không thay đổi gì.';
  END IF;

  SELECT tax_code, address, proposed_by INTO v_tax, v_address, v_proposer FROM businesses WHERE id = 18;

  UPDATE users SET broker_company_id = 5 WHERE broker_company_id = 18;
  GET DIAGNOSTICS v_moved = ROW_COUNT;

  -- Xoá #18 trước để mã số thuế (unique) chuyển sang #5 được.
  DELETE FROM businesses WHERE id = 18;

  UPDATE businesses SET
    tax_code    = COALESCE(tax_code, v_tax),
    address     = COALESCE(address, v_address),
    proposed_by = COALESCE(proposed_by, v_proposer),
    updated_at  = date_trunc('second', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
  WHERE id = 5;

  RAISE NOTICE 'Đã gộp #18 vào #5, chuyển % môi giới.', v_moved;
END;
$$;

COMMIT;

-- Kiểm tra (chỉ đọc): chỉ còn MỘT "Hợp Nghĩa Land".
SELECT id, name, slug, tax_code, address, phone,
       (SELECT count(*) FROM users u WHERE u.broker_company_id = b.id) AS moi_gioi
FROM businesses b WHERE name = 'Hợp Nghĩa Land';
