import ReportsClient from "./reports-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Báo Cáo Vi Phạm",
  description: "Giám sát, xem xét và xử lý các báo cáo vi phạm nội dung và hành vi từ thành viên trên sàn Bất Động Sản Quảng Ngãi.",
};

export default function Page() {
  return <ReportsClient />;
}
