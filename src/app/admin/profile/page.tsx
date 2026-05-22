import ProfileClient from "./profile-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hồ Sơ Quản Trị Viên",
  description: "Quản lý thông tin cá nhân, cập nhật mật khẩu bảo mật và cấu hình liên kết tài khoản quản trị.",
};

export default function Page() {
  return <ProfileClient />;
}
