import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse, verifyPassword } from '@/lib/auth';
import { FieldError, validationErrorResponse, isString } from '@/lib/validation';

/**
 * POST /api/v2/user/account/close — người dùng tự đóng tài khoản.
 *
 * VÌ SAO KHÔNG XOÁ CỨNG: mọi khoá ngoại trỏ vào `users` đều là `onDelete: Cascade` — xoá một user
 * sẽ xoá dây chuyền cả `properties`, `transactions`, `subscriptions`, `messages`, `conversations`,
 * `posts`, `projects`. Tức là xoá tài khoản đồng nghĩa xoá sạch LỊCH SỬ GIAO DỊCH TIỀN của người
 * đó, sổ sách không còn đối chiếu được, và người mua từng nhắn tin cũng mất hội thoại. Bảng
 * `users` cũng không có cột `deleted_at` nên chưa có hạ tầng soft-delete.
 *
 * Cách làm: dùng lại chính cơ chế `users.status` đang chạy sẵn, thêm giá trị `closed` (phân biệt
 * với `banned` do admin khoá — cần cho hỗ trợ và thống kê). Tin đăng bị ẩn khỏi trang công khai,
 * dữ liệu tài chính giữ nguyên.
 *
 * CHẶN khi số dư > 0: bắt người dùng dùng hết hoặc liên hệ rút trước, tránh tranh chấp tiền sau
 * khi tài khoản đã đóng.
 */
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const body = await request.json().catch(() => ({}));

  // Xác nhận bằng mật khẩu — hành động không tự hoàn tác được từ phía người dùng.
  if (!isString(body.password) || body.password.length === 0) {
    return validationErrorResponse([
      new FieldError('password', 'Vui lòng nhập mật khẩu để xác nhận đóng tài khoản.'),
    ]);
  }

  const fresh = await db.users.findUnique({
    where: { id: user.id },
    select: { id: true, password: true, status: true, balance: true, role: true },
  });
  if (!fresh) return unauthenticatedResponse();

  if (!(await verifyPassword(body.password, fresh.password))) {
    return validationErrorResponse([new FieldError('password', 'Mật khẩu không chính xác.')]);
  }

  if (fresh.status === 'closed') {
    return apiError('Tài khoản này đã được đóng trước đó.', 409);
  }

  // Quản trị viên tự đóng tài khoản của mình có thể khoá luôn đường vào khu quản trị.
  if (fresh.role === 'admin') {
    return apiError('Tài khoản quản trị không thể tự đóng. Vui lòng liên hệ bộ phận kỹ thuật.', 403);
  }

  const balance = Number(fresh.balance) || 0;
  if (balance > 0) {
    return apiError(
      `Tài khoản còn ${balance.toLocaleString('vi-VN')} đ trong ví. Vui lòng sử dụng hết hoặc liên hệ hỗ trợ để rút trước khi đóng tài khoản.`,
      422
    );
  }

  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.users.update({
      where: { id: fresh.id },
      data: { status: 'closed', updated_at: now },
    });

    // Ẩn tin đang hiển thị để không còn ai liên hệ được người đã đóng tài khoản. Giữ nguyên bản
    // ghi (không xoá) để lịch sử giao dịch và thống kê vẫn khớp.
    await tx.properties.updateMany({
      where: { user_id: fresh.id, status: 'active' },
      data: { status: 'inactive', updated_at: now },
    });

    // Thu hồi mọi phiên đăng nhập hiện có.
    await tx.personal_access_tokens.deleteMany({
      where: { tokenable_id: fresh.id, tokenable_type: 'App\\Models\\User' },
    });
  });

  return apiSuccess(null, 'Đã đóng tài khoản. Cảm ơn bạn đã sử dụng dịch vụ.');
}
