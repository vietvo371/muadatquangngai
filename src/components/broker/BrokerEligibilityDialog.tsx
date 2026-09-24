'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BROKER_PROFILE_HREF, type BrokerEligibilityInfo } from '@/lib/broker-api';

interface Props {
  info: (BrokerEligibilityInfo & { message?: string }) | null;
  onClose: () => void;
}

/**
 * Popup khi môi giới bấm Đăng tin mà chưa đủ điều kiện (Notion 24/09, 6 trường hợp "Publish – ...").
 * Câu chữ và nút theo đúng từng trường hợp khách mô tả; mọi nút đưa về mục xác thực ở trang Hồ sơ.
 */
export function BrokerEligibilityDialog({ info, onClose }: Props) {
  if (!info) return null;
  const { title, text, actions } = describe(info);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[440px] rounded-2xl">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary-light">
            <ShieldAlert className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-lg font-bold text-gray-900">{title}</DialogTitle>
          <DialogDescription className="text-[14px] leading-relaxed text-gray-600">{text}</DialogDescription>
        </DialogHeader>
        {info.certificationStatus === 'rejected' && info.certificationRejectionReason && !info.isCertified && (
          <div className="rounded-xl border border-cta/30 bg-cta/5 px-4 py-3 text-[13px] text-gray-700">
            <span className="font-semibold">Lý do từ chối: </span>
            {info.certificationRejectionReason}
          </div>
        )}
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-[14px] font-medium text-gray-700 hover:bg-gray-50">
            Để sau
          </button>
          {actions.map((a) => (
            <Link
              key={a}
              href={BROKER_PROFILE_HREF}
              onClick={onClose}
              className="flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-[14px] font-semibold text-white hover:bg-primary-dark"
            >
              {a}
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function describe(info: BrokerEligibilityInfo): { title: string; text: string; actions: string[] } {
  const certMissing = !info.isCertified;
  if (certMissing && !info.companyAssigned) {
    return {
      title: 'Chưa đủ điều kiện đăng tin',
      text: 'Bạn cần hoàn tất xác thực thông tin chứng chỉ hành nghề và cập nhật Công ty/Sàn giao dịch trực thuộc trước khi đăng tin.',
      actions: ['Cập nhật ngay'],
    };
  }
  if (certMissing && info.certificationStatus === 'pending') {
    return {
      title: 'Hồ sơ đang được kiểm tra',
      text: 'Hồ sơ chứng chỉ hành nghề của bạn đang được Admin kiểm tra. Bạn sẽ nhận được thông báo khi có kết quả.',
      actions: ['Xem hồ sơ'],
    };
  }
  if (certMissing && info.certificationStatus === 'rejected') {
    return {
      title: 'Hồ sơ chứng chỉ bị từ chối',
      text: 'Hồ sơ chứng chỉ hành nghề của bạn chưa được chấp nhận. Vui lòng xem lý do và cập nhật lại hồ sơ.',
      actions: ['Cập nhật hồ sơ'],
    };
  }
  if (certMissing) {
    return {
      title: 'Chưa xác thực chứng chỉ',
      text: 'Bạn chưa hoàn tất xác thực thông tin chứng chỉ hành nghề.',
      actions: ['Xác thực ngay'],
    };
  }
  if (!info.companyAssigned) {
    return {
      title: 'Chưa cập nhật Công ty/Sàn',
      text: 'Bạn chưa cập nhật Công ty/Sàn giao dịch trực thuộc.',
      actions: ['Cập nhật ngay'],
    };
  }
  return {
    title: 'Công ty/Sàn chưa được duyệt',
    text:
      info.companyStatus === 'rejected'
        ? 'Công ty/Sàn giao dịch bạn chọn đã bị từ chối. Vui lòng chọn Công ty/Sàn khác trong danh sách.'
        : 'Công ty/Sàn giao dịch trực thuộc của bạn đang chờ Admin duyệt.',
    actions: ['Xem Công ty/Sàn'],
  };
}
