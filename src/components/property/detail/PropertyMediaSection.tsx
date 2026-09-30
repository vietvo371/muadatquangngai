'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';
import Image from 'next/image';
import { IMAGE_CATEGORY_OPTIONS, VALID_IMAGE_CATEGORIES } from '@/lib/property-form-config';
import { parseYoutubeId } from '@/components/shared/ImageUploader';
import { PropertyImageSlider } from './PropertyImageSlider';
import { PropertyGalleryLightbox, type GalleryTabKey } from './PropertyGalleryLightbox';
import { PropertyMediaThumbnails, type MediaThumbnail } from './PropertyMediaThumbnails';

/**
 * Ảnh đại diện của video YouTube — lấy theo mã video trên máy chủ ảnh công khai của YouTube,
 * không cần khoá API. Video tự tải lên (mp4...) chưa trích được khung hình nên trả null, ô sẽ
 * hiện nền tối kèm biểu tượng play (Notion 30/09 "Video – Fallback").
 */
function youtubeThumbnail(url: string): string | undefined {
  const id = parseYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined;
}

/**
 * Khung hình đầu của video tải lên Cloudinary: đổi đuôi file sang .jpg là Cloudinary tự dựng
 * ảnh, không tốn thêm dịch vụ và không cần khoá API.
 */
