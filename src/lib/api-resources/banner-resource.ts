import { toVietnamIso8601 } from './carbon-format';

/** Đối chiếu BannerResource.php — mọi field đều khớp thẳng cột Prisma, không có schema drift. */
export function mapBannerResource(b: {
  id: bigint;
  title: string;
  slug: string;
  type: string;
  position: string;
  image_url: string;
  link_url: string | null;
  link_target: string;
  content: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at: Date | null;
  ends_at: Date | null;
  click_count: number;
  view_count: number;
  created_at: Date | null;
  updated_at: Date | null;
}) {
  return {
    id: b.id,
    title: b.title,
    slug: b.slug,
    type: b.type,
    position: b.position,
    image_url: b.image_url,
    link_url: b.link_url,
    link_target: b.link_target,
    content: b.content,
    sort_order: b.sort_order,
    is_active: b.is_active,
    starts_at: toVietnamIso8601(b.starts_at),
    ends_at: toVietnamIso8601(b.ends_at),
    click_count: b.click_count,
    view_count: b.view_count,
    created_at: toVietnamIso8601(b.created_at),
    updated_at: toVietnamIso8601(b.updated_at),
  };
}

/**
 * Port riêng cho response NGAY SAU KHI store() — Laravel's `Banner::create($data)` chỉ
 * insert các cột có trong $data (field client gửi lên); cột nào client không gửi thì để
 * Postgres tự áp DEFAULT (link_target='_self', sort_order=0, is_active=true,
 * click_count=0, view_count=0) NHƯNG Eloquent model trong bộ nhớ KHÔNG tự động refetch
 * các default đó sau INSERT (Postgres driver của Laravel chỉ RETURNING id) — nên response
 * của store() thật sự trả về null cho các field client không gửi, dù DB đã lưu đúng default
 * (verify qua GET lại ngay sau đó — giá trị đúng). Đây là hành vi THẬT cần replicate y hệt,
 * không phải bug cần sửa (client luôn GET lại nếu cần giá trị chính xác).
 */
export function mapBannerCreateResponse(
  input: Record<string, unknown>,
  created: { id: bigint; created_at: Date | null; updated_at: Date | null }
) {
  return {
    id: created.id,
    title: input.title ?? null,
    slug: input.slug ?? null,
    type: input.type ?? null,
    position: input.position ?? null,
    image_url: input.image_url ?? null,
    link_url: input.link_url ?? null,
    link_target: input.link_target ?? null,
    content: input.content ?? null,
    sort_order: input.sort_order ?? null,
    is_active: input.is_active ?? null,
    starts_at: input.starts_at ? toVietnamIso8601(new Date(input.starts_at as string)) : null,
    ends_at: input.ends_at ? toVietnamIso8601(new Date(input.ends_at as string)) : null,
    click_count: input.click_count ?? null,
    view_count: input.view_count ?? null,
    created_at: toVietnamIso8601(created.created_at),
    updated_at: toVietnamIso8601(created.updated_at),
  };
}
