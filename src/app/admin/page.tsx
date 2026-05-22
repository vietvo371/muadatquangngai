import DashboardClient from "./dashboard-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bảng Điều Khiển",
  description: "Báo cáo vận hành & Phân tích thị trường Bất Động Sản Quảng Ngãi dành cho quản trị viên.",
};

export default function Page() {
  return <DashboardClient />;
}
