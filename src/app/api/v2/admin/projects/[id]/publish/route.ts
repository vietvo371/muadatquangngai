import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiError } from '@/lib/api-response';

/**
 * PUT /api/v2/admin/projects/[id]/publish — port của AdminProjectController@publish.
 *
 * BUG THẬT trong Laravel, verify bằng cách tạo project test và gọi endpoint thật: code gọi
 * `$project->update(['status' => 'published', 'published_at' => now()])` nhưng 'published'
 * KHÔNG phải case hợp lệ của enum ProjectStatus (chỉ có draft/upcoming/selling/paused/
 * completed/archived) — Eloquent's backed-enum cast ném ValueError NGAY khi fill() gán giá
 * trị, TRƯỚC CẢ khi kịp UPDATE database. Endpoint này 500 mọi lần gọi, KHÔNG BAO GIỜ hoạt
 * động (xác nhận: status project test không đổi sau khi gọi). `published_at` cũng không
 * phải cột thật trên bảng projects (chỉ có ở bảng posts/properties) nên dù không crash sớm
 * thì key này cũng bị Eloquent mass-assignment bỏ qua vì không có trong $fillable.
 *
 * Next.js replicate đúng hành vi THẬT — luôn 500, không ghi DB — thay vì đoán ý đồ sản
 * phẩm (publish nên chuyển sang trạng thái nào: upcoming hay selling). Cần quyết định sản
 * phẩm rồi sửa cả 2 nơi (route Laravel gốc + route Next.js này) khi có thời gian.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy dự án.', 404);
  const project = await db.projects.findUnique({ where: { id: BigInt(id) } });
  if (!project) return apiError('Không tìm thấy dự án.', 404);

  return NextResponse.json({ message: '"published" is not a valid backing value for enum App\\Enums\\ProjectStatus' }, { status: 500 });
}
