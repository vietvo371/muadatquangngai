'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, FileText, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { IMAGE_CATEGORY_OPTIONS } from '@/lib/property-form-config';
import { parseYoutubeId } from '@/components/shared/ImageUploader';
import { PropertyImageSlider } from './PropertyImageSlider';
import { PropertyGalleryLightbox } from './PropertyGalleryLightbox';

const PropertyLocationMap = dynamic(
  () => import('@/components/map/PropertyLocationMap').then((m) => m.PropertyLocationMap),
  { ssr: false, loading: () => <div className="h-[360px] rounded-xl bg-gray-100 animate-pulse" /> }
);

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

type TabKey = 'photos' | 'videos' | 'tour360' | 'floorplans' | 'map';

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

  const sectionRefs = useRef<Partial<Record<TabKey, HTMLDivElement | null>>>({});
  const [activeTab, setActiveTab] = useState<TabKey>('photos');

  // Tab nào có nội dung mới hiện — cần tính trước effect scrollspy vì effect phụ thuộc số tab.
  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'photos', label: `Ảnh (${media.length})` },
    ...(videos.length > 0 ? [{ key: 'videos' as TabKey, label: 'Video' }] : []),
    ...(tour360Url ? [{ key: 'tour360' as TabKey, label: 'Tour 360' }] : []),
    ...(floorPlans.length > 0 ? [{ key: 'floorplans' as TabKey, label: 'Mặt bằng' }] : []),
    ...(latitude != null && longitude != null ? [{ key: 'map' as TabKey, label: 'Bản đồ' }] : []),
  ];

  // Scrollspy — tô đậm tab đang xem khi cuộn qua (III.4), cùng pattern IntersectionObserver đã
  // dùng ở trang dự án (du-an/[slug]/page.tsx).
  useEffect(() => {
    const entries = Object.entries(sectionRefs.current).filter(([, el]) => el) as Array<[TabKey, HTMLDivElement]>;
    if (entries.length === 0) return;
    const observer = new IntersectionObserver(
      (obs) => {
        obs.forEach((entry) => {
          if (entry.isIntersecting) setActiveTab(entry.target.getAttribute('data-tab') as TabKey);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    entries.forEach(([, el]) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy lại khi số tab đổi (refs đã gắn xong khi effect chạy)
  }, [tabs.length]);

  if (media.length === 0) return null;

  const extraCount = media.length - 3;

  const handleOpen = (index: number) => setSliderIndex(index);

  // Nhóm ảnh theo loại (III.3/III.6) — chỉ khi có metadata; ảnh không gắn phân loại gộp "Khác".
  const groups: Array<{ key: string; label: string; items: PropertyMediaImage[] }> = [];
  if (images.length > 0) {
    const byType = new Map<string, PropertyMediaImage[]>();
    for (const img of images) {
      const key = img.image_type || 'other';
      if (!byType.has(key)) byType.set(key, []);
      byType.get(key)!.push(img);
    }
    for (const [key, items] of byType) {
      const label = key === 'other' ? 'Khác' : IMAGE_CATEGORY_OPTIONS.find((o) => o.value === key)?.label ?? 'Khác';
      groups.push({ key, label, items });
    }
  }

  const scrollToTab = (key: TabKey) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

      {/* Sub-tab sticky (III.5) — chỉ hiện khi có nhiều hơn 1 loại media. */}
      {tabs.length > 1 && (
        <div className="sticky top-[60px] z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:rounded-xl sm:border sm:shadow-sm">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => scrollToTab(t.key)}
                className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ảnh — nhóm theo loại (III.3/III.6), cuộn mượt tới đây (III.4). */}
      <div
        ref={(el) => { sectionRefs.current.photos = el; }}
        data-tab="photos"
        className="scroll-mt-24 mb-8"
      >
        {groups.length > 0 ? (
          <div className="space-y-6">
            {groups.map((g) => (
              <div key={g.key}>
                <h3 className="text-[15px] font-bold text-gray-900 mb-3">
                  {g.label} <span className="text-gray-400 font-normal">({g.items.length})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {g.items.map((img) => {
                    const flatIndex = media.indexOf(img.url);
                    return (
                      <button
                        key={img.id ?? img.url}
                        onClick={() => handleOpen(flatIndex >= 0 ? flatIndex : 0)}
                        className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                      >
                        <Image
                          src={img.thumbnail || img.url}
                          alt={g.label}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          loading="lazy"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {media.map((url, idx) => (
              <button key={url} onClick={() => handleOpen(idx)} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                <Image
                  src={url}
                  alt={`Ảnh ${idx + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  loading="lazy"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Video */}
      {videos.length > 0 && (
        <div ref={(el) => { sectionRefs.current.videos = el; }} data-tab="videos" className="scroll-mt-24 mb-8 space-y-4">
          <h3 className="text-[15px] font-bold text-gray-900">Video</h3>
          {videos.map((v) => {
            const ytId = parseYoutubeId(v.url);
            return (
              <div key={v.id ?? v.url} className="w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-black">
                {ytId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video src={v.url} controls className="w-full h-full" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tour 360 */}
      {tour360Url && (
        <div ref={(el) => { sectionRefs.current.tour360 = el; }} data-tab="tour360" className="scroll-mt-24 mb-8">
          <h3 className="text-[15px] font-bold text-gray-900 mb-3">Tour 360</h3>
          <div className="w-full h-[420px] rounded-xl overflow-hidden border border-gray-200">
            <iframe src={tour360Url} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" />
          </div>
        </div>
      )}

      {/* Mặt bằng */}
      {floorPlans.length > 0 && (
        <div ref={(el) => { sectionRefs.current.floorplans = el; }} data-tab="floorplans" className="scroll-mt-24 mb-8">
          <h3 className="text-[15px] font-bold text-gray-900 mb-3">Mặt bằng</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {floorPlans.map((fp) => {
              const isPdf = fp.url.toLowerCase().endsWith('.pdf');
              return isPdf ? (
                <a
                  key={fp.id ?? fp.url}
                  href={fp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-2 aspect-square rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <FileText className="h-8 w-8 text-gray-500" />
                  <span className="text-xs text-primary flex items-center gap-1">
                    Xem file <ExternalLink className="h-3 w-3" />
                  </span>
                </a>
              ) : (
                <a
                  key={fp.id ?? fp.url}
                  href={fp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                >
                  <Image
                    src={fp.thumbnail || fp.url}
                    alt="Mặt bằng"
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    loading="lazy"
                    className="object-cover"
                  />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Bản đồ */}
      {latitude != null && longitude != null && (
        <div ref={(el) => { sectionRefs.current.map = el; }} data-tab="map" className="scroll-mt-24 mb-8">
          <h3 className="text-[15px] font-bold text-gray-900 mb-3">Bản đồ</h3>
          <PropertyLocationMap latitude={latitude} longitude={longitude} className="w-full h-[360px] rounded-xl overflow-hidden border border-gray-200" />
        </div>
      )}

      {/* Album ảnh toàn màn hình — thanh điều hướng cố định, tab media, lưới bất đối xứng. */}
      <PropertyGalleryLightbox
        open={albumOpen}
        onClose={() => setAlbumOpen(false)}
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
