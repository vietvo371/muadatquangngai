'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { ArrowLeft, Phone, Share2, Heart, FileText, ExternalLink } from 'lucide-react';
import { IMAGE_CATEGORY_OPTIONS } from '@/lib/property-form-config';
import { parseYoutubeId } from '@/components/shared/ImageUploader';
import { useFavorite } from '@/hooks/useFavorite';
import { PropertyImageSlider } from './PropertyImageSlider';
import type { PropertyMediaImage, PropertyMediaFile } from './PropertyMediaSection';

const PropertyLocationMap = dynamic(
  () => import('@/components/map/PropertyLocationMap').then((m) => m.PropertyLocationMap),
  { ssr: false, loading: () => <div className="h-[360px] rounded-xl bg-gray-100 animate-pulse" /> }
);

export type GalleryTabKey = 'photos' | 'videos' | 'tour360' | 'floorplans' | 'map';

interface PropertyGalleryLightboxProps {
  open: boolean;
  onClose: () => void;
  media: string[];
  images: PropertyMediaImage[];
  videos: PropertyMediaFile[];
  tour360Url?: string;
  floorPlans: PropertyMediaFile[];
  latitude?: number;
  longitude?: number;
  /** Dữ liệu cho CTA góc phải — optional để không phá vỡ chỗ gọi hiện tại. */
  propertyId?: number | string;
  propertyTitle?: string;
  contactPhone?: string;
}

/** Thứ tự section theo cấu hình đăng tin; ảnh không phân loại gom vào "Khác" ở cuối. */
const CATEGORY_ORDER = IMAGE_CATEGORY_OPTIONS.map((o) => o.value);

/** Ảnh quan trọng lên trước: ảnh bìa (is_primary) → sort_order nhỏ → thứ tự gốc. */
function byImportance(a: PropertyMediaImage, b: PropertyMediaImage): number {
  if (!!a.is_primary !== !!b.is_primary) return a.is_primary ? -1 : 1;
  return (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER);
}

/**
 * Album "Xem tất cả hình ảnh" — lớp phủ toàn màn hình có thanh điều hướng cố định (quay lại,
 * tab media, CTA), lưới ảnh bất đối xứng, ảnh chi tiết chia theo section, và slider 1 ảnh
 * toàn màn hình khi bấm vào 1 tấm. Tự viết, không dùng thư viện lightbox ngoài.
 */
