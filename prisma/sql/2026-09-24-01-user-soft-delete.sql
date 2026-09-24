-- Notion 24/09 "Xóa user – Soft Delete" + "Audit / Lịch sử xóa".
-- Chạy được nhiều lần (IF NOT EXISTS). KHÔNG xoá hay sửa dữ liệu có sẵn.
--
-- Không gắn khoá ngoại tới users: mọi FK trỏ vào users trong DB này đều ON DELETE CASCADE,
-- nếu gắn thì lịch sử xoá sẽ tự mất theo đúng thứ nó phải ghi lại.

ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at timestamp(0) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by bigint NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);

CREATE TABLE IF NOT EXISTS user_audit_logs (
  id           bigserial PRIMARY KEY,
  user_id      bigint       NOT NULL,
  admin_id     bigint       NULL,
  action       varchar(50)  NOT NULL,
  before_state jsonb        NULL,
  after_state  jsonb        NULL,
  created_at   timestamp(0) NULL
);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_user_id ON user_audit_logs (user_id);
