'use client';

import { ImageUploader, VideoUploader, type UploadedFile } from '@/components/shared/ImageUploader';

interface MediaFieldsProps {
  title: string;
  images: UploadedFile[];
  onImagesChange: (images: UploadedFile[]) => void;
  maxFiles: number;
  maxSize: number;
  /** Trang sửa tin KHÔNG có video — quyết định có chủ đích, không phải thiếu sót. */
  showVideo: boolean;
  videos?: UploadedFile[];
  onVideosChange?: (videos: UploadedFile[]) => void;
  maxVideos?: number;
  maxVideoSize?: number;
  /** 2 trang lệch nhau nhẹ về màu nền/viền của ô lưu ý — giữ nguyên từng trang. */
  noteBoxClassName?: string;
  noteTextClassName?: string;
}

/** Ảnh (+ Video khi showVideo) — giống hệt nhau giữa trang đăng tin và trang sửa tin. */
export function MediaFields({
  title,
  images,
  onImagesChange,
  maxFiles,
  maxSize,
  showVideo,
  videos = [],
  onVideosChange,
  maxVideos,
  maxVideoSize,
  noteBoxClassName = 'bg-[#e8f4fb]/50 border border-[#1075b1]/15 rounded-xl p-4 mb-6',
  noteTextClassName = 'text-[13px] text-[#1075b1] space-y-1.5 list-disc list-inside',
}: MediaFieldsProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-lg font-bold text-gray-900 mb-2 pb-2 border-b">{title}</h3>

      <div className={noteBoxClassName}>
        <ul className={noteTextClassName}>
          <li>Tải lên tối thiểu <strong>1 ảnh</strong>, tối đa <strong>{maxFiles} ảnh</strong>.</li>
          <li>Kéo thả ảnh để thay đổi thứ tự. Ảnh đầu tiên sẽ là ảnh bìa.</li>
          <li>Hạn chế ảnh có chứa logo, watermark của các nền tảng khác.</li>
        </ul>
      </div>

      <ImageUploader files={images} onChange={onImagesChange} maxFiles={maxFiles} maxSize={maxSize} />

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
    </div>
  );
}
