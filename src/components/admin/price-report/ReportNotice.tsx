import { Info } from 'lucide-react';
import { formatMonth } from '@/lib/price-report-api';

/**
 * Ghi chú nguồn và nguyên tắc (Notion 24/09): dữ liệu từ tin đăng chỉ là Giá rao bán; hệ thống chỉ
 * đưa dữ liệu lịch sử và % biến động, không kết luận hay khuyến nghị đầu tư.
 */
export function ReportNotice({ source, firstMonth }: { source: string; firstMonth: string | null }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="space-y-1">
        {source === 'transaction' ? (
          <p>
            <span className="font-medium text-gray-900">Giá giao dịch</span> chỉ được ghi nhận khi có dữ liệu giao
            dịch thực tế đã xác nhận. Hiện hệ thống chưa có nguồn giao dịch nào.
          </p>
        ) : (
          <p>
            Số liệu là <span className="font-medium text-gray-900">Giá rao bán</span> lấy từ tin đăng bán trên website,
            không phải giá giao dịch thực tế. Giá trung vị là chỉ số đại diện; giá thấp/cao nhất đã loại các tin
            có giá bất thường.
            {firstMonth && ` Dữ liệu bắt đầu từ tháng ${formatMonth(firstMonth)}.`}
          </p>
        )}
        <p>Báo cáo chỉ cung cấp dữ liệu lịch sử và mức biến động, không đưa ra nhận định thị trường hay khuyến nghị đầu tư.</p>
      </div>
    </div>
  );
}
