-- Chuẩn hoá vai trò tài khoản (Notion 29/09 "Database – Role", "Rà soát Role Name").
-- Chạy SAU các file 01→06. Chạy lại nhiều lần vẫn an toàn.
--
-- Chỉ còn 3 giá trị: user | agent (môi giới — khách gọi "broker") | admin.
--   'agency' (cũ): chuyển thành 'agent' — Doanh nghiệp / Sàn nay là bảng businesses, không phải role.
--   Giá trị lạ khác (nếu có): về 'user', quyền thấp nhất.
-- Mỗi dòng bị đổi đều ghi user_audit_logs để tra lại.

BEGIN;

WITH old AS (
  SELECT id, role FROM users
  WHERE role IS NULL OR role NOT IN ('user', 'agent', 'admin')
  FOR UPDATE
), changed AS (
  UPDATE users u
  SET role = CASE WHEN old.role = 'agency' THEN 'agent' ELSE 'user' END,
      updated_at = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
  FROM old
  WHERE u.id = old.id
  RETURNING u.id, u.role AS new_role, old.role AS old_role
)
INSERT INTO user_audit_logs (user_id, admin_id, action, before_state, after_state, created_at)
SELECT id, NULL, 'role_normalized',
       jsonb_build_object('role', old_role), jsonb_build_object('role', new_role),
       (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
FROM changed;

-- Chặn ghi giá trị role lạ ở tầng DB (ứng dụng cũng đã chặn ở lib/roles.ts).
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'agent', 'admin'));

COMMIT;

-- Kiểm tra (chỉ đọc).
SELECT role, count(*) AS so_tai_khoan FROM users GROUP BY role ORDER BY role;
