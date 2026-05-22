import TransactionsClient from './transactions-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản Lý Giao Dịch | Quản trị Bất Động Sản Quảng Ngãi',
  description: 'Duyệt giao dịch nạp tiền ví, thanh toán gói VIP và hoàn tiền của các tài khoản môi giới.',
};

export default function Page() {
  return <TransactionsClient />;
}
