'use client';

import { useState } from 'react';
import {
  MapPin,
  Home,
  ChevronRight,
  Monitor,
  Smartphone,
  X,
  ArrowLeft,
  Check,
  CheckCircle,
  Clock,
  Heart,
  Share2,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PropertyMediaSection } from './PropertyMediaSection';
import { SpecBoxes } from './SpecBoxes';
import { DescriptionCollapse } from './DescriptionCollapse';
import { FeatureList } from './FeatureList';
import { MortgageCalculator } from './MortgageCalculator';
import { ContactSidebar } from './ContactSidebar';
import { derivePrices } from '@/lib/formatters';

const PREVIEW_CONTACT_ANCHOR_ID = 'xem-truoc-lien-he';
const FALLBACK_IMAGE = '/images/image_data/Haus-Coastal.jpg';

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
 * Xem trước bài đăng — overlay toàn màn hình, dựng lại ĐÚNG bố cục trang chi tiết hiện tại
 * (`PropertyDetailView`: breadcrumb → media → 70% nội dung / 30% sidebar) từ dữ liệu đang soạn.
 *
 * Không dùng thẳng `PropertyDetailView` được vì nó tự fetch theo slug, mà tin xem trước chưa có
 * trong DB. Thay vào đó tái sử dụng toàn bộ component con dùng chung để hai bên không lệch nhau.
 *
 * Những gì chỉ có ở tin đã đăng (mã tin, thời gian đăng, lưu tin/chia sẻ, gửi yêu cầu tư vấn,
 * BĐS tương tự) được để trạng thái TĨNH — không hiển thị số liệu giả.
 */
