import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { isString } from '@/lib/validation';
import { db } from '@/lib/db';
import {
  getPropertyGroup,
  isFieldVisible,
  directionText,
  legalText,
  furnitureText,
  type GroupField,
} from '@/lib/property-form-config';

/**
 * POST /api/v2/ai/generate-listing
 *
 * Sinh tiêu đề / mô tả tin đăng từ dữ liệu người dùng đã nhập (spec mục 4.6).
 *
 * Chạy ở server chứ không gọi thẳng từ trình duyệt để khoá API không lộ ra client, và để
 * ràng buộc nội dung sinh ra bằng prompt cố định thay vì tin vào input phía người dùng.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// llama-3.3-70b-versatile bị Groq gỡ (404 model_not_found) → dùng gpt-oss-120b (còn khả dụng
// cho key này, hỗ trợ response_format json_object). Kiểm tra lại danh sách model qua
// GET https://api.groq.com/openai/v1/models nếu lại lỗi model_not_found.
const MODEL = 'openai/gpt-oss-120b';

/** Giới hạn theo spec mục 10.2 — tiêu đề ngắn, mô tả vừa đủ đọc. */
const TITLE_MAX = 99;

type Mode = 'title' | 'description' | 'both';

/**
 * Chỉ mô tả những trường thuộc nhóm BĐS đang chọn. Spec yêu cầu rõ với nhóm đất: "Không đưa
 * các thông tin về phòng ngủ, phòng tắm, số tầng hoặc nội thất vào nội dung."
 */
function buildFacts(body: Record<string, unknown>, categoryName: string): string {
  const group = getPropertyGroup(Number(body.category_id));
  const lines: string[] = [`- Loại bất động sản: ${categoryName}`];

  const address = [body.street, body.ward_name, body.district_name, body.province_name]
    .filter((v) => isString(v) && v.trim())
    .join(', ');
  if (address) lines.push(`- Địa chỉ: ${address}`);

  const price = Number(body.price);
  if (body.price_unit === 'negotiable') lines.push('- Mức giá: thoả thuận');
  else if (Number.isFinite(price) && price > 0) {
    const unit = body.price_unit === 'per_m2' ? ' mỗi m²' : '';
    lines.push(`- Mức giá: ${price.toLocaleString('vi-VN')} đồng${unit}`);
  }

  const area = Number(body.area);
  if (Number.isFinite(area) && area > 0) lines.push(`- Diện tích: ${area} m²`);

  // Bảng trường riêng theo nhóm — khoá nào không thuộc nhóm thì bỏ hẳn khỏi prompt.
  const optional: Array<[GroupField, string, string | null]> = [
    ['bedrooms', 'Số phòng ngủ', Number(body.bedrooms) > 0 ? String(body.bedrooms) : null],
    ['bathrooms', 'Số phòng tắm', Number(body.bathrooms) > 0 ? String(body.bathrooms) : null],
    ['toilets', 'Số nhà vệ sinh', Number(body.toilets) > 0 ? String(body.toilets) : null],
    ['floors', 'Số tầng', Number(body.floors) > 0 ? String(body.floors) : null],
    ['direction', group === 'land' ? 'Hướng đất' : 'Hướng nhà', body.direction ? directionText(String(body.direction)) : null],
    ['balcony_direction', 'Hướng ban công', body.balcony_direction ? directionText(String(body.balcony_direction)) : null],
    ['road_width', 'Đường vào', Number(body.road_width) > 0 ? `${body.road_width} m` : null],
    ['facade', 'Mặt tiền', Number(body.facade) > 0 ? `${body.facade} m` : null],
    ['legal', 'Pháp lý', body.legal ? legalText(String(body.legal)) : null],
    ['furniture', 'Nội thất', body.furniture && body.furniture !== 'none' ? furnitureText(String(body.furniture)) : null],
  ];
  for (const [field, label, value] of optional) {
    if (value && isFieldVisible(group, field)) lines.push(`- ${label}: ${value}`);
  }

  if (isFieldVisible(group, 'utilities') && Array.isArray(body.feature_names) && body.feature_names.length > 0) {
    lines.push(`- Tiện ích: ${body.feature_names.filter(isString).join(', ')}`);
  }

  return lines.join('\n');
}

