import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, hashPassword } from '@/lib/auth';
import { apiPaginated, apiSuccess, buildPaginationMeta } from '@/lib/api-response';
import { mapAdminUserRawDump } from '@/lib/api-resources/admin-user-resource';
import { mapUserResource } from '@/lib/api-resources/user-resource';
import { FieldError, validationErrorResponse, isString, isEmail, inList } from '@/lib/validation';

const ROLES = ['user', 'agent', 'agency', 'admin'] as const;
const STATUSES = ['active', 'inactive', 'banned'] as const;

/** GET /api/v2/admin/users — port của AdminUserController@index (raw dump, không qua UserResource). */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const perPage = 20;
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (role) where.role = role;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, rows] = await Promise.all([
    db.users.count({ where }),
    db.users.findMany({ where, orderBy: { created_at: 'desc' }, skip: (page - 1) * perPage, take: perPage }),
  ]);

  return apiPaginated(rows.map((u) => mapAdminUserRawDump(u)), buildPaginationMeta(total, page, perPage));
}

/** POST /api/v2/admin/users — port của AdminUserController@store. */
export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const errors: FieldError[] = [];

  if (!isString(body.name) || !body.name) errors.push(new FieldError('name', 'Trường họ và tên không được để trống.'));
  else if (body.name.length > 255) errors.push(new FieldError('name', 'Trường họ và tên không được lớn hơn 255 ký tự.'));

  if (!isString(body.email) || !body.email) errors.push(new FieldError('email', 'Trường địa chỉ email không được để trống.'));
  else if (!isEmail(body.email)) errors.push(new FieldError('email', 'Trường địa chỉ email phải là địa chỉ email hợp lệ.'));

  if (!isString(body.password) || !body.password) errors.push(new FieldError('password', 'Trường mật khẩu không được để trống.'));
  else if (body.password.length < 8) errors.push(new FieldError('password', 'Trường mật khẩu phải có ít nhất 8 ký tự.'));

  // required kiểm trước (thiếu -> message required), rồi mới in (có nhưng sai -> message in).
  if (body.role === undefined || body.role === null || body.role === '') {
    errors.push(new FieldError('role', 'Trường vai trò không được để trống.'));
  } else if (!inList(body.role, ROLES)) {
    errors.push(new FieldError('role', 'Giá trị đã chọn trong trường vai trò không hợp lệ.'));
  }
  if (body.status != null && body.status !== '' && !inList(body.status, STATUSES)) {
    errors.push(new FieldError('status', 'Giá trị đã chọn trong trường status không hợp lệ.'));
  }

  if (errors.length === 0 && isString(body.email)) {
    const dup = await db.users.findFirst({ where: { email: body.email }, select: { id: true } });
    if (dup) errors.push(new FieldError('email', 'Trường địa chỉ email đã được sử dụng.'));
  }
  if (errors.length === 0 && body.phone) {
    const dup = await db.users.findFirst({ where: { phone: body.phone }, select: { id: true } });
    if (dup) errors.push(new FieldError('phone', 'Trường số điện thoại đã được sử dụng.'));
  }
  if (errors.length > 0) return validationErrorResponse(errors);

  const now = new Date();
  const created = await db.users.create({
    data: {
      uuid: randomUUID(),
      name: body.name,
      email: body.email,
      password: await hashPassword(body.password),
      phone: body.phone ?? null,
      role: body.role,
      status: body.status ?? 'active',
      email_verified_at: now,
      created_at: now,
      updated_at: now,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return apiSuccess(mapUserResource(created as any, guard.id), 'Tạo tài khoản thành công!', 201);
}
