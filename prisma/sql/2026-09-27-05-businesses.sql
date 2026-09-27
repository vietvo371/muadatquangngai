-- Gộp "Doanh nghiệp" (agencies) và "Công ty/Sàn giao dịch" (broker_companies) thành MỘT bảng
-- `businesses` (Notion 25/09, chốt 27/09). Chạy SAU các file 01→04.
--
-- Trình tự (đúng yêu cầu khách): Mapping → Migrate → Validate → đổi khoá ngoại. Backup: bảng cũ
-- agencies + broker_companies GIỮ NGUYÊN dữ liệu — chỉ gỡ khoá ngoại users → broker_companies. Sau
-- 2 tuần chạy ổn mới xoá bằng file SQL riêng. Muốn quay lại thì trỏ app về bảng cũ.
--
-- Chạy lại nhiều lần vẫn an toàn: phần chuyển dữ liệu chỉ chạy khi `businesses` còn trống.
--
-- Quy ước:
--   status: chỉ 'pending' | 'active' | 'rejected' (thay is_active / is_verified / company status cũ).
--   is_demo: GIỮ — đánh dấu dữ liệu mẫu tự sinh; không trùng nghĩa với status và là thứ chặn sàn demo
--            lọt vào ô chọn Công ty/Sàn của môi giới.
--   id của agencies được giữ nguyên → link /doanh-nghiep/[slug] và users.agency_id cũ vẫn khớp.
--   business_type: lĩnh vực chính (brokerage/developer/...); industry: ngành nghề chi tiết (tuỳ chọn);
--   area: khu vực hoạt động dạng chữ (tuỳ chọn).

