import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';
import { dbNow } from '@/lib/db-time';
import { FieldError, validationErrorResponse } from '@/lib/validation';
import { BROKER_ROLE } from '@/lib/broker-eligibility';
import { isImageUrl, loadBrokerProfile } from '@/lib/broker-profile';

/**
 * PUT /api/v2/my/broker-profile/certification — môi giới nộp / nộp lại hồ sơ chứng chỉ hành nghề.
 * Luôn đưa hồ sơ về 'pending' và tắt is_certified: đổi số chứng chỉ hay ảnh thì admin phải xem lại.
 * Client KHÔNG đặt được is_certified hay status — chỉ admin duyệt mới bật (Notion "User – is_certified").
 */
export async function PUT(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();
  if (user.role !== BROKER_ROLE) return apiError('Chỉ tài khoản môi giới mới cần xác thực chứng chỉ hành nghề.', 403);

  const body = await request.json().catch(() => ({}));
  const certificateNumber = typeof body.certificate_number === 'string' ? body.certificate_number.trim() : '';
  const issuedBy = typeof body.issued_by === 'string' ? body.issued_by.trim() : '';
  const issuedDateRaw = typeof body.issued_date === 'string' ? body.issued_date.trim() : '';

  const errors: FieldError[] = [];
  if (!certificateNumber || certificateNumber.length > 100) errors.push(new FieldError('certificate_number', 'Vui lòng nhập số chứng chỉ (tối đa 100 ký tự).'));
  if (!issuedBy || issuedBy.length > 255) errors.push(new FieldError('issued_by', 'Vui lòng nhập nơi cấp.'));
  const issuedDate = /^\d{4}-\d{2}-\d{2}$/.test(issuedDateRaw) ? new Date(`${issuedDateRaw}T00:00:00Z`) : null;
  if (!issuedDate || Number.isNaN(issuedDate.getTime())) errors.push(new FieldError('issued_date', 'Ngày cấp không hợp lệ.'));
  else if (issuedDate.getTime() > Date.now()) errors.push(new FieldError('issued_date', 'Ngày cấp không được ở tương lai.'));
  if (!isImageUrl(body.front_image)) errors.push(new FieldError('front_image', 'Vui lòng tải lên ảnh mặt trước chứng chỉ.'));
  if (!isImageUrl(body.back_image)) errors.push(new FieldError('back_image', 'Vui lòng tải lên ảnh mặt sau chứng chỉ.'));
  if (errors.length > 0) return validationErrorResponse(errors);

  const now = dbNow();
  const fields = {
    certificate_number: certificateNumber,
    issued_date: issuedDate as Date,
    issued_by: issuedBy,
    front_image: body.front_image as string,
    back_image: body.back_image as string,
    status: 'pending',
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    updated_at: now,
  };
  await db.$transaction([
    db.broker_certifications.upsert({
      where: { user_id: user.id },
      create: { user_id: user.id, ...fields, created_at: now },
      update: fields,
    }),
    db.users.update({ where: { id: user.id }, data: { is_certified: false, updated_at: now } }),
  ]);

  return apiSuccess(await loadBrokerProfile(user.id), 'Đã gửi hồ sơ chứng chỉ. Admin sẽ kiểm tra và phản hồi sớm.');
}
