import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { apiPaginated, apiSuccess, buildPaginationMeta } from '@/lib/api-response';
import { getAuthUser, unauthenticatedResponse } from '@/lib/auth';
import { mapPropertyResource, type WardRow } from '@/lib/api-resources/property-resource';
import { validateFeatureIds } from '@/lib/api-resources/property-validation';
import { FieldError, validationErrorResponse, isNumeric, isInteger, isBoolean, inList, isString } from '@/lib/validation';
import { slugify } from '@/lib/formatters';
import {
  getPropertyGroup,
  isFieldVisible,
  VALID_DIRECTIONS,
  VALID_FURNITURE,
  VALID_LEGAL,
  VALID_PRICE_UNITS,
} from '@/lib/property-form-config';

const PROPERTY_INCLUDE = {
  provinces: { select: { id: true, name: true, slug: true } },
  districts: { select: { id: true, name: true, slug: true } },
  categories: { select: { id: true, name: true, slug: true, icon: true } },
  users: { select: { id: true, name: true, phone: true, avatar: true, role: true, rating: true, total_listings: true } },
  property_media: {
    select: { id: true, type: true, url: true, thumbnail: true, caption: true, is_primary: true, sort_order: true },
  },
} as const;

// Danh sách giá trị hợp lệ lấy từ property-form-config để client và server không lệch
// nhau — chỗ nào form cho chọn thì API phải nhận, và ngược lại.
const DIRECTIONS = VALID_DIRECTIONS;
const FURNITURE = VALID_FURNITURE;
const LEGAL = VALID_LEGAL;
const PRICE_UNIT = VALID_PRICE_UNITS;

/** Str::random(6) — khớp charset alnum trộn hoa/thường của Laravel. */
function randomSuffix(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(crypto.randomBytes(length))
    .map((b) => chars[b % chars.length])
    .join('');
}

/** GET /api/v2/my/properties — port của PropertyController@myProperties. */
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const { searchParams } = new URL(request.url);
  const perPage = 20; // Laravel: ->paginate(20), không nhận per_page qua query ở route này
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const where = { user_id: user.id };
  const [total, rows] = await Promise.all([
    db.properties.count({ where }),
    db.properties.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: PROPERTY_INCLUDE,
    }),
  ]);

  const wardIds = [...new Set(rows.map((r) => r.ward_id).filter((id): id is bigint => id !== null))];
  const wards: WardRow[] = wardIds.length
    ? await db.wards.findMany({ where: { id: { in: wardIds } }, select: { id: true, name: true, slug: true } })
    : [];
  const wardMap = new Map(wards.map((w) => [w.id.toString(), w]));

  const data = rows.map((row) =>
    mapPropertyResource(row, row.ward_id !== null ? (wardMap.get(row.ward_id.toString()) ?? null) : null)
  );

  return apiPaginated(data, buildPaginationMeta(total, page, perPage));
}

