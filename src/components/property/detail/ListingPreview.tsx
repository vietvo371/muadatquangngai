'use client';

import { useState } from 'react';
import { MapPin, Home, Monitor, Smartphone, X, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HeroGallery } from './HeroGallery';
import { SpecBoxes } from './SpecBoxes';
import { ContactSidebar } from './ContactSidebar';
import { CONFIG } from '@/lib/config';

/**
 * Dữ liệu tối thiểu để dựng bản xem trước — cùng hình dạng với object trang chi tiết thật
 * (`mapApiPropertyDetail`) render, nên bản xem trước khớp với cái người mua sẽ thấy.
 */
export interface ListingPreviewData {
  title: string;
  type: 'sell' | 'rent';
  price: number;
  priceUnit: string;
  priceNegotiable: boolean;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  direction?: string;
  legalLabel?: string;
  legalNote?: string;
  description: string;
  media: string[];
  address: string;
  categoryName: string;
  features: string[];
  user: { name: string; avatar?: string | null; phone?: string };
}

interface ListingPreviewProps {
  data: ListingPreviewData;
  onClose: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
}

/**
 * Xem trước bài đăng (feedback 28/07 mục 6) — overlay toàn màn hình, dựng lại giao diện trang
 * chi tiết từ dữ liệu đang soạn (chưa lưu). Có nút quay lại chỉnh sửa + đăng ngay trên đây, và
 * toggle xem theo khổ máy tính / điện thoại.
 */
export function ListingPreview({ data, onClose, onSubmit, submitting, submitLabel = 'Đăng tin' }: ListingPreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const typeLabel = data.type === 'sell' ? 'Bán' : 'Cho thuê';

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gray-100">
      {/* Thanh công cụ xem trước — không thuộc bài đăng, chỉ để điều khiển khi xem thử. */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="h-9 gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Quay lại chỉnh sửa</span>
          </Button>
          <span className="text-sm font-semibold text-gray-500 hidden md:inline">Xem trước bài đăng</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Responsive Preview — xem thử khổ máy tính / điện thoại. */}
          <div className="hidden sm:flex items-center rounded-lg border border-gray-200 p-0.5">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                device === 'desktop' ? 'bg-primary-light text-primary' : 'text-gray-500 hover:bg-gray-50'
              }`}
              aria-label="Xem trên máy tính"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                device === 'mobile' ? 'bg-primary-light text-primary' : 'text-gray-500 hover:bg-gray-50'
              }`}
              aria-label="Xem trên điện thoại"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          <Button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="h-9 gap-2 bg-cta hover:bg-cta-dark text-white font-bold"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {submitLabel}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Đóng xem trước"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Vùng cuộn chứa bài đăng. Ở chế độ điện thoại thu khung về 420px cho giống màn nhỏ. */}
      <div className="flex-1 overflow-y-auto">
        <div
          className={`mx-auto bg-white transition-all ${
            device === 'mobile' ? 'max-w-[420px] my-4 rounded-2xl shadow-xl overflow-hidden' : 'max-w-[1200px]'
          }`}
        >
          <div className="px-4 py-6">
            <HeroGallery images={data.media.length > 0 ? data.media : ['/images/image_data/Haus-Coastal.jpg']} />

            <div className={`flex gap-8 items-start ${device === 'mobile' ? 'flex-col' : 'flex-col lg:flex-row'}`}>
              <div className="flex-1 min-w-0 w-full">
                {/* Breadcrumb rút gọn cho khớp bối cảnh trang thật. */}
                <div className="flex items-center gap-1.5 text-[13px] text-gray-400 font-medium mb-3">
                  <Home className="w-3.5 h-3.5" />
                  <span>Trang chủ</span>
                  <span>/</span>
                  <span>{data.type === 'sell' ? 'Mua bán' : 'Cho thuê'}</span>
                  <span>/</span>
                  <span className="text-gray-600">{data.categoryName}</span>
                </div>

                <div className="mb-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className="bg-primary text-white border-0 shadow-sm uppercase text-[11px] font-bold tracking-wider">
                      {typeLabel}
                    </Badge>
                  </div>
                  <h1 className="text-[22px] sm:text-[28px] font-extrabold text-gray-900 leading-[1.3] mb-3 tracking-tight">
                    {data.title || 'Chưa có tiêu đề'}
                  </h1>
                  <div className="flex items-center gap-2 text-[14px] text-gray-500 font-medium">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>{data.address || 'Chưa có địa chỉ'}</span>
                  </div>
                </div>

                <SpecBoxes
                  price={data.price}
                  priceUnit={data.priceUnit}
                  priceNegotiable={data.priceNegotiable}
                  area={data.area}
                  bedrooms={data.bedrooms}
                  bathrooms={data.bathrooms}
                  direction={data.direction}
                />

                <div className="mt-8 mb-8">
                  <h2 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">Thông tin mô tả</h2>
                  <div className="text-[14px] text-gray-600 leading-relaxed space-y-2">
                    {data.description.trim() ? (
                      data.description.split('\n').map((line, i) => {
                        if (!line.trim()) return <div key={i} className="h-1" />;
                        const rendered = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                        if (line.trim().startsWith('- ')) {
                          return (
                            <div key={i} className="flex gap-2">
                              <span className="text-primary mt-1 shrink-0">•</span>
                              <span dangerouslySetInnerHTML={{ __html: rendered.replace(/^-\s+/, '') }} />
                            </div>
                          );
                        }
                        return <p key={i} dangerouslySetInnerHTML={{ __html: rendered }} />;
                      })
                    ) : (
                      <p className="text-gray-400 italic">Chưa có mô tả.</p>
                    )}
                  </div>
                </div>

                {data.features.length > 0 && (
                  <div className="mb-8 pt-8 border-t border-gray-100">
                    <h2 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">Đặc điểm bất động sản</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                      {data.features.map((name) => (
                        <div key={name} className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-[14px] text-gray-700 font-medium">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.legalLabel && (
                  <div className="mb-8 pt-8 border-t border-gray-100">
                    <h2 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">Thông tin pháp lý</h2>
                    <div className="bg-primary-light border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-primary text-[14px]">{data.legalLabel}</p>
                        {data.legalNote && <p className="text-[13px] text-gray-600 mt-1">{data.legalNote}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <aside className={`shrink-0 w-full ${device === 'mobile' ? '' : 'lg:w-[320px] xl:w-[340px]'}`}>
                <ContactSidebar user={data.user} />
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
