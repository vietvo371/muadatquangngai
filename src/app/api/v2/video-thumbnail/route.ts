import { NextResponse } from 'next/server';
import { parseVimeoId } from '@/lib/video-sources';

/**
 * GET /api/v2/video-thumbnail?url=... — ảnh đại diện của video Vimeo.
 *
 * Vimeo không có đường dẫn ảnh đoán được như YouTube; phải hỏi dịch vụ oEmbed công khai của
 * Vimeo (không cần khoá API, không cần tài khoản). Gọi ở phía máy chủ để trình duyệt người xem
 * không phải gọi thẳng sang Vimeo và để tận dụng bộ nhớ đệm.
 *
 * Chỉ nhận link Vimeo — các nguồn khác đã có ảnh lấy trực tiếp, không đi qua đây.
 */

/** Giữ kết quả 1 ngày: ảnh đại diện của một video gần như không đổi. */
export const revalidate = 86400;

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('url') ?? '';
  const vimeoId = parseVimeoId(url);
  if (!vimeoId) {
    return NextResponse.json({ success: false, message: 'Chỉ hỗ trợ link Vimeo.' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${vimeoId}`)}`,
      { next: { revalidate } }
    );
    if (!res.ok) throw new Error(`Vimeo trả ${res.status}`);
    const data = (await res.json()) as { thumbnail_url?: string };
    const thumbnail = typeof data.thumbnail_url === 'string' ? data.thumbnail_url : null;
    return NextResponse.json({ success: true, data: { thumbnail } });
  } catch (error) {
    // Vimeo lỗi hoặc video riêng tư: trả về không có ảnh, ô video sẽ dùng nền tối kèm biểu
    // tượng play thay vì hỏng cả trang.
    console.error('[video-thumbnail] Không lấy được ảnh Vimeo:', error);
    return NextResponse.json({ success: true, data: { thumbnail: null } });
  }
}