/** POST /api/v2/my/properties — port của PropertyController@store + StorePropertyRequest. */
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthenticatedResponse();

  const body = await request.json().catch(() => ({}));
  const errors: FieldError[] = [];

  // Thứ tự field khớp StorePropertyRequest::rules() để "(and N more errors)" đúng thứ tự.
  const title = isString(body.title) ? body.title : undefined;
  if (!title) errors.push(new FieldError('title', 'Trường tiêu đề không được để trống.'));
  else if (title.length > 500) errors.push(new FieldError('title', 'Trường tiêu đề không được lớn hơn 500 ký tự.'));

  const description = isString(body.description) ? body.description : undefined;
  if (!description) errors.push(new FieldError('description', 'Trường mô tả không được để trống.'));
  else if (description.length < 50) errors.push(new FieldError('description', 'Trường mô tả phải có ít nhất 50 ký tự.'));

  const type = body.type;
  if (!type) errors.push(new FieldError('type', 'Trường loại tin không được để trống.'));
  else if (!inList(type, ['sell', 'rent'])) errors.push(new FieldError('type', 'Giá trị đã chọn trong trường loại tin không hợp lệ.'));

  const categoryId = body.category_id;
  if (categoryId === undefined || categoryId === null) errors.push(new FieldError('category_id', 'Trường danh mục không được để trống.'));
  else if (!isInteger(categoryId)) errors.push(new FieldError('category_id', 'Trường danh mục phải là số nguyên.'));

  const price = body.price;
  if (price === undefined || price === null) errors.push(new FieldError('price', 'Trường giá không được để trống.'));
  else if (!isNumeric(price) || price < 0) errors.push(new FieldError('price', 'Trường giá phải là số.'));

  const area = body.area;
  if (area === undefined || area === null) errors.push(new FieldError('area', 'Trường diện tích không được để trống.'));
  else if (!isNumeric(area) || area < 1) errors.push(new FieldError('area', 'Trường diện tích phải ít nhất là 1.'));

  const provinceId = body.province_id;
  if (provinceId === undefined || provinceId === null) errors.push(new FieldError('province_id', 'Trường tỉnh/thành phố không được để trống.'));
  else if (!isInteger(provinceId)) errors.push(new FieldError('province_id', 'Trường tỉnh/thành phố phải là số nguyên.'));

  const districtId = body.district_id;
  if (districtId === undefined || districtId === null) errors.push(new FieldError('district_id', 'Trường quận/huyện không được để trống.'));
  else if (!isInteger(districtId)) errors.push(new FieldError('district_id', 'Trường quận/huyện phải là số nguyên.'));

  const address = isString(body.address) ? body.address : undefined;
  if (!address) errors.push(new FieldError('address', 'Trường địa chỉ không được để trống.'));
  else if (address.length > 500) errors.push(new FieldError('address', 'Trường địa chỉ không được lớn hơn 500 ký tự.'));

  if (body.price_unit !== undefined && body.price_unit !== null && !inList(body.price_unit, PRICE_UNIT)) {
    errors.push(new FieldError('price_unit', 'Giá trị đã chọn trong trường price_unit không hợp lệ.'));
  }
  if (body.direction !== undefined && body.direction !== null && !inList(body.direction, DIRECTIONS)) {
    errors.push(new FieldError('direction', 'Giá trị đã chọn trong trường hướng nhà không hợp lệ.'));
  }
  if (body.furniture !== undefined && body.furniture !== null && !inList(body.furniture, FURNITURE)) {
    errors.push(new FieldError('furniture', 'Giá trị đã chọn trong trường nội thất không hợp lệ.'));
  }
  if (body.legal !== undefined && body.legal !== null && !inList(body.legal, LEGAL)) {
    errors.push(new FieldError('legal', 'Giá trị đã chọn trong trường pháp lý không hợp lệ.'));
  }
  if (body.parking !== undefined && body.parking !== null && !isBoolean(body.parking)) {
    errors.push(new FieldError('parking', 'Trường chỗ để xe phải là đúng hoặc sai.'));
  }
  if (body.price_negotiable !== undefined && body.price_negotiable !== null && !isBoolean(body.price_negotiable)) {
    errors.push(new FieldError('price_negotiable', 'Trường thương lượng giá phải là đúng hoặc sai.'));
  }
  errors.push(...(await validateFeatureIds(body.feature_ids)));

  // Ảnh: client upload thẳng lên Cloudinary rồi gửi kèm URL. Chỉ nhận URL (không nhận
  // file) nên chỉ cần validate kiểu và độ dài khớp cột VarChar(500).
  const rawImages = body.images;
  let images: Array<{ url: string; thumbnail: string | null; is_primary: boolean; sort_order: number }> = [];
  if (rawImages !== undefined && rawImages !== null) {
    if (!Array.isArray(rawImages)) {
      errors.push(new FieldError('images', 'Trường hình ảnh phải là một mảng.'));
    } else if (rawImages.length > 20) {
      errors.push(new FieldError('images', 'Trường hình ảnh không được nhiều hơn 20 ảnh.'));
    } else {
      for (let i = 0; i < rawImages.length; i++) {
        const img = rawImages[i];
        const url = img && isString(img.url) ? img.url : undefined;
        if (!url) {
          errors.push(new FieldError(`images.${i}.url`, 'Trường đường dẫn ảnh không được để trống.'));
        } else if (url.length > 500) {
          errors.push(new FieldError(`images.${i}.url`, 'Trường đường dẫn ảnh không được lớn hơn 500 ký tự.'));
        }
      }
      if (errors.length === 0) {
        images = rawImages.map((img: Record<string, unknown>, i: number) => ({
          url: img.url as string,
          thumbnail: isString(img.thumbnail) && img.thumbnail.length <= 500 ? img.thumbnail : null,
          is_primary: Boolean(img.is_primary),
          sort_order: isInteger(img.sort_order) ? (img.sort_order as number) : i,
        }));
        // Luôn đảm bảo đúng 1 ảnh đại diện — nếu client không đánh dấu thì lấy ảnh đầu.
        const primaryIdx = images.findIndex((img) => img.is_primary);
        images = images.map((img, i) => ({
          ...img,
          is_primary: i === (primaryIdx >= 0 ? primaryIdx : 0),
        }));
      }
    }
  }

  if (errors.length > 0) return validationErrorResponse(errors);

  const primaryImage = images.find((img) => img.is_primary) ?? images[0];

  const now = new Date();
  const slug = `${slugify(title!)}-${randomSuffix(6)}`;

  // Chốt chặn cuối: kể cả client gửi thừa (hoặc gọi API trực tiếp), trường không thuộc
  // nhóm BĐS của danh mục vẫn không được ghi xuống DB — spec mục 11 yêu cầu rõ điều này.
  const group = getPropertyGroup(Number(categoryId));
  const forGroup = <T,>(field: Parameters<typeof isFieldVisible>[1], value: T): T | null =>
    isFieldVisible(group, field) ? value : null;

  const created = await db.properties.create({
    data: {
      uuid: crypto.randomUUID(),
      user_id: user.id,
      category_id: BigInt(categoryId),
      slug,
      type: type!,
      status: 'pending', // PropertyStatus::Pending — tin mới luôn chờ duyệt
      title: title!,
      description: description!,
      price: String(price),
      price_unit: body.price_unit ?? 'total',
      price_negotiable: Boolean(body.price_negotiable ?? false),
      area: String(area),
      area_floor: body.area_floor != null ? String(body.area_floor) : null,
      area_land: body.area_land != null ? String(body.area_land) : null,
      floors: forGroup('floors', body.floors ?? null),
      bedrooms: forGroup('bedrooms', body.bedrooms ?? null),
      bathrooms: forGroup('bathrooms', body.bathrooms ?? null),
      toilets: forGroup('toilets', body.toilets ?? null),
      parking: Boolean(body.parking ?? false),
      direction: forGroup('direction', body.direction ?? null),
      balcony_direction: forGroup('balcony_direction', body.balcony_direction ?? null),
      furniture: forGroup('furniture', body.furniture ?? 'none') ?? 'none',
      legal: forGroup('legal', body.legal ?? null),
      legal_note: body.legal_note ?? null,
      province_id: BigInt(provinceId),
      district_id: BigInt(districtId),
      ward_id: body.ward_id != null ? BigInt(body.ward_id) : null,
      street: body.street ?? null,
      address: address!,
      latitude: body.latitude != null ? String(body.latitude) : null,
      longitude: body.longitude != null ? String(body.longitude) : null,
      road_width: forGroup('road_width', body.road_width != null ? String(body.road_width) : null),
      facade: forGroup('facade', body.facade != null ? String(body.facade) : null),
      depth: body.depth != null ? String(body.depth) : null,
      meta_title: body.meta_title ?? null,
      meta_description: body.meta_description ?? null,
      thumbnail: primaryImage?.thumbnail ?? primaryImage?.url ?? null,
      published_at: now,
      created_at: now,
      updated_at: now,
      // Nested create — property + ảnh ghi chung một transaction ngầm của Prisma,
      // không sinh tin mồ côi không ảnh nếu bước ghi ảnh lỗi.
      ...(images.length > 0 && {
        property_media: {
          create: images.map((img) => ({
            type: 'image',
            url: img.url,
            thumbnail: img.thumbnail,
            is_primary: img.is_primary,
            sort_order: img.sort_order,
            created_at: now,
            updated_at: now,
          })),
        },
      }),
    },
    include: PROPERTY_INCLUDE,
  });

  // Nhóm đất không có mục tiện ích — bỏ qua kể cả khi client cố gửi lên.
  const featureIds: number[] =
    isFieldVisible(group, 'utilities') && Array.isArray(body.feature_ids) ? body.feature_ids : [];
  if (featureIds.length > 0) {
    await db.property_features.createMany({
      data: featureIds.map((fid) => ({ property_id: created.id, feature_id: BigInt(fid) })),
    });
  }

  // Đếm lại từ DB (không phải tăng dần) — khớp $request->user()->properties()->count()
  // của Laravel, tự phục hồi nếu có drift thay vì cộng dồn sai lệch theo thời gian.
  const listingCount = await db.properties.count({ where: { user_id: user.id } });
  await db.users.update({ where: { id: user.id }, data: { total_listings: listingCount } });

  return apiSuccess(mapPropertyResource(created, null), 'Tạo tin đăng thành công!', 201);
}
