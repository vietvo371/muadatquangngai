import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

/**
 * GET /api/v2/build-id — mã bản build đang chạy trên máy chủ.
 *
 * Dùng để phát hiện "trang đang mở là bản CŨ". Sau mỗi lần deploy, tab nào mở từ trước vẫn giữ
 * mã Server Action của bản cũ; bấm nút sẽ lỗi "Failed to find Server Action" và thao tác im lặng
 * không chạy (log production đang có hơn 60 lỗi loại này). Client so mã này với mã lúc mở trang,
 * khác nhau thì mời người dùng tải lại.
 */

export const dynamic = 'force-dynamic';

let cached: string | null = null;

export async function GET() {
  if (!cached) {
    cached = await readFile(path.join(process.cwd(), '.next', 'BUILD_ID'), 'utf8')
      .then((s) => s.trim())
      // Không đọc được (chạy dev, đường dẫn khác) thì trả rỗng — client sẽ bỏ qua, không báo nhầm.
      .catch(() => '');
  }
  return NextResponse.json({ build_id: cached }, { headers: { 'Cache-Control': 'no-store' } });
}
