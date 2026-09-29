/**
 * Vai trò tài khoản — nguồn DUY NHẤT cho cả server lẫn giao diện (Notion 29/09 "Rà soát Role Name").
 *
 * Chỉ có 3 giá trị lưu trong users.role:
 *   user  — Người dùng thường
 *   agent — Môi giới (khách gọi là "broker"; điều kiện chứng chỉ + Công ty/Sàn áp cho role này)
 *   admin — Quản trị viên
 *
 * Giá trị cũ 'agency' đã chuyển hết sang 'agent' (prisma/sql/2026-09-29-07-roles.sql) và DB có
 * CHECK chặn giá trị lạ. Doanh nghiệp / Sàn là bảng `businesses`, không phải một role.
 *
 * File này không import db — dùng được ở client component.
 */

export const ROLES = ['user', 'agent', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const BROKER_ROLE = 'agent' satisfies Role;
export const ADMIN_ROLE = 'admin' satisfies Role;

export const ROLE_LABELS: Record<Role, string> = {
  user: 'Người dùng thường',
  agent: 'Môi giới',
  admin: 'Quản trị viên',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export const isBrokerRole = (role: string | null | undefined) => role === BROKER_ROLE;
export const isAdminRole = (role: string | null | undefined) => role === ADMIN_ROLE;

/** Nhãn hiển thị; giá trị lạ (dữ liệu cũ) coi như người dùng thường, giống cách server phân quyền. */
export function roleLabel(role: string | null | undefined): string {
  return isRole(role) ? ROLE_LABELS[role] : ROLE_LABELS.user;
}