CREATE TABLE IF NOT EXISTS businesses (
  id               bigserial PRIMARY KEY,
  name             varchar(255) NOT NULL,
  slug             varchar(255) NOT NULL,
  business_type    varchar(20)  NOT NULL DEFAULT 'brokerage',
  industry         varchar(255) NULL,
  area             varchar(255) NULL,
  province_id      bigint       NULL REFERENCES provinces (id),
  district_id      bigint       NULL REFERENCES districts (id),
  tax_code         varchar(20)  NULL,
  address          varchar(500) NULL,
  phone            varchar(20)  NULL,
  email            varchar(255) NULL,
  website          varchar(255) NULL,
  logo             varchar(500) NULL,
  description      text         NULL,
  status           varchar(20)  NOT NULL DEFAULT 'pending',
  is_demo          boolean      NOT NULL DEFAULT false,
  proposed_by      bigint       NULL REFERENCES users (id) ON DELETE SET NULL,
  approved_by      bigint       NULL,
  rejected_by      bigint       NULL,
  rejection_reason varchar(500) NULL,
  approved_at      timestamp(0) NULL,
  rejected_at      timestamp(0) NULL,
  created_at       timestamp(0) NULL,
  updated_at       timestamp(0) NULL,
  CONSTRAINT businesses_status_check CHECK (status IN ('pending', 'active', 'rejected'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_businesses_slug ON businesses (slug);
-- Một mã số thuế chỉ ứng với một doanh nghiệp (bỏ qua dòng chưa có MST).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_businesses_tax_code ON businesses (tax_code) WHERE tax_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_status_type ON businesses (status, business_type);
CREATE INDEX IF NOT EXISTS idx_businesses_district ON businesses (district_id);

DO $$
DECLARE
  r             record;
  v_business_id bigint;
  v_from_agency int := 0;
  v_merged      int := 0;
  v_created     int := 0;
  v_users_fk    text;
BEGIN
  IF EXISTS (SELECT 1 FROM businesses) THEN
    RAISE NOTICE 'businesses đã có dữ liệu — bỏ qua bước chuyển dữ liệu.';
    RETURN;
  END IF;

  -- 1) Danh bạ Doanh nghiệp → businesses, giữ nguyên id và slug.
  INSERT INTO businesses
    (id, name, slug, business_type, province_id, district_id, address, phone, email, website, logo,
     description, status, is_demo, rejection_reason, approved_at, rejected_at, created_at, updated_at)
  SELECT a.id, a.name, a.slug, a.business_type, a.province_id, a.district_id, a.address, a.phone,
         a.email, a.website, a.logo, a.description,
         CASE WHEN a.is_active THEN 'active' ELSE 'rejected' END,
         a.is_demo,
         CASE WHEN a.is_active THEN NULL ELSE 'Đã ẩn khỏi danh bạ (chuyển từ dữ liệu cũ).' END,
         CASE WHEN a.is_active THEN a.created_at END,
         CASE WHEN a.is_active THEN NULL ELSE a.updated_at END,
         a.created_at, a.updated_at
  FROM agencies a;
  GET DIAGNOSTICS v_from_agency = ROW_COUNT;

  PERFORM setval(pg_get_serial_sequence('businesses', 'id'), GREATEST((SELECT COALESCE(max(id), 0) FROM businesses), 1));

  -- 2) Công ty/Sàn của môi giới → businesses, ghi lại ánh xạ id cũ → id mới.
  CREATE TEMP TABLE business_id_map (old_company_id bigint PRIMARY KEY, business_id bigint NOT NULL) ON COMMIT DROP;

  FOR r IN SELECT * FROM broker_companies ORDER BY id LOOP
    v_business_id := NULL;

    -- a) Đã liên kết với sàn trong danh bạ.
    IF r.agency_id IS NOT NULL AND EXISTS (SELECT 1 FROM businesses WHERE id = r.agency_id) THEN
      v_business_id := r.agency_id;
    END IF;

    -- b) Trùng mã số thuế với doanh nghiệp đã có.
    IF v_business_id IS NULL AND r.tax_code IS NOT NULL THEN
      SELECT id INTO v_business_id FROM businesses WHERE tax_code = r.tax_code LIMIT 1;
    END IF;

    -- c) Không có MST: trùng tên + địa chỉ + số điện thoại.
    IF v_business_id IS NULL THEN
      SELECT id INTO v_business_id FROM businesses b
      WHERE lower(trim(b.name)) = lower(trim(r.name))
        AND COALESCE(lower(trim(b.address)), '') = COALESCE(lower(trim(r.address)), '')
        AND COALESCE(regexp_replace(b.phone, '\D', '', 'g'), '') = COALESCE(regexp_replace(r.phone, '\D', '', 'g'), '')
      LIMIT 1;
    END IF;

    IF v_business_id IS NOT NULL THEN
      -- Gộp: bổ sung MST / người đề xuất nếu doanh nghiệp đích còn thiếu.
      UPDATE businesses SET
        tax_code    = COALESCE(businesses.tax_code, r.tax_code),
        proposed_by = COALESCE(businesses.proposed_by, r.created_by)
      WHERE id = v_business_id
        AND NOT EXISTS (SELECT 1 FROM businesses x WHERE x.tax_code = r.tax_code AND x.id <> v_business_id);
      v_merged := v_merged + 1;
    ELSE
      v_business_id := nextval(pg_get_serial_sequence('businesses', 'id'));
      INSERT INTO businesses
        (id, name, slug, business_type, tax_code, address, phone, email, status, is_demo, proposed_by,
         approved_by, approved_at, rejected_by, rejected_at, rejection_reason, created_at, updated_at)
      VALUES
        (v_business_id, r.name, 'doanh-nghiep-' || v_business_id, 'brokerage', r.tax_code, r.address,
         r.phone, r.email,
         CASE r.status WHEN 'approved' THEN 'active' WHEN 'rejected' THEN 'rejected' ELSE 'pending' END,
         false, r.created_by,
         CASE WHEN r.status = 'approved' THEN r.approved_by END,
         CASE WHEN r.status = 'approved' THEN r.approved_at END,
         CASE WHEN r.status = 'rejected' THEN r.approved_by END,
         CASE WHEN r.status = 'rejected' THEN r.updated_at END,
         r.rejection_reason, r.created_at, r.updated_at);
      v_created := v_created + 1;
    END IF;

    INSERT INTO business_id_map VALUES (r.id, v_business_id);
  END LOOP;

  -- 3) Đổi khoá ngoại users.broker_company_id: broker_companies → businesses.
  FOR v_users_fk IN
    SELECT c.conname FROM pg_constraint c
    WHERE c.conrelid = 'users'::regclass AND c.contype = 'f'
      AND c.confrelid = 'broker_companies'::regclass
  LOOP
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', v_users_fk);
  END LOOP;

  UPDATE users u SET broker_company_id = m.business_id
  FROM business_id_map m WHERE u.broker_company_id = m.old_company_id;

  -- Môi giới chưa chọn Công ty/Sàn nhưng đang thuộc một doanh nghiệp trong danh bạ → gắn luôn,
  -- để chỉ còn MỘT quan hệ User → Business (users.agency_id từ nay không dùng nữa).
  UPDATE users SET broker_company_id = agency_id
  WHERE broker_company_id IS NULL AND agency_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM businesses b WHERE b.id = users.agency_id);

  ALTER TABLE users ADD CONSTRAINT users_broker_company_id_businesses_fkey
    FOREIGN KEY (broker_company_id) REFERENCES businesses (id) ON DELETE SET NULL;

  RAISE NOTICE 'Chuyển xong: % từ danh bạ, % công ty gộp vào doanh nghiệp có sẵn, % công ty tạo mới.',
    v_from_agency, v_merged, v_created;
END;
$$;

COMMENT ON TABLE agencies IS 'DEPRECATED 2026-09-27: đã gộp vào businesses. Giữ 2 tuần làm đường lùi rồi xoá.';
COMMENT ON TABLE broker_companies IS 'DEPRECATED 2026-09-27: đã gộp vào businesses. Giữ 2 tuần làm đường lùi rồi xoá.';
COMMENT ON COLUMN users.agency_id IS 'DEPRECATED 2026-09-27: dùng users.broker_company_id → businesses.';

-- Kiểm tra (chỉ đọc) — xem ngay sau khi chạy.
SELECT 'doanh nghiep theo trang thai' AS muc,
       string_agg(status || '=' || n, ', ' ORDER BY status) AS ket_qua
FROM (SELECT status, count(*) n FROM businesses GROUP BY status) t
UNION ALL
SELECT 'demo / that', count(*) FILTER (WHERE is_demo) || ' / ' || count(*) FILTER (WHERE NOT is_demo) FROM businesses
UNION ALL
SELECT 'moi gioi gan doanh nghiep', count(*)::text FROM users WHERE broker_company_id IS NOT NULL
UNION ALL
SELECT 'lien ket hong (phai = 0)', count(*)::text FROM users u
WHERE u.broker_company_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM businesses b WHERE b.id = u.broker_company_id)
UNION ALL
SELECT 'danh ba cu / businesses', (SELECT count(*) FROM agencies) || ' / ' || (SELECT count(*) FROM businesses);
