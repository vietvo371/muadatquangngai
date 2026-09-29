import { db } from '@/lib/db';
import { dbNow } from '@/lib/db-time';
import { BROKER_PROFILE_URL } from '@/lib/broker-review';
import { isAdminRole, isBrokerRole, roleLabel, type Role } from '@/lib/roles';

/**
 * Đổi vai trò tài khoản — MỘT đường duy nhất cho mọi màn admin (Notion 29/09 "Nâng cấp User → Môi
 * giới", "Refresh Token / Force Logout", "Cache / Session").
 *
 * Token đăng nhập không chứa role: mỗi request server đọc lại users.role (lib/auth.ts), nên quyền mới
 * có hiệu lực ngay từ request kế tiếp, không cần đăng xuất. Phía trình duyệt tự tải lại hồ sơ khi
 * mở trang / quay lại tab (hooks/useSyncCurrentUser.ts); thông báo gửi kèm để người dùng biết.
 */

export class RoleChangeError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

interface RoleChangeTarget {
  id: bigint;
  role: string;
  status: string;
}

/** Kiểm tra quy tắc, ném RoleChangeError nếu không được đổi. Trả false khi role không đổi. */
export function assertRoleChangeAllowed(target: RoleChangeTarget, newRole: Role, adminId: bigint): boolean {
  if (target.status === 'deleted') throw new RoleChangeError('Tài khoản đã bị xoá, không thể đổi vai trò.', 422);
  if (target.id === adminId && newRole !== target.role) {
    throw new RoleChangeError('Không thể tự đổi vai trò của chính mình.', 403);
  }
  if (isAdminRole(target.role) && !isAdminRole(newRole)) {
    throw new RoleChangeError('Không thể hạ quyền tài khoản admin.', 403);
  }
  return newRole !== target.role;
}

function roleChangeNotice(newRole: Role) {
  if (isBrokerRole(newRole)) {
    return {
      title: 'Tài khoản đã được nâng cấp thành Môi giới',
      body: 'Để tin đăng được hiển thị, vui lòng gửi chứng chỉ hành nghề và chọn Công ty/Sàn giao dịch trong Hồ sơ.',
      action_url: BROKER_PROFILE_URL,
    };
  }
  return {
    title: 'Vai trò tài khoản đã thay đổi',
    body: `Tài khoản của bạn hiện là: ${roleLabel(newRole)}.`,
    action_url: '/dashboard/profile',
  };
}

/**
 * Các thao tác ghi đi kèm một lần đổi role: nhật ký (user_audit_logs) + thông báo cho chủ tài khoản.
 * Trả về danh sách promise Prisma để gộp chung $transaction với lệnh cập nhật users.
 */
export function roleChangeSideEffects(target: RoleChangeTarget, newRole: Role, adminId: bigint) {
  const now = dbNow();
  const notice = roleChangeNotice(newRole);
  return [
    db.user_audit_logs.create({
      data: {
        user_id: target.id,
        admin_id: adminId,
        action: 'role_changed',
        before_state: { role: target.role },
        after_state: { role: newRole },
        created_at: now,
      },
    }),
    db.notifications.create({
      data: {
        user_id: target.id,
        type: 'system',
        title: notice.title,
        body: notice.body,
        data: { action_url: notice.action_url, role: newRole },
        is_read: false,
        created_at: now,
        updated_at: now,
      },
    }),
  ];
}
