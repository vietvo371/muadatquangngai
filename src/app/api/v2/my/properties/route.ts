import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { apiPaginated, apiSuccess, apiError, buildPaginationMeta } from '@/lib/api-response';
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
  isValidPhone,
  isValidEmail,
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

/**
 * Ném ra khi trừ ví thất bại vì số dư không còn đủ tại thời điểm ghi (hai request song
 * song cùng tiêu tiền). Dùng lỗi riêng để rollback transaction rồi trả 402 thay vì 500.
 */
class InsufficientBalanceError extends Error {
  constructor() {
    super('insufficient_balance');
    this.name = 'InsufficientBalanceError';
  }
}

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
  // Cột legal_note là VARCHAR(500) — thiếu chặn ở đây thì chuỗi dài hơn làm Postgres báo lỗi
  // và người dùng nhận 500 thay vì thông báo đọc được.
  if (typeof body.legal_note === 'string' && body.legal_note.length > 500) {
    errors.push(new FieldError('legal_note', 'Trường mô tả pháp lý không được lớn hơn 500 ký tự.'));
  }
  if (body.parking !== undefined && body.parking !== null && !isBoolean(body.parking)) {
    errors.push(new FieldError('parking', 'Trường chỗ để xe phải là đúng hoặc sai.'));
  }
  if (body.price_negotiable !== undefined && body.price_negotiable !== null && !isBoolean(body.price_negotiable)) {
    errors.push(new FieldError('price_negotiable', 'Trường thương lượng giá phải là đúng hoặc sai.'));
  }
  errors.push(...(await validateFeatureIds(body.feature_ids)));

  // Thông tin liên hệ (spec mục 4.5): SĐT bắt buộc, email không bắt buộc nhưng nếu có
  // thì phải đúng định dạng. Mặc định form lấy từ tài khoản nhưng cho người đăng sửa.
  const contactPhone = isString(body.contact_phone) ? body.contact_phone.trim() : undefined;
  if (!contactPhone) {
    errors.push(new FieldError('contact_phone', 'Vui lòng nhập số điện thoại liên hệ.'));
  } else if (!isValidPhone(contactPhone)) {
    errors.push(new FieldError('contact_phone', 'Vui lòng nhập đúng định dạng số điện thoại.'));
  }

  const contactEmail = isString(body.contact_email) ? body.contact_email.trim() : '';
  if (contactEmail && !isValidEmail(contactEmail)) {
    errors.push(new FieldError('contact_email', 'Vui lòng nhập đúng định dạng email.'));
  }

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

  // Video (spec mục 7.2) — lưu chung property_media, phân biệt bằng cột type. Chỉ nhận
  // URL: video tải lên đã đi thẳng Cloudinary, còn lại là link YouTube.
  const rawVideos = body.videos;
  let videos: Array<{ url: string; thumbnail: string | null; sort_order: number }> = [];
  if (Array.isArray(rawVideos)) {
    if (rawVideos.length > 5) {
      errors.push(new FieldError('videos', 'Trường video không được nhiều hơn 5 video.'));
    } else {
      for (let i = 0; i < rawVideos.length; i++) {
        const url = rawVideos[i] && isString(rawVideos[i].url) ? rawVideos[i].url : undefined;
        if (!url) errors.push(new FieldError(`videos.${i}.url`, 'Trường đường dẫn video không được để trống.'));
        else if (url.length > 500) errors.push(new FieldError(`videos.${i}.url`, 'Trường đường dẫn video không được lớn hơn 500 ký tự.'));
      }
      if (errors.length === 0) {
        videos = rawVideos.map((v: Record<string, unknown>, i: number) => ({
          url: v.url as string,
          thumbnail: isString(v.thumbnail) && v.thumbnail.length <= 500 ? v.thumbnail : null,
          sort_order: isInteger(v.sort_order) ? (v.sort_order as number) : i,
        }));
      }
    }
  }

  if (errors.length > 0) return validationErrorResponse(errors);

  // ----- Gói đăng tin & thanh toán (spec mục 8) -----
  // Gói mặc định là gói rẻ nhất đang bán (thường là Tin Thường, giá 0).
  const activePackages = await db.packages.findMany({
    where: { is_active: true },
    orderBy: [{ sort_order: 'asc' }, { price: 'asc' }],
  });
  if (activePackages.length === 0) {
    return apiError('Hiện chưa có gói đăng tin nào khả dụng.', 503);
  }

  const pkg = body.package_id
    ? activePackages.find((p) => Number(p.id) === Number(body.package_id))
    : activePackages[0];
  if (!pkg) {
    return validationErrorResponse([new FieldError('package_id', 'Gói đăng tin không hợp lệ.')]);
  }

  const packagePrice = Number(pkg.price);

  // Khoá chống trùng: client gửi cùng một khoá cho mọi lần thử của CÙNG lượt đăng, nên
  // bấm "Thanh toán và đăng tin" hai lần chỉ trừ tiền một lần (spec mục 8.3).
  const idempotencyKey = isString(body.idempotency_key) ? body.idempotency_key.slice(0, 64) : null;
  if (idempotencyKey) {
    const existing = await db.transactions.findUnique({
      where: { idempotency_key: idempotencyKey },
      select: { reference_id: true },
    });
    if (existing?.reference_id) {
      // Lượt đăng này đã xử lý xong rồi — trả lại đúng tin đã tạo thay vì trừ tiền lần nữa.
      const already = await db.properties.findUnique({
        where: { id: existing.reference_id },
        include: PROPERTY_INCLUDE,
      });
      if (already) {
        const w = already.ward_id
          ? await db.wards.findUnique({ where: { id: already.ward_id }, select: { id: true, name: true, slug: true } })
          : null;
        return apiSuccess(mapPropertyResource(already, w), 'Tin đăng đã được tạo trước đó.', 200);
      }
    }
  }

  if (packagePrice > 0 && Number(user.balance) < packagePrice) {
    return apiError(
      `Số dư không đủ để thanh toán gói ${pkg.name} (${packagePrice.toLocaleString('vi-VN')}đ). Vui lòng nạp thêm tiền.`,
      402
    );
  }

  const primaryImage = images.find((img) => img.is_primary) ?? images[0];

  const now = new Date();
  const expiredAt = new Date(now.getTime() + pkg.duration_days * 24 * 60 * 60 * 1000);
  const slug = `${slugify(title!)}-${randomSuffix(6)}`;

  // Chốt chặn cuối: kể cả client gửi thừa (hoặc gọi API trực tiếp), trường không thuộc
  // nhóm BĐS của danh mục vẫn không được ghi xuống DB — spec mục 11 yêu cầu rõ điều này.
  const group = getPropertyGroup(Number(categoryId));
  const forGroup = <T,>(field: Parameters<typeof isFieldVisible>[1], value: T): T | null =>
    isFieldVisible(group, field) ? value : null;

  // Trừ tiền, tạo tin, ghi giao dịch và subscription phải cùng sống hoặc cùng chết —
  // không được có chuyện trừ tiền xong mà tin không tạo ra, hay ngược lại (spec mục 8.3).
  const created = await db.$transaction(async (tx) => {
    const property = await tx.properties.create({
    data: {
      uuid: crypto.randomUUID(),
      user_id: user.id,
      category_id: BigInt(categoryId),
      slug,
      type: type!,
      status: 'pending', // PropertyStatus::Pending — tin mới luôn chờ duyệt
      is_vip: pkg.type,
      vip_expired_at: packagePrice > 0 ? expiredAt : null,
      expired_at: expiredAt,
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
      // Chú thích chỉ có nghĩa khi pháp lý bị lọc bỏ theo nhóm cũng phải biến mất theo — nếu
      // không, tin đất chuyển sang nhóm khác vẫn còn câu mô tả pháp lý mồ côi trong DB.
      legal_note: forGroup('legal', body.legal ?? null) ? (body.legal_note ?? null) : null,
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
      contact_name: isString(body.contact_name) ? body.contact_name.trim() : user.name,
      contact_phone: contactPhone!,
      contact_email: contactEmail || null,
      contact_address: isString(body.contact_address) ? body.contact_address.trim() : null,
      thumbnail: primaryImage?.thumbnail ?? primaryImage?.url ?? null,
      published_at: now,
      created_at: now,
      updated_at: now,
      // Nested create — property + ảnh ghi chung một transaction ngầm của Prisma,
      // không sinh tin mồ côi không ảnh nếu bước ghi ảnh lỗi.
      ...((images.length > 0 || videos.length > 0) && {
        property_media: {
          create: [
            ...images.map((img) => ({
              type: 'image',
              url: img.url,
              thumbnail: img.thumbnail,
              is_primary: img.is_primary,
              sort_order: img.sort_order,
              created_at: now,
              updated_at: now,
            })),
            // Video xếp sau ảnh trong cùng danh sách media; ảnh bìa luôn là ảnh.
            ...videos.map((v) => ({
              type: 'video',
              url: v.url,
              thumbnail: v.thumbnail,
              is_primary: false,
              sort_order: images.length + v.sort_order,
              created_at: now,
              updated_at: now,
            })),
          ],
        },
      }),
    },
    include: PROPERTY_INCLUDE,
    });

    // Nhóm đất không có mục tiện ích — bỏ qua kể cả khi client cố gửi lên.
    const featureIds: number[] =
      isFieldVisible(group, 'utilities') && Array.isArray(body.feature_ids) ? body.feature_ids : [];
    if (featureIds.length > 0) {
      await tx.property_features.createMany({
        data: featureIds.map((fid) => ({ property_id: property.id, feature_id: BigInt(fid) })),
      });
    }

    // Gói trả phí: trừ ví, ghi giao dịch, ghi subscription. Gói miễn phí bỏ qua toàn bộ
    // phần này — không tạo giao dịch 0 đồng cho khỏi rác bảng transactions.
    let transactionId: bigint | null = null;
    if (packagePrice > 0) {
      // Trừ tiền có điều kiện số dư vẫn đủ, để hai request song song không cùng trừ trên
      // một số dư cũ. updateMany trả về count = 0 nếu điều kiện không còn đúng.
      const deducted = await tx.users.updateMany({
        where: { id: user.id, balance: { gte: packagePrice } },
        data: { balance: { decrement: packagePrice } },
      });
      if (deducted.count === 0) {
        throw new InsufficientBalanceError();
      }

      const transaction = await tx.transactions.create({
        data: {
          uuid: crypto.randomUUID(),
          user_id: user.id,
          type: 'package_purchase',
          method: 'wallet',
          amount: String(packagePrice),
          status: 'completed',
          reference_type: 'property',
          reference_id: property.id,
          idempotency_key: idempotencyKey,
          note: `Thanh toán gói ${pkg.name} cho tin đăng #${property.id}`,
          created_at: now,
          updated_at: now,
        },
      });
      transactionId = transaction.id;
    }

    await tx.subscriptions.create({
      data: {
        user_id: user.id,
        property_id: property.id,
        package_id: pkg.id,
        transaction_id: transactionId,
        status: 'active',
        started_at: now,
        expired_at: expiredAt,
        created_at: now,
        updated_at: now,
      },
    });

    // Đếm lại từ DB (không phải tăng dần) — khớp $request->user()->properties()->count()
    // của Laravel, tự phục hồi nếu có drift thay vì cộng dồn sai lệch theo thời gian.
    const listingCount = await tx.properties.count({ where: { user_id: user.id } });
    await tx.users.update({ where: { id: user.id }, data: { total_listings: listingCount } });

    return property;
  }).catch((e) => {
    if (e instanceof InsufficientBalanceError) return null;
    throw e;
  });

  if (!created) {
    return apiError('Số dư không đủ để thanh toán. Vui lòng nạp thêm tiền.', 402);
  }

  return apiSuccess(mapPropertyResource(created, null), 'Tạo tin đăng thành công!', 201);
}