const SYSTEM_PROMPT = `Bạn là trợ lý viết tin rao bán bất động sản tại Việt Nam.

QUY TẮC BẮT BUỘC:
- Chỉ dùng đúng những thông tin được cung cấp. Tuyệt đối không bịa thêm chi tiết nào khác
  (không tự thêm tiện ích, khoảng cách, tên trường học, chợ, bệnh viện, quy hoạch...).
- Không cam kết hay gợi ý về lợi nhuận, khả năng tăng giá, "sinh lời", "giá sẽ tăng".
- Không dùng từ ngữ gây hiểu nhầm hoặc thổi phồng ("rẻ nhất thị trường", "duy nhất", "hiếm có").
- Không chèn số điện thoại, email, tên người, link hay bất kỳ thông tin liên hệ nào.
- Viết tiếng Việt tự nhiên, rõ ràng, đúng văn phong rao bán bất động sản.
- Không dùng emoji, không viết hoa toàn bộ, không dùng nhiều dấu chấm than.
- Trả lời đúng định dạng JSON được yêu cầu, không thêm lời dẫn nào khác.`;

function userPrompt(mode: Mode, facts: string, descriptionMin: number): string {
  const wantTitle = mode === 'title' || mode === 'both';
  const wantDesc = mode === 'description' || mode === 'both';

  const parts = [`Thông tin bất động sản:\n${facts}\n`];
  parts.push('Hãy tạo nội dung tin đăng từ đúng những thông tin trên.');
  if (wantTitle) parts.push(`- "title": tiêu đề tối đa ${TITLE_MAX} ký tự, nêu loại BĐS, khu vực và điểm nổi bật nhất.`);
  if (wantDesc) parts.push(`- "description": mô tả tối thiểu ${descriptionMin} ký tự, khoảng 3-5 câu, có thể xuống dòng.`);
  parts.push(`\nTrả về JSON đúng dạng: {${wantTitle ? '"title": "..."' : ''}${wantTitle && wantDesc ? ', ' : ''}${wantDesc ? '"description": "..."' : ''}}`);
  return parts.join('\n');
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return apiError('Tính năng viết nội dung bằng AI chưa được cấu hình.', 503);
  }

  const body = await request.json().catch(() => ({}));
  const mode: Mode = body.mode === 'title' || body.mode === 'description' ? body.mode : 'both';

  if (!body.category_id) {
    return apiError('Vui lòng chọn danh mục bất động sản trước khi tạo nội dung.', 422);
  }

  const category = await db.categories.findUnique({
    where: { id: BigInt(Number(body.category_id)) },
    select: { name: true },
  });
  if (!category) return apiError('Danh mục không hợp lệ.', 422);

  const descriptionMinRow = await db.settings.findUnique({
    where: { key: 'property_description_min' },
    select: { value: true },
  });
  const descriptionMin = Number(descriptionMinRow?.value) || 50;

  const facts = buildFacts(body, category.name);

  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt(mode, facts, descriptionMin) },
        ],
        temperature: 0.7,
        max_tokens: 900,
        response_format: { type: 'json_object' },
      }),
      // Người dùng đang đợi trước màn hình — thà báo lỗi sớm còn hơn treo form.
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    return apiError('Không kết nối được dịch vụ AI. Vui lòng thử lại.', 503);
  }

  if (!res.ok) {
    // 429 = hết hạn mức miễn phí của Groq, nói rõ để người dùng biết đường chờ.
    if (res.status === 429) {
      return apiError('Dịch vụ AI đang quá tải. Vui lòng thử lại sau ít phút.', 429);
    }
    return apiError('Không tạo được nội dung. Vui lòng thử lại.', 502);
  }

  const payload = await res.json().catch(() => null);
  const raw = payload?.choices?.[0]?.message?.content;
  if (!isString(raw)) return apiError('Không tạo được nội dung. Vui lòng thử lại.', 502);

  let parsed: { title?: unknown; description?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return apiError('Không tạo được nội dung. Vui lòng thử lại.', 502);
  }

  const title = isString(parsed.title) ? parsed.title.trim().slice(0, TITLE_MAX) : undefined;
  const description = isString(parsed.description) ? parsed.description.trim() : undefined;

  if (!title && !description) {
    return apiError('Không tạo được nội dung. Vui lòng thử lại.', 502);
  }

  return apiSuccess({ title, description });
}
