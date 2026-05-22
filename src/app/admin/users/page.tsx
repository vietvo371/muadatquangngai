import UsersClient from "./users-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản Lý Người Dùng",
  description: "Kiểm soát danh sách tài khoản, phân quyền và trạng thái hoạt động môi giới Quảng Ngãi.",
};

export default function Page() {
  return <UsersClient />;
}
