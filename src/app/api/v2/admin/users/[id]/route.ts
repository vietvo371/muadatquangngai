import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, hashPassword, TOKENABLE_TYPE } from '@/lib/auth';
import { dbNow } from '@/lib/db-time';
import { apiError, apiSuccess } from '@/lib/api-response';
import { mapUserResource } from '@/lib/api-resources/user-resource';
import { FieldError, validationErrorResponse, isString, isEmail, inList } from '@/lib/validation';

const ROLES = ['user', 'agent', 'agency', 'admin'] as const;
const STATUSES = ['active', 'inactive', 'banned'] as const;

/** PUT /api/v2/admin/users/[id] — port của AdminUserController@update. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy người dùng.', 404);
  const user = await db.users.findUnique({ where: { id: BigInt(id) } });
  if (!user) return apiError('Không tìm thấy người dùng.', 404);

  // Sửa một tài khoản đã xoá (vd. đặt status lại 'active') sẽ "khôi phục" nửa vời: tài khoản sống
  // lại nhưng tin vẫn ẩn và lịch sử xoá không có dòng khôi phục tương ứng.
  if (user.status === 'deleted') return apiError('Tài khoản này đã bị xoá, không thể chỉnh sửa.', 409);

  const body = await request.json().catch(() => ({}));
  const errors: FieldError[] = [];

  if ('name' in body && (!isString(body.name) || body.name.length > 255)) {
    errors.push(new FieldError('name', 'Trường họ và tên không được lớn hơn 255 ký tự.'));
  }
  if ('email' in body) {
    if (!isString(body.email) || !isEmail(body.email)) errors.push(new FieldError('email', 'Trường địa chỉ email phải là địa chỉ email hợp lệ.'));
    else {
      const dup = await db.users.findFirst({ where: { email: body.email, id: { not: user.id } }, select: { id: true } });
      if (dup) errors.push(new FieldError('email', 'Trường địa chỉ email đã được sử dụng.'));
    }
  }
  if ('password' in body && body.password != null && body.password !== '' && (!isString(body.password) || body.password.length < 8)) {
    errors.push(new FieldError('password', 'Trường mật khẩu phải có ít nhất 8 ký tự.'));
  }
  if ('role' in body && !inList(body.role, ROLES)) errors.push(new FieldError('role', 'Giá trị đã chọn trong trường vai trò không hợp lệ.'));
  if ('status' in body && !inList(body.status, STATUSES)) errors.push(new FieldError('status', 'Giá trị đã chọn trong trường status không hợp lệ.'));
  if (errors.length > 0) return validationErrorResponse(errors);

  // Không cho hạ quyền tài khoản admin (đối chiếu Laravel).
  if (user.role === 'admin' && 'role' in body && body.role && body.role !== 'admin') {
    return apiError('Không thể hạ quyền tài khoản admin.', 403);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = { updated_at: new Date() };
  if ('name' in body) data.name = body.name;
  if ('email' in body) data.email = body.email;
  if ('phone' in body) data.phone = body.phone;
  if ('role' in body) data.role = body.role;
  if ('status' in body) data.status = body.status;
  if ('password' in body && body.password) data.password = await hashPassword(body.password);

  const updated = await db.users.update({ where: { id: user.id }, data });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return apiSuccess(mapUserResource(updated as any, guard.id), 'Cập nhật tài khoản thành công!');
}

/**
 * DELETE /api/v2/admin/users/[id] — XOÁ MỀM tài khoản (Notion 24/09, khách chốt "Option A").
 *
 * Không xoá bản ghi: mọi khoá ngoại trỏ vào users đều ON DELETE CASCADE, xoá cứng là mất sạch tin,
 * giao dịch tiền, tin nhắn của người đó. Thay vào đó, trong MỘT giao dịch:
 *  1. status = 'deleted' + deleted_at + deleted_by (admin thực hiện)
 *  2. tin đang hiện / chờ duyệt chuyển sang 'inactive' ("Tạm ẩn") — không xoá tin, ảnh, giao dịch
 *  3. thu hồi mọi phiên đăng nhập
 *  4. ghi user_audit_logs trạng thái trước/sau, kèm danh sách tin đã ẩn để khôi phục được về sau
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy người dùng.', 404);
  const user = await db.users.findUnique({
    where: { id: BigInt(id) },
    select: { id: true, name: true, role: true, status: true },
  });
  if (!user) return apiError('Không tìm thấy người dùng.', 404);
  if (user.status === 'deleted') return apiError('Tài khoản này đã được xoá trước đó.', 409);
  if (user.id === guard.id) return apiError('Không thể tự xoá tài khoản của chính mình.', 403);
  if (user.role === 'admin') return apiError('Không thể xoá tài khoản quản trị viên.', 403);

  const now = dbNow();
  const result = await db.$transaction(async (tx) => {
    const visible = await tx.properties.findMany({
      where: { user_id: user.id, status: { in: ['active', 'pending'] } },
      select: { id: true, status: true },
    });
    const totalListings = await tx.properties.count({ where: { user_id: user.id } });

    if (visible.length > 0) {
      await tx.properties.updateMany({
        where: { id: { in: visible.map((p) => p.id) } },
        data: { status: 'inactive', updated_at: now },
      });
    }
    await tx.users.update({
      where: { id: user.id },
      data: { status: 'deleted', deleted_at: now, deleted_by: guard.id, updated_at: now },
    });
    const revoked = await tx.personal_access_tokens.deleteMany({
      where: { tokenable_id: user.id, tokenable_type: TOKENABLE_TYPE },
    });
    await tx.user_audit_logs.create({
      data: {
        user_id: user.id,
        admin_id: guard.id,
        action: 'soft_delete',
        before_state: {
          status: user.status,
          role: user.role,
          total_listings: totalListings,
          hidden_properties: visible.map((p) => ({ id: p.id.toString(), status: p.status })),
        },
        after_state: {
          status: 'deleted',
          properties_hidden: visible.length,
          sessions_revoked: revoked.count,
        },
        created_at: now,
      },
    });
    return { hidden: visible.length, totalListings };
  });

  return apiSuccess(
    { id: user.id, status: 'deleted', properties_hidden: result.hidden, total_listings: result.totalListings },
    `Đã xoá người dùng ${user.name}. ${result.hidden} tin đang hiển thị đã chuyển sang Tạm ẩn.`
  );
}
