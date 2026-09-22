'use client';

import { GoogleStreetViewEmbed } from '@/components/map/GoogleStreetViewEmbed';

interface StreetViewPreviewProps {
  latitude?: number;
  longitude?: number;
}

/**
 * Xem trước ảnh đường phố trong form đăng tin, tự chạy theo toạ độ người đăng đã ghim ở bước
 * địa chỉ. Ruột nằm ở `GoogleStreetViewEmbed` để trang chi tiết dùng lại đúng một cách hiển thị.
 *
 * Trước đây khối này hỏi Street View metadata bằng API key rồi mới nhúng, nhưng project Google
 * Cloud chưa bật API nên LUÔN rơi vào nhánh "chưa hỗ trợ" kể cả nơi Google có ảnh. Nay nhúng
 * thẳng kiểu không cần key nên ảnh hiện thật.
 */
export function StreetViewPreview({ latitude, longitude }: StreetViewPreviewProps) {
  return (
    <GoogleStreetViewEmbed
      latitude={latitude}
      longitude={longitude}
      missingCoordsText="Hãy ghim vị trí trên bản đồ ở bước địa chỉ để xem ảnh đường phố."
    />
  );
}
