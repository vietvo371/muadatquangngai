import { toast } from 'sonner';

/**
 * Chia sẻ trang đang xem.
 *
 * Có ba nút "Chia sẻ" nằm ở ba chỗ khác nhau (chi tiết tin, chi tiết dự án, hồ sơ môi giới) và
 * cả ba đều từng là nút chết. Gom về một chỗ để không phải viết lại logic — và để lần sau đổi
 * cách chia sẻ thì chỉ sửa một nơi.
 *
 * Điện thoại có hộp chia sẻ sẵn của hệ điều hành; máy tính thì chép link vào bộ nhớ tạm.
 */
export async function shareCurrentPage(title: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const url = window.location.href;

  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success('Đã chép liên kết.');
  } catch (error) {
    // Người dùng bấm huỷ hộp chia sẻ — không phải lỗi, đừng làm phiền họ.
    if ((error as { name?: string })?.name === 'AbortError') return;
    toast.error('Không chia sẻ được. Bạn có thể chép link trên thanh địa chỉ.');
  }
}