export function PropertyGalleryLightbox({
  open,
  onClose,
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
}: PropertyGalleryLightboxProps) {
  const [activeTab, setActiveTab] = useState<GalleryTabKey>('photos');
  const [sliderIndex, setSliderIndex] = useState<number | null>(null);
  const { isSaved, toggle } = useFavorite(propertyId);

  // Ảnh đã sắp xếp theo mức quan trọng — dùng chung cho lưới nổi bật + slider.
  const orderedImages = useMemo(() => {
    if (images.length === 0) return media.map((url) => ({ url } as PropertyMediaImage));
    return [...images].sort(byImportance);
  }, [images, media]);

  const orderedUrls = useMemo(() => orderedImages.map((img) => img.url), [orderedImages]);

  // Section theo image_type, giữ thứ tự cấu hình; nhóm rỗng không render.
  const sections = useMemo(() => {
    if (images.length === 0) return [];
    const byType = new Map<string, PropertyMediaImage[]>();
    for (const img of orderedImages) {
      const key = img.image_type && CATEGORY_ORDER.includes(img.image_type) ? img.image_type : 'other';
      if (!byType.has(key)) byType.set(key, []);
      byType.get(key)!.push(img);
    }
    return CATEGORY_ORDER.filter((key) => (byType.get(key)?.length ?? 0) > 0).map((key) => ({
      key,
      label: IMAGE_CATEGORY_OPTIONS.find((o) => o.value === key)?.label ?? 'Khác',
      items: byType.get(key)!,
    }));
  }, [images, orderedImages]);

  const tabs: Array<{ key: GalleryTabKey; label: string }> = [
    { key: 'photos', label: `Hình ảnh (${orderedUrls.length})` },
    ...(videos.length > 0 ? [{ key: 'videos' as GalleryTabKey, label: 'Video' }] : []),
    ...(tour360Url ? [{ key: 'tour360' as GalleryTabKey, label: 'Tour 360' }] : []),
    ...(floorPlans.length > 0 ? [{ key: 'floorplans' as GalleryTabKey, label: 'Mặt bằng' }] : []),
    ...(latitude != null && longitude != null ? [{ key: 'map' as GalleryTabKey, label: 'Bản đồ' }] : []),
  ];

  // Khoá cuộn nền + Esc đóng album (khi slider đang mở thì slider tự xử lý Esc của nó).
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sliderIndex === null) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, sliderIndex, onClose]);

  if (!open) return null;

  const openSlider = (url: string) => {
    const idx = orderedUrls.indexOf(url);
    setSliderIndex(idx >= 0 ? idx : 0);
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = { title: propertyTitle || 'Tin bất động sản', url };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Người dùng huỷ hộp thoại chia sẻ hoặc trình duyệt từ chối — rơi xuống copy link.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Đã sao chép liên kết tin đăng');
    } catch {
      toast.error('Không sao chép được liên kết, vui lòng thử lại');
    }
  };

  /** Ô ảnh dùng chung — tỷ lệ khung cố định + object-cover nên ảnh không méo/vỡ bố cục.
   * `extraClass` phải chứa class định vị/tỷ lệ khung của ô (relative + span/aspect). */
  const renderTile = (
    img: PropertyMediaImage,
    alt: string,
    sizes: string,
    priority = false,
    extraClass = ''
  ) => (
    <button
      key={img.id ?? img.url}
      type="button"
      onClick={() => openSlider(img.url)}
      className={`overflow-hidden rounded-xl bg-gray-100 group ${extraClass}`}
      aria-label={`Xem ${alt}`}
    >
      <Image
        src={img.thumbnail || img.url}
        alt={alt}
        fill
        sizes={sizes}
        {...(priority ? { priority: true } : { loading: 'lazy' as const })}
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </button>
  );

  const featured = orderedImages.slice(0, 5);
  const rest = orderedImages.slice(5);

  return (
    <>
      <div className="fixed inset-0 z-[9990] bg-white flex flex-col animate-in fade-in duration-200">
        {/* 1-2-3-5: thanh điều hướng cố định — quay lại / tab media / CTA */}
        <div className="shrink-0 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
          <div className="max-w-[1200px] mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-[13px] font-semibold text-gray-700 hover:text-primary hover:bg-primary-light transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Quay lại</span>
            </button>

            <div className="flex-1 min-w-0 flex gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                    activeTab === t.key
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-primary hover:bg-primary-light'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="shrink-0 flex items-center gap-1.5">
              {contactPhone && (
                <a
                  href={`tel:${contactPhone.replace(/\s/g, '')}`}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg bg-cta hover:bg-cta-dark text-white text-[13px] font-bold transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden md:inline">Gọi</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-lg text-gray-600 hover:text-primary hover:bg-primary-light transition-colors"
                aria-label="Chia sẻ tin đăng"
              >
                <Share2 className="w-[18px] h-[18px]" />
              </button>
              {propertyId != null && (
                <button
                  type="button"
                  onClick={toggle}
                  className={`p-2 rounded-lg transition-colors ${
                    isSaved ? 'text-cta bg-primary-light' : 'text-gray-600 hover:text-primary hover:bg-primary-light'
                  }`}
                  aria-label={isSaved ? 'Bỏ lưu tin' : 'Lưu tin'}
                  aria-pressed={isSaved}
                >
                  <Heart className={`w-[18px] h-[18px] ${isSaved ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 9: vùng nội dung cuộn dọc mượt */}
        <div className="flex-1 overflow-y-auto scroll-smooth overscroll-contain">
          <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-5 sm:py-8">
            {activeTab === 'photos' && (
              <>
                {/* 6-7: lưới bất đối xứng, ảnh quan trọng nhất chiếm ô lớn nhất */}
                <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[110px] sm:auto-rows-[140px] md:auto-rows-[170px] gap-2 sm:gap-3">
                  {featured.map((img, idx) => {
                    const layout =
                      idx === 0
                        ? 'relative col-span-2 row-span-2'
                        : idx === 3
                          ? 'relative col-span-2 row-span-1'
                          : 'relative col-span-1 row-span-1';
                    return renderTile(
                      img,
                      `Ảnh nổi bật ${idx + 1}`,
                      idx === 0 ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw',
                      idx === 0,
                      layout
                    );
                  })}
                  {rest.length > 0 &&
                    sections.length === 0 &&
                    rest.map((img, idx) =>
                      renderTile(
                        img,
                        `Ảnh ${idx + 6}`,
                        '(max-width: 768px) 50vw, 25vw',
                        false,
                        idx % 5 === 0 ? 'relative col-span-2 row-span-1' : 'relative col-span-1 row-span-1'
                      )
                    )}
                </div>

                {/* 8: ảnh chi tiết chia theo section, mỗi section lưới 3-4 cột */}
                {sections.length > 0 && (
                  <div className="mt-8 sm:mt-10 space-y-8 sm:space-y-10">
                    {sections.map((s) => (
                      <section key={s.key}>
                        <h3 className="text-[16px] sm:text-[18px] font-bold text-gray-900 mb-3 sm:mb-4">
                          {s.label} <span className="text-gray-400 font-normal">({s.items.length})</span>
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                          {s.items.map((img, idx) =>
                            renderTile(
                              img,
                              `${s.label} ${idx + 1}`,
                              '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
                              false,
                              'relative aspect-[4/3]'
                            )
                          )}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'videos' && videos.length > 0 && (
              <div className="space-y-4">
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

            {activeTab === 'tour360' && tour360Url && (
              <div className="w-full h-[60vh] rounded-xl overflow-hidden border border-gray-200">
                <iframe src={tour360Url} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" />
              </div>
            )}

            {activeTab === 'floorplans' && floorPlans.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {floorPlans.map((fp) => {
                  const isPdf = fp.url.toLowerCase().endsWith('.pdf');
                  return isPdf ? (
                    <a
                      key={fp.id ?? fp.url}
                      href={fp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-2 aspect-square rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
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
                      className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
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
            )}

            {activeTab === 'map' && latitude != null && longitude != null && (
              <PropertyLocationMap
                latitude={latitude}
                longitude={longitude}
                className="w-full h-[60vh] rounded-xl overflow-hidden border border-gray-200"
              />
            )}
          </div>
        </div>
      </div>

      {/* 11: bấm 1 ảnh → slider toàn màn hình, đóng lại quay về lưới ảnh */}
      {sliderIndex !== null && (
        <PropertyImageSlider
          media={orderedUrls}
          index={sliderIndex}
          onIndexChange={setSliderIndex}
          onClose={() => setSliderIndex(null)}
          zIndexClassName="z-[9995]"
        />
      )}
    </>
  );
}