export function ListingPreview({
  data,
  onClose,
  onSubmit,
  submitting,
  submitLabel = 'Đăng tin',
}: ListingPreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  const isSell = data.type === 'sell';
  const typeLabel = isSell ? 'Bán' : 'Cho thuê';
  const baseLabel = isSell ? 'Mua bán' : 'Cho thuê';
  const media = data.media.length > 0 ? data.media : [FALLBACK_IMAGE];

  const { total: totalPrice } = derivePrices(data.price, data.priceUnit, data.area);
  const showMortgage = isSell && !data.priceNegotiable && data.priceUnit !== 'per_month';

  // Cột đôi 70/30 giống trang thật; ở chế độ xem điện thoại ép về 1 cột như breakpoint nhỏ.
  const gridCols =
    device === 'mobile'
      ? 'grid-cols-1'
      : 'grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]';

  const scrollToContact = () => {
    document
      .getElementById(PREVIEW_CONTACT_ANCHOR_ID)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gray-100">
      {/* Thanh công cụ xem trước — không thuộc bài đăng, chỉ để điều khiển khi xem thử. */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="h-9 gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Quay lại chỉnh sửa</span>
          </Button>
          <span className="text-sm font-semibold text-gray-500 hidden md:inline">
            Xem trước bài đăng
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Responsive Preview — xem thử khổ máy tính / điện thoại. */}
          <div className="hidden sm:flex items-center rounded-lg border border-gray-200 p-0.5">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                device === 'desktop'
                  ? 'bg-primary-light text-primary'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
              aria-label="Xem trên máy tính"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                device === 'mobile'
                  ? 'bg-primary-light text-primary'
                  : 'text-gray-500 hover:bg-gray-50'
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
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
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
            device === 'mobile'
              ? 'max-w-[420px] my-4 rounded-2xl shadow-xl overflow-hidden'
              : 'max-w-[1200px]'
          }`}
        >
          {/* Breadcrumb — tĩnh (tin chưa có URL nên không gắn link). */}
          <div className="border-b border-gray-100 bg-gray-50/50">
            <div className="px-4 py-3">
              <nav className="flex items-center gap-2 text-[13px] text-gray-500 font-medium overflow-x-auto whitespace-nowrap scrollbar-hide">
                <span className="flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  Trang chủ
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>{baseLabel}</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>{data.categoryName}</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-gray-900 truncate max-w-[200px] sm:max-w-none">
                  {data.title || 'Chưa có tiêu đề'}
                </span>
              </nav>
            </div>
          </div>

          <div className="px-4 py-6">
            {/* Gallery — cùng khối media với trang thật. Không truyền propertyId/phone nên các
                nút Lưu tin / Chia sẻ trong album tự ẩn (không thao tác thật khi xem trước). */}
            <PropertyMediaSection
              media={media}
              images={[]}
              videos={[]}
              floorPlans={[]}
              propertyTitle={data.title}
            />

            <div className={`grid ${gridCols} gap-8 items-start`}>
              {/* Nội dung chính */}
              <div className="min-w-0">
                <div className="mb-5">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className="bg-primary text-white border-0 shadow-sm uppercase text-[11px] font-bold tracking-wider">
                      {typeLabel}
                    </Badge>
                  </div>
                  <h1 className="text-[24px] sm:text-[28px] font-extrabold text-gray-900 leading-[1.3] mb-3 tracking-tight">
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

                {/* Hàng thông tin đăng tin — ở bản xem trước chưa có mã tin/thời gian thật nên
                    ghi rõ là sẽ có sau khi đăng, và hai nút để trạng thái tĩnh. */}
                <div className="flex items-center justify-between gap-3 border-y border-gray-100 py-4 mb-6 flex-wrap">
                  <span className="flex items-center gap-1.5 text-[13px] text-gray-500 font-medium">
                    <Clock className="h-4 w-4 text-gray-400" />
                    Thời gian đăng và mã tin sẽ hiển thị sau khi tin được đăng
                  </span>
                  <div className="flex items-center gap-2" aria-hidden>
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-gray-400 cursor-not-allowed">
                      <Heart className="h-4 w-4" />
                      Lưu tin
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-gray-400 cursor-not-allowed">
                      <Share2 className="h-4 w-4" />
                      Chia sẻ
                    </span>
                  </div>
                </div>

                {/* CTA nổi bật — giống trang thật, chỉ cuộn xuống khối liên hệ. */}
                <div className="mb-8 rounded-2xl border border-primary/20 bg-primary-light p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div>
                    <div className="text-[15px] font-bold text-gray-900">
                      Quan tâm bất động sản này?
                    </div>
                    <p className="text-[13px] text-gray-600 mt-0.5">
                      Gửi thông tin để người đăng liên hệ lại với bạn.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={scrollToContact}
                    className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-cta hover:bg-cta-dark text-white font-bold text-[15px] transition-colors shrink-0"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Nhận báo giá
                  </button>
                </div>

                {/* Mô tả — cùng khối Xem thêm / Thu gọn với trang thật. */}
                <div className="mb-8">
                  <h2 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">
                    Thông tin mô tả
                  </h2>
                  {data.description.trim() ? (
                    <DescriptionCollapse description={data.description} />
                  ) : (
                    <p className="text-[14px] text-gray-400 italic">Chưa có mô tả.</p>
                  )}
                </div>

                {/* Tiện ích & Đặc điểm */}
                <FeatureList features={data.features.map((name) => ({ name }))} />

                {/* Pháp lý — chỉ tin bán, giống trang thật. */}
                {isSell && data.legalLabel && (
                  <div className="mb-8 pt-8 border-t border-gray-100">
                    <h2 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">
                      Thông tin pháp lý
                    </h2>
                    <div className="bg-primary-light border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-primary text-[14px]">{data.legalLabel}</p>
                        {data.legalNote && (
                          <p className="text-[13px] text-gray-600 mt-1">{data.legalNote}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tính khoản vay */}
                {showMortgage && <MortgageCalculator totalPrice={totalPrice} />}
              </div>

              {/* Sidebar liên hệ — chỉ để xem: form gửi yêu cầu tư vấn bị khoá thao tác vì tin
                  chưa tồn tại, không thể gửi lead thật. */}
              <aside id={PREVIEW_CONTACT_ANCHOR_ID} className="w-full scroll-mt-24">
                <div className="pointer-events-none select-none">
                  <ContactSidebar user={data.user} propertyTitle={data.title} />
                </div>
                <p className="mt-3 text-[12px] text-gray-400 text-center">
                  Khối liên hệ chỉ để xem trước — người mua sẽ dùng khối này sau khi tin được đăng.
                </p>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
