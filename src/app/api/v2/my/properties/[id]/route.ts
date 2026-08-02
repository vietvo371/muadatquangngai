import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';
import { mapPropertyResource } from '@/lib/api-resources/property-resource';
import { validateFeatureIds } from '@/lib/api-resources/property-validation';
import { FieldError, validationErrorResponse, isNumeric, isInteger, isBoolean, inList, isString } from '@/lib/validation';
import { slugify } from '@/lib/formatters';
import { VALID_IMAGE_CATEGORIES } from '@/lib/property-form-config';
import crypto from 'node:crypto';

const PROPERTY_INCLUDE = {
  provinces: { select: { id: true, name: true, slug: true } },
  districts: { select: { id: true, name: true, slug: true } },
  categories: { select: { id: true, name: true, slug: true, icon: true } },
  users: { select: { id: true, name: true, phone: true, avatar: true, role: true, rating: true, total_listings: true } },
  property_media: {
    select: { id: true, type: true, image_type: true, url: true, thumbnail: true, caption: true, is_primary: true, sort_order: true },
  },
  property_features: { include: { features: { select: { id: true, name: true, icon: true } } } },
} as const;

/** Giới hạn số ảnh (feedback I.4) — cùng nguồn setting với route tạo tin. */
async function getImageCountLimits(): Promise<{ min: number; max: number }> {
  const rows = await db.settings.findMany({
    where: { group: 'property', key: { in: ['property_images_min', 'property_images_limit'] } },
    select: { key: true, value: true },
  });
  const map = new Map(rows.map((r) => [r.key, Number(r.value)]));
  const min = map.get('property_images_min');
  const max = map.get('property_images_limit');
  return {
    min: Number.isFinite(min) && (min as number) > 0 ? (min as number) : 5,
    max: Number.isFinite(max) && (max as number) > 0 ? (max as number) : 50,
  };
}

const DIRECTIONS = ['dong', 'tay', 'nam', 'bac', 'dong_bac', 'dong_nam', 'tay_bac', 'tay_nam'] as const;
const FURNITURE = ['none', 'basic', 'full'] as const;
const LEGAL = ['so_do', 'so_hong', 'contract', 'other'] as const;
const PRICE_UNIT = ['total', 'per_m2', 'per_month'] as const;

function randomSuffix(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(crypto.randomBytes(length))
    .map((b) => chars[b % chars.length])
    .join('');
}

async function loadWard(wardId: bigint | null) {
  if (wardId === null) return null;
  return db.wards.findUnique({ where: { id: wardId }, select: { id: true, name: true, slug: true } });
}

