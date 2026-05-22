import PropertiesClient from "./properties-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản Lý Tin Đăng",
  description: "Xem xét hồ sơ, phê duyệt hoặc từ chối các tin đăng bất động sản trên sàn Bất Động Sản Quảng Ngãi.",
};

export default function Page() {
  return <PropertiesClient />;
}