function cloudinaryVideoFrame(url: string): string | undefined {
  if (!/^https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\//.test(url)) return undefined;
  return `${url.replace(/\.[A-Za-z0-9]+$/, '')}.jpg`;
}

/** Ảnh đại diện của video, theo thứ tự nguồn đáng tin cậy nhất. */
function videoCover(video: PropertyMediaFile): string | undefined {
  return (
    youtubeThumbnail(video.url) ??
    cloudinaryVideoFrame(video.url) ??
    // `thumbnail` của API rơi về chính đường dẫn video khi người đăng không tải ảnh riêng —
    // dùng thẳng thì ô video trống trơn, nên chỉ nhận khi nó thực sự khác đường dẫn video.
    (video.thumbnail && video.thumbnail !== video.url ? video.thumbnail : undefined)
  );
}

export interface PropertyMediaImage {
  id?: number;
  url: string;
  thumbnail?: string;
  image_type?: string | null;
  is_primary?: boolean;
  sort_order?: number;
}

export interface PropertyMediaFile {
  id?: number;
  url: string;
  thumbnail?: string;
}

interface PropertyMediaSectionProps {
  /** Mảng URL ảnh phẳng, đã có fallback (thumbnail/ảnh mặc định) — dùng cho hero + slider,
   * giữ nguyên hành vi cũ của HeroGallery. */
  media: string[];
  /** Ảnh có đủ metadata (image_type/sort_order) — dùng để nhóm theo loại (III.3/III.6). Có thể
   * rỗng với dữ liệu cũ; khi đó phần nhóm ảnh bị bỏ qua, hero/slider vẫn dùng `media` như cũ. */
  images: PropertyMediaImage[];
  videos: PropertyMediaFile[];
  tour360Url?: string;
  floorPlans: PropertyMediaFile[];
  latitude?: number;
  longitude?: number;
  /** Dữ liệu cho CTA trong album ảnh (Gọi / Chia sẻ / Lưu tin) — optional, thiếu thì ẩn nút
   * tương ứng, không gọi API mới. */
  propertyId?: number | string;
  propertyTitle?: string;
  contactPhone?: string;
}

/**
 * Trang chi tiết James Edition (Đợt 4, III.1-III.8, trừ Street View đã bỏ) — thay `HeroGallery`
 * ở 2 trang chi tiết. Giữ nguyên phần hero-grid + các section media trên trang; phần xem ảnh
 * toàn màn hình tách sang `PropertyGalleryLightbox` (album) và `PropertyImageSlider` (1 ảnh).
 */
export function PropertyMediaSection({
  media,
  images,
  videos,
  tour360Url,
  floorPlans,
  latitude,
  longitude,
  propertyId,
  propertyTitle,
  contactPhone,
}: PropertyMediaSectionProps) {
  const [sliderIndex, setSliderIndex] = useState<number | null>(null);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [albumTab, setAlbumTab] = useState<GalleryTabKey>('photos');
  const [albumCategory, setAlbumCategory] = useState<string | null>(null);

  if (media.length === 0) return null;

  const extraCount = media.length - 3;

  const handleOpen = (index: number) => setSliderIndex(index);

  // Các ô trên thanh Thumbnail Media: "Tất cả ảnh" trước, rồi từng nhóm ảnh theo thứ tự cấu
  // hình đăng tin, cuối cùng là Video / Tour 360 / Mặt bằng / Đường phố nếu tin có.
  /**
   * Ảnh nền của mỗi ô PHẢI là media của chính nhóm đó (Notion 30/09 "Thumbnail Media – Data
   * Binding", "Category Isolation"). Nhóm nào không có ảnh riêng thì để trống — component tự vẽ
   * ô nền tối kèm biểu tượng, KHÔNG mượn ảnh bìa của tin như bản trước.
   */
  const thumbnails: MediaThumbnail[] = [];

  // "Tất cả ảnh": ưu tiên ảnh bìa người đăng chọn, không có thì ảnh đầu tiên.
  const primaryImage = images.find((img) => img.is_primary) ?? images[0];
  thumbnails.push({
    key: 'all',
    label: 'Tất cả ảnh',
    count: media.length,
    cover: primaryImage?.thumbnail || primaryImage?.url || media[0],
    icon: 'all',
  });

  const byType = new Map<string, PropertyMediaImage[]>();
  for (const img of images) {
    const key = img.image_type && VALID_IMAGE_CATEGORIES.includes(img.image_type) ? img.image_type : 'other';
    if (!byType.has(key)) byType.set(key, []);
    byType.get(key)!.push(img);
  }
  // Tin chưa phân loại ảnh: mọi ảnh rơi vào một nhóm duy nhất, trùng hệt "Tất cả ảnh" —
  // bỏ ô nhóm đó đi cho đỡ thừa.
  const onlyOneGroup = byType.size <= 1;
  for (const option of IMAGE_CATEGORY_OPTIONS) {
    const items = byType.get(option.value);
    if (!items?.length || onlyOneGroup) continue;
    thumbnails.push({
      key: option.value,
      label: option.label,
      count: items.length,
      cover: items[0].thumbnail || items[0].url,
      icon: option.value as MediaThumbnail['icon'],
    });
  }
  if (videos.length > 0) {
    const video = videos[0];
    thumbnails.push({
      key: 'videos',
      label: 'Video',
      count: videos.length,
      cover: videoCover(video),
      icon: 'video',
    });
  }
  if (tour360Url) {
    thumbnails.push({ key: 'tour360', label: 'Tour 360', icon: 'tour360' });
  }
  if (floorPlans.length > 0) {
    // Chỉ lấy đúng bản vẽ mặt bằng người đăng tải lên; file PDF không làm ảnh nền được nên để
    // trống (Notion "Floor Plan – Data Binding": cấm lấy ảnh flycam/mặt tiền thay thế).
    const drawing = floorPlans.find((fp) => !fp.url.toLowerCase().endsWith('.pdf'));
    thumbnails.push({
      key: 'floorplans',
      label: 'Mặt bằng',
      count: floorPlans.length,
      cover: drawing?.thumbnail || drawing?.url,
      icon: 'floorplan',
    });
  }
  if (latitude != null && longitude != null) {
    // Bản đồ và Đường phố: ảnh chụp tĩnh theo toạ độ cần khoá API Google có gắn thẻ thanh toán —
    // khách chốt 22/09 là KHÔNG gắn thẻ, nên hai ô này để nền tối kèm biểu tượng. Bấm vào vẫn mở
    // bản đồ / ảnh đường phố thật tại đúng vị trí tin. Khi nào khách bật khoá thì gắn ảnh vào đây.
    thumbnails.push({ key: 'map', label: 'Bản đồ', icon: 'map' });
    thumbnails.push({ key: 'streetview', label: 'Đường phố', icon: 'streetview' });
  }

  /** Bấm một ô Thumbnail → mở album đúng nhóm/loại media đó. */
  const openThumbnail = (key: string) => {
    if (key === 'videos' || key === 'tour360' || key === 'floorplans' || key === 'map' || key === 'streetview') {
      setAlbumTab(key as GalleryTabKey);
      setAlbumCategory(null);
    } else {
      setAlbumTab('photos');
      setAlbumCategory(key === 'all' ? null : key);
    }
    setAlbumOpen(true);
  };

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden mb-4 h-[300px] sm:h-[400px] md:h-[480px]">
        <div className={`grid h-full gap-2 ${media.length > 1 ? 'grid-cols-1 md:grid-cols-[2fr_1fr]' : 'grid-cols-1'}`}>
          <div onClick={() => handleOpen(0)} className="relative h-full group cursor-pointer bg-gray-100 overflow-hidden">
            <Image
              src={media[0]}
              alt="Ảnh chính"
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority
            />
          </div>
          {media.length > 1 && (
            <div className="hidden md:grid grid-rows-2 gap-2 h-full">
              {[1, 2].map((idx) => {
                const img = media[idx];
                if (!img) return <div key={idx} className="bg-gray-100 h-full" />;
                const isLast = idx === 2 && extraCount > 0;
                return (
                  <div key={idx} onClick={() => handleOpen(idx)} className="relative group cursor-pointer overflow-hidden bg-gray-100 h-full">
                    <Image
                      src={img}
                      alt={`Ảnh ${idx + 1}`}
                      fill
                      sizes="33vw"
                      loading="lazy"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {isLast && (
                      <div className="absolute inset-0 bg-black/55 flex items-center justify-center transition-colors group-hover:bg-black/40">
                        <span className="text-white font-bold text-[18px]">+{extraCount} ảnh</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mở album ảnh toàn màn hình (có thanh điều hướng + tab media + CTA). */}
        <button
          onClick={() => setAlbumOpen(true)}
          className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-[13px] shadow-sm flex items-center gap-2 transition-all hover:shadow-md active:scale-95"
        >
          <Camera className="w-4 h-4 text-primary" />
          Xem tất cả {media.length} ảnh
        </button>
      </div>

      {/* Thanh Thumbnail Media — thay lưới ảnh bày hết ra trang (Notion 29/09). */}
      <PropertyMediaThumbnails thumbnails={thumbnails} onSelect={openThumbnail} />

      {/* Bản đồ và Ảnh đường phố KHÔNG còn hiện ở đây (Notion 30/09 "Gallery – Map/Street View"):
          bản đồ chuyển vào mục "Vị trí" trong cột trái, ảnh đường phố mở từ ô trên thanh Thumbnail. */}

      {/* Album ảnh toàn màn hình — thanh điều hướng cố định, tab media, lưới bất đối xứng. */}
      <PropertyGalleryLightbox
        key={`${albumTab}:${albumCategory ?? 'all'}`}
        open={albumOpen}
        onClose={() => setAlbumOpen(false)}
        initialTab={albumTab}
        initialCategory={albumCategory}
        media={media}
        images={images}
        videos={videos}
        tour360Url={tour360Url}
        floorPlans={floorPlans}
        latitude={latitude}
        longitude={longitude}
        propertyId={propertyId}
        propertyTitle={propertyTitle}
        contactPhone={contactPhone}
      />

      {/* Slider 1 ảnh — mở từ hero/lưới ảnh trên trang. */}
      {sliderIndex !== null && (
        <PropertyImageSlider
          media={media}
          index={sliderIndex}
          onIndexChange={setSliderIndex}
          onClose={() => setSliderIndex(null)}
        />
      )}
    </>
  );
}