/** GET /api/v2/my/properties/[id] — port của PropertyController@showOwned. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy tin đăng hoặc bạn không có quyền.', 404);

  const property = await db.properties.findFirst({
    where: { id: BigInt(id), user_id: user.id },
    include: PROPERTY_INCLUDE,
  });
  if (!property) return apiError('Không tìm thấy tin đăng hoặc bạn không có quyền.', 404);

  const ward = await loadWard(property.ward_id);
  return apiSuccess(mapPropertyResource(property, ward));
}

/** PUT /api/v2/my/properties/[id] — port của PropertyController@update + UpdatePropertyRequest. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy tin đăng hoặc bạn không có quyền.', 404);

  const existing = await db.properties.findFirst({ where: { id: BigInt(id), user_id: user.id } });
  if (!existing) return apiError('Không tìm thấy tin đăng hoặc bạn không có quyền.', 404);

  const body = await request.json().catch(() => ({}));
  const errors: FieldError[] = [];

  // Mọi field đều 'sometimes' — chỉ validate khi CÓ mặt trong body (khớp UpdatePropertyRequest).
  if ('title' in body) {
    if (!isString(body.title) || !body.title) errors.push(new FieldError('title', 'Trường tiêu đề phải là chuỗi.'));
    else if (body.title.length > 500) errors.push(new FieldError('title', 'Trường tiêu đề không được lớn hơn 500 ký tự.'));
  }
  if ('description' in body) {
    if (!isString(body.description) || body.description.length < 50)
      errors.push(new FieldError('description', 'Trường mô tả phải có ít nhất 50 ký tự.'));
  }
  if ('type' in body && !inList(body.type, ['sell', 'rent'])) {
    errors.push(new FieldError('type', 'Giá trị đã chọn trong trường loại tin không hợp lệ.'));
  }
  if ('category_id' in body && !isInteger(body.category_id)) {
    errors.push(new FieldError('category_id', 'Trường danh mục phải là số nguyên.'));
  }
  if ('price' in body && (!isNumeric(body.price) || body.price < 0)) {
    errors.push(new FieldError('price', 'Trường giá phải là số.'));
  }
  if ('area' in body && (!isNumeric(body.area) || body.area < 1)) {
    errors.push(new FieldError('area', 'Trường diện tích phải ít nhất là 1.'));
  }
  if ('province_id' in body && !isInteger(body.province_id)) {
    errors.push(new FieldError('province_id', 'Trường tỉnh/thành phố phải là số nguyên.'));
  }
  if ('district_id' in body && !isInteger(body.district_id)) {
    errors.push(new FieldError('district_id', 'Trường quận/huyện phải là số nguyên.'));
  }
  if ('address' in body && (!isString(body.address) || !body.address)) {
    errors.push(new FieldError('address', 'Trường địa chỉ phải là chuỗi.'));
  }
  if ('price_unit' in body && body.price_unit !== null && !inList(body.price_unit, PRICE_UNIT)) {
    errors.push(new FieldError('price_unit', 'Giá trị đã chọn trong trường price_unit không hợp lệ.'));
  }
  if ('direction' in body && body.direction !== null && !inList(body.direction, DIRECTIONS)) {
    errors.push(new FieldError('direction', 'Giá trị đã chọn trong trường hướng nhà không hợp lệ.'));
  }
  if ('furniture' in body && body.furniture !== null && !inList(body.furniture, FURNITURE)) {
    errors.push(new FieldError('furniture', 'Giá trị đã chọn trong trường nội thất không hợp lệ.'));
  }
  if ('legal' in body && body.legal !== null && !inList(body.legal, LEGAL)) {
    errors.push(new FieldError('legal', 'Giá trị đã chọn trong trường pháp lý không hợp lệ.'));
  }
  if ('parking' in body && body.parking !== null && !isBoolean(body.parking)) {
    errors.push(new FieldError('parking', 'Trường chỗ để xe phải là đúng hoặc sai.'));
  }
  if ('feature_ids' in body) errors.push(...(await validateFeatureIds(body.feature_ids)));

  // Ảnh: sửa tin cho phép thay toàn bộ danh sách ảnh (thêm/xoá/sắp xếp/đổi phân loại) —
  // trước đây route này không xử lý field images gì cả nên ảnh không lưu được khi sửa tin.
  const imageLimits = await getImageCountLimits();
  if ('images' in body) {
    if (!Array.isArray(body.images)) {
      errors.push(new FieldError('images', 'Trường hình ảnh phải là một mảng.'));
    } else if (body.images.length < imageLimits.min) {
      errors.push(new FieldError('images', `Vui lòng tải lên tối thiểu ${imageLimits.min} ảnh.`));
    } else if (body.images.length > imageLimits.max) {
      errors.push(new FieldError('images', `Trường hình ảnh không được nhiều hơn ${imageLimits.max} ảnh.`));
    } else {
      for (let i = 0; i < body.images.length; i++) {
        const img = body.images[i];
        if (!img || !isString(img.url)) {
          errors.push(new FieldError(`images.${i}.url`, 'Trường đường dẫn ảnh không được để trống.'));
        } else if (img.url.length > 500) {
          errors.push(new FieldError(`images.${i}.url`, 'Trường đường dẫn ảnh không được lớn hơn 500 ký tự.'));
        }
        if (img?.image_type != null && !VALID_IMAGE_CATEGORIES.includes(img.image_type)) {
          errors.push(new FieldError(`images.${i}.image_type`, 'Phân loại ảnh không hợp lệ.'));
        }
      }
    }
  }

  if (errors.length > 0) return validationErrorResponse(errors);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = { updated_at: new Date() };

  if ('title' in body && body.title !== existing.title) {
    data.title = body.title;
    data.slug = `${slugify(body.title)}-${randomSuffix(6)}`; // đổi title -> regenerate slug, khớp Laravel
  }
  if ('description' in body) data.description = body.description;
  if ('type' in body) data.type = body.type;
  if ('category_id' in body) data.category_id = BigInt(body.category_id);

  if ('price' in body && Number(body.price) !== Number(existing.price)) {
    // Giá đổi -> lưu lịch sử giá CŨ trước khi update, khớp $property->priceHistories()->create(...)
    await db.price_histories.create({ data: { property_id: existing.id, price: existing.price } });
    data.price = String(body.price);
  }

  if ('price_unit' in body) data.price_unit = body.price_unit;
  if ('price_negotiable' in body) data.price_negotiable = Boolean(body.price_negotiable);
  if ('area' in body) data.area = String(body.area);
  if ('area_floor' in body) data.area_floor = body.area_floor != null ? String(body.area_floor) : null;
  if ('area_land' in body) data.area_land = body.area_land != null ? String(body.area_land) : null;
  if ('floors' in body) data.floors = body.floors;
  if ('bedrooms' in body) data.bedrooms = body.bedrooms;
  if ('bathrooms' in body) data.bathrooms = body.bathrooms;
  if ('toilets' in body) data.toilets = body.toilets;
  if ('parking' in body) data.parking = Boolean(body.parking);
  if ('direction' in body) data.direction = body.direction;
  if ('balcony_direction' in body) data.balcony_direction = body.balcony_direction;
  if ('furniture' in body) data.furniture = body.furniture;
  if ('legal' in body) data.legal = body.legal;
  if ('legal_note' in body) data.legal_note = body.legal_note;
  if ('province_id' in body) data.province_id = BigInt(body.province_id);
  if ('district_id' in body) data.district_id = BigInt(body.district_id);
  if ('ward_id' in body) data.ward_id = body.ward_id != null ? BigInt(body.ward_id) : null;
  if ('street' in body) data.street = body.street;
  if ('address' in body) data.address = body.address;
  if ('latitude' in body) data.latitude = body.latitude != null ? String(body.latitude) : null;
  if ('longitude' in body) data.longitude = body.longitude != null ? String(body.longitude) : null;
  if ('road_width' in body) data.road_width = body.road_width != null ? String(body.road_width) : null;
  if ('facade' in body) data.facade = body.facade != null ? String(body.facade) : null;
  if ('depth' in body) data.depth = body.depth != null ? String(body.depth) : null;
  if ('meta_title' in body) data.meta_title = body.meta_title;
  if ('meta_description' in body) data.meta_description = body.meta_description;

  await db.properties.update({ where: { id: existing.id }, data });

  if ('feature_ids' in body) {
    const featureIds: number[] = Array.isArray(body.feature_ids) ? body.feature_ids : [];
    await db.property_features.deleteMany({ where: { property_id: existing.id } }); // sync(): xoá hết rồi gắn lại
    if (featureIds.length > 0) {
      await db.property_features.createMany({
        data: featureIds.map((fid) => ({ property_id: existing.id, feature_id: BigInt(fid) })),
      });
    }
  }

  if ('images' in body && Array.isArray(body.images)) {
    const now = new Date();
    // Sync toàn bộ (giống feature_ids ở trên): xoá hết ảnh cũ của property rồi tạo lại đúng
    // thứ tự/ảnh bìa/phân loại từ payload — đơn giản và nhất quán hơn diff từng ảnh, chấp
    // nhận đổi hết `id` của property_media mỗi lần lưu (không có nơi nào khác lưu id ảnh cũ).
    await db.property_media.deleteMany({ where: { property_id: existing.id, type: 'image' } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawImages: Array<Record<string, any>> = body.images;
    if (rawImages.length > 0) {
      const primaryIdx = rawImages.findIndex((img) => Boolean(img.is_primary));
      await db.property_media.createMany({
        data: rawImages.map((img, i) => ({
          property_id: existing.id,
          type: 'image',
          image_type: isString(img.image_type) ? img.image_type : null,
          url: img.url as string,
          thumbnail: isString(img.thumbnail) && img.thumbnail.length <= 500 ? img.thumbnail : null,
          is_primary: i === (primaryIdx >= 0 ? primaryIdx : 0),
          sort_order: isInteger(img.sort_order) ? (img.sort_order as number) : i,
          created_at: now,
          updated_at: now,
        })),
      });
      const cover = rawImages[primaryIdx >= 0 ? primaryIdx : 0];
      data.thumbnail = cover?.thumbnail ?? cover?.url ?? null;
      await db.properties.update({ where: { id: existing.id }, data: { thumbnail: data.thumbnail } });
    } else {
      await db.properties.update({ where: { id: existing.id }, data: { thumbnail: null } });
    }
  }

  const updated = await db.properties.findUniqueOrThrow({ where: { id: existing.id }, include: PROPERTY_INCLUDE });
  const ward = await loadWard(updated.ward_id);

  return apiSuccess(mapPropertyResource(updated, ward), 'Cập nhật tin đăng thành công!');
}

/** DELETE /api/v2/my/properties/[id] — port của PropertyController@destroy (hard delete, không SoftDeletes). */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError('Không tìm thấy tin đăng hoặc bạn không có quyền.', 404);

  const existing = await db.properties.findFirst({ where: { id: BigInt(id), user_id: user.id } });
  if (!existing) return apiError('Không tìm thấy tin đăng hoặc bạn không có quyền.', 404);

  await db.properties.delete({ where: { id: existing.id } });

  const listingCount = await db.properties.count({ where: { user_id: user.id } });
  await db.users.update({ where: { id: user.id }, data: { total_listings: listingCount } });

  return apiSuccess(null, 'Xóa tin đăng thành công!');
}
