-- Notion 24/09 nhóm "Chứng chỉ môi giới + Công ty/Sàn". Chạy SAU file 01. Chạy được nhiều lần.
-- KHÔNG sửa dữ liệu có sẵn: mọi tài khoản bắt đầu với is_certified = false, chưa gắn công ty.

CREATE TABLE IF NOT EXISTS broker_companies (
  id               bigserial PRIMARY KEY,
  name             varchar(255) NOT NULL,
  tax_code         varchar(20)  NULL,
  address          varchar(500) NULL,
  phone            varchar(20)  NULL,
  email            varchar(255) NULL,
  status           varchar(20)  NOT NULL DEFAULT 'pending',
  rejection_reason varchar(500) NULL,
  created_by       bigint       NULL,
  approved_by      bigint       NULL,
  approved_at      timestamp(0) NULL,
  created_at       timestamp(0) NULL,
  updated_at       timestamp(0) NULL
);
CREATE INDEX IF NOT EXISTS idx_broker_companies_status ON broker_companies (status);
-- Một mã số thuế chỉ ứng với một công ty (bỏ qua dòng chưa có MST).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_broker_companies_tax_code ON broker_companies (tax_code) WHERE tax_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS broker_certifications (
  id                 bigserial PRIMARY KEY,
  user_id            bigint       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  certificate_number varchar(100) NOT NULL,
  issued_date        date         NOT NULL,
  issued_by          varchar(255) NOT NULL,
  front_image        varchar(500) NOT NULL,
  back_image         varchar(500) NOT NULL,
  status             varchar(20)  NOT NULL DEFAULT 'pending',
  rejection_reason   varchar(500) NULL,
  reviewed_by        bigint       NULL,
  reviewed_at        timestamp(0) NULL,
  created_at         timestamp(0) NULL,
  updated_at         timestamp(0) NULL
);
-- Mỗi môi giới một hồ sơ; nộp lại thì cập nhật chính dòng đó về 'pending'.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_broker_certifications_user_id ON broker_certifications (user_id);
CREATE INDEX IF NOT EXISTS idx_broker_certifications_status ON broker_certifications (status);

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_certified boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS broker_company_id bigint NULL
  REFERENCES broker_companies (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_broker_company_id ON users (broker_company_id);
