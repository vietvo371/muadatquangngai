'use client';

import { useState } from 'react';
import { Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader, VideoUploader, type UploadedFile } from '@/components/shared/ImageUploader';
import { ImagePreviewLightbox } from './ImagePreviewLightbox';
import { Tour360Field } from './Tour360Field';
import { FloorPlanUploader, type FloorPlanFile } from './FloorPlanUploader';
import { StreetViewPreview } from './StreetViewPreview';

interface MediaFieldsProps {
  title: string;
  images: UploadedFile[];
  onImagesChange: (images: UploadedFile[]) => void;
  /** Số ảnh tối thiểu (feedback I.4) — hiện trong ghi chú, validate thật nằm ở canProceed() của page. */
  minFiles?: number;
  maxFiles: number;
  maxSize: number;
  /** Cảnh báo (không chặn) khi ảnh nhỏ hơn chiều rộng này — feedback I.9. */
  minWidth?: number;
  /** Danh mục Đất không cần phân loại ảnh — ẩn ô chọn phân loại trong từng thẻ ảnh. */
  hideImageType?: boolean;
  /** Toạ độ BĐS — dùng nhúng Google Street View bên dưới phần ảnh/video. */
  latitude?: number;
  longitude?: number;
  /** Trang sửa tin KHÔNG có video — quyết định có chủ đích, không phải thiếu sót. */
  showVideo: boolean;
  videos?: UploadedFile[];
  onVideosChange?: (videos: UploadedFile[]) => void;
  maxVideos?: number;
  maxVideoSize?: number;
  /** 2 trang lệch nhau nhẹ về màu nền/viền của ô lưu ý — giữ nguyên từng trang. */
  noteBoxClassName?: string;
  noteTextClassName?: string;

  // Tour 360 (feedback I.12) — cả 2 trang đều có, không như video chỉ create mới có.
  tour360Url?: string;
  onTour360UrlChange: (url: string | undefined) => void;
  // Mặt bằng (feedback I.13) — cả 2 trang đều có.
  floorPlans: FloorPlanFile[];
  onFloorPlansChange: (files: FloorPlanFile[]) => void;
}

/** Ảnh (+ Video khi showVideo) — giống hệt nhau giữa trang đăng tin và trang sửa tin. */
export function MediaFields({
  title,
  images,
  onImagesChange,
  minFiles = 5,
  maxFiles,
  maxSize,
  minWidth,
  hideImageType = false,
  latitude,
  longitude,
  showVideo,
  videos = [],
  onVideosChange,
  maxVideos,
  maxVideoSize,
  noteBoxClassName = 'bg-[#e8f4fb]/50 border border-[#1075b1]/15 rounded-xl p-4 mb-6',
  noteTextClassName = 'text-[13px] text-[#1075b1] space-y-1.5 list-disc list-inside',
  tour360Url,
  onTour360UrlChange,
  floorPlans,
  onFloorPlansChange,
}: MediaFieldsProps) {
  // Xem trước dạng gallery (feedback I.10) — không mở popup/đổi trang, chỉ overlay tại chỗ.
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-3 pb-2 border-b">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {images.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
            className="gap-1.5 h-8 text-xs border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <Images className="h-3.5 w-3.5" />
            Xem trước dạng gallery
          </Button>
        )}
      </div>

      <div className={noteBoxClassName}>
        <ul className={noteTextClassName}>
          <li>Tải lên tối thiểu <strong>{minFiles} ảnh</strong>, tối đa <strong>{maxFiles} ảnh</strong>.</li>
          <li>Kéo thả ảnh để thay đổi thứ tự. Ảnh đầu tiên sẽ là ảnh bìa.</li>
          <li>Hạn chế ảnh có chứa logo, watermark của các nền tảng khác.</li>
        </ul>
      </div>

      {images.length > 0 && images.length < minFiles && (
        <p className="text-[13px] text-amber-700 -mt-3">
          Cần thêm ít nhất {minFiles - images.length} ảnh nữa để đủ điều kiện đăng tin.
        </p>
      )}

      <ImageUploader
        files={images}
        onChange={onImagesChange}
        maxFiles={maxFiles}
        maxSize={maxSize}
        minWidth={minWidth}
        showImageType={!hideImageType}
      />

      {/* Video (spec mục 7.2) — không bắt buộc, chọn tải lên hoặc dán link YouTube. Chỉ trang
          đăng tin có mục này. */}
      {showVideo && onVideosChange && (
        <div className="pt-2">
          <h4 className="text-base font-bold text-gray-900 mb-1">Video giới thiệu</h4>
          <p className="text-[13px] text-gray-500 mb-3">
            Không bắt buộc. Tin có video thường được xem lâu hơn.
          </p>
          <VideoUploader videos={videos} onChange={onVideosChange} maxVideos={maxVideos} maxSize={maxVideoSize} />
        </div>
      )}

      {/* Tour 360 (feedback I.12) — không bắt buộc. */}
      <div className="pt-2">
        <h4 className="text-base font-bold text-gray-900 mb-1">Tour 360</h4>
        <p className="text-[13px] text-gray-500 mb-3">
          Không bắt buộc. Dán link Matterport hoặc Kuula nếu bạn có tour thực tế ảo.
        </p>
        <Tour360Field value={tour360Url} onChange={onTour360UrlChange} />
      </div>

      {/* Mặt bằng (feedback I.13) — không bắt buộc. */}
      <div className="pt-2">
        <h4 className="text-base font-bold text-gray-900 mb-1">Mặt bằng</h4>
        <p className="text-[13px] text-gray-500 mb-3">
          Không bắt buộc. Tải lên ảnh hoặc file PDF sơ đồ mặt bằng.
        </p>
        <FloorPlanUploader files={floorPlans} onChange={onFloorPlansChange} />
      </div>

      {/* Google Street View — tự nhận diện khu vực có ảnh Street View hay không (dựa trên
          toạ độ đã ghim ở bước địa chỉ). Không có ảnh / không có key / chưa ghim thì hiện
          thông báo gọn thay vì khung trống. */}
      <div className="pt-2">
        <h4 className="text-base font-bold text-gray-900 mb-1">Google Street View</h4>
        <p className="text-[13px] text-gray-500 mb-3">
          Xem trước hình ảnh đường phố tại vị trí đã ghim trên bản đồ.
        </p>
        <StreetViewPreview latitude={latitude} longitude={longitude} />
      </div>

      {previewOpen && (
        <ImagePreviewLightbox
          images={images.map((f) => f.url)}
          initialIndex={0}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}
