'use client';

import { useRef, useState } from 'react';
import { Phone, MessageSquare, ShieldCheck, Flag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { REPORT_REASONS, reportReasonLabel, type ReportReason } from '@/lib/reports';

interface ContactSidebarProps {
  user: {
    name: string;
    avatar?: string | null;
    phone?: string;
    is_verified?: boolean;
    role?: string;
    joinDate?: string;
  };
  /** Slug tin đang xem — để gắn yêu cầu tư vấn vào đúng tin và đúng chủ tin. */
  propertySlug?: string;
  /** Tiêu đề tin — dùng làm nội dung tin nhắn mặc định. */
  propertyTitle?: string;
}

export function ContactSidebar({ user, propertySlug, propertyTitle }: ContactSidebarProps) {
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  // Chủ tin không có số thì KHÔNG bịa số: bản cũ fallback '0901234567' — khách bấm gọi là gọi
  // nhầm vào số của người lạ.
  const rawPhone = user.phone?.trim() || '';
  const hasPhone = rawPhone.length > 0;
  const displayPhone = !hasPhone
    ? 'Chưa cung cấp'
    : phoneRevealed
      ? rawPhone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
      : rawPhone.slice(0, 4) + ' *** ***';

  const zaloLink = `https://zalo.me/${rawPhone}`;

  // "Nhắn tin" trước đây là nút chết. Dự án chưa có endpoint tạo hội thoại (chat realtime cũng
  // chưa nối xong), nên nút này đưa người xem xuống đúng form yêu cầu tư vấn ngay bên dưới —
  // thứ đã chạy thật — thay vì mở một khung chat không gửi được.
  const messageFieldRef = useRef<HTMLTextAreaElement>(null);

  const focusMessageForm = () => {
    setSent(false);
    messageFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Chờ cuộn xong mới focus, tránh trình duyệt nhảy giật về vị trí cũ.
    setTimeout(() => messageFieldRef.current?.focus(), 400);
  };

  // Form yêu cầu tư vấn — trước đây chỉ là 3 ô input và nút bấm không nối gì.
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadMessage, setLeadMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Báo cáo vi phạm — trước đây nút "Báo cáo tin đăng vi phạm" KHÔNG có onClick, bấm không làm
  // gì cả, và cũng chưa có endpoint nào để nhận báo cáo.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason | null>(null);
  const [reportDescription, setReportDescription] = useState('');
  const [reporting, setReporting] = useState(false);

  const openReport = () => {
    // Gửi khi chưa đăng nhập sẽ bị interceptor 401 đá thẳng sang /login, mất luôn trang đang xem.
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để báo cáo tin đăng vi phạm.');
      return;
    }
    setShowReport(true);
  };

  const submitReport = async () => {
    if (!reportReason) {
      toast.error('Vui lòng chọn lý do báo cáo.');
      return;
    }
    setReporting(true);
    try {
      const res = await api.post('/api/v2/reports', {
        type: 'property',
        property_slug: propertySlug,
        reason: reportReason,
        description: reportDescription.trim() || undefined,
      });
      toast.success(res.data?.message || 'Đã gửi báo cáo.');
      setShowReport(false);
      setReportReason(null);
      setReportDescription('');
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không gửi được báo cáo. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setReporting(false);
    }
  };

  const defaultMessage = propertyTitle
    ? `Tôi quan tâm bất động sản "${propertyTitle}". Vui lòng liên hệ tư vấn giúp tôi.`
    : 'Tôi muốn hỏi về bất động sản này.';

  const submitLead = async () => {
    if (!leadPhone.trim()) {
      toast.error('Vui lòng nhập số điện thoại để chủ tin liên hệ lại.');
      return;
    }
    setSending(true);
    try {
      const res = await api.post('/api/v2/leads', {
        name: leadName.trim() || undefined,
        phone: leadPhone.trim(),
        message: (leadMessage.trim() || defaultMessage),
        property_slug: propertySlug,
      });
      toast.success(res.data?.message || 'Đã gửi yêu cầu tư vấn.');
      setSent(true);
      setLeadName('');
      setLeadPhone('');
      setLeadMessage('');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không gửi được yêu cầu. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="sticky top-24 w-full space-y-4">
      {/* Agent Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Avatar className="h-14 w-14 border border-gray-100">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="bg-primary-light text-primary font-bold text-[18px]">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {user.is_verified && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-gray-900 leading-tight mb-0.5 truncate">{user.name}</div>
            <div className="text-[13px] text-gray-500">{user.role || 'Môi giới chuyên nghiệp'}</div>
            {user.joinDate && (
              <div className="text-[12px] text-gray-400 mt-0.5">Thành viên từ {user.joinDate}</div>
            )}
          </div>
        </div>

        {/* Phone reveal — lần bấm đầu hiện số, bấm tiếp thì gọi luôn. */}
        {phoneRevealed && hasPhone ? (
          <a
            href={`tel:${rawPhone}`}
            className="w-full mb-2 flex items-center justify-center rounded-md bg-primary hover:bg-primary-dark text-white font-bold h-11 text-[15px] tracking-wide transition-colors"
          >
            <Phone className="w-4 h-4 mr-2" />
            {displayPhone}
          </a>
        ) : (
          <Button
            className="w-full mb-2 bg-primary hover:bg-primary-dark text-white font-bold h-11 text-[15px] tracking-wide"
            onClick={() => setPhoneRevealed(true)}
            disabled={!hasPhone}
          >
            <Phone className="w-4 h-4 mr-2" />
            {displayPhone}
          </Button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <a
            href={hasPhone ? zaloLink : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!hasPhone}
            onClick={(e) => {
              // Chủ tin chưa có số thì link Zalo sẽ trỏ vào "zalo.me/" rỗng — chặn lại.
              if (!hasPhone) {
                e.preventDefault();
                toast.error('Người đăng chưa cung cấp số điện thoại.');
              }
            }}
            className={`flex items-center justify-center gap-2 h-11 rounded-lg border border-[#0068FF] text-[#0068FF] text-[13px] font-bold transition-colors ${
              hasPhone ? 'hover:bg-[#0068FF]/5' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <svg viewBox="0 0 48 48" className="w-5 h-5" fill="currentColor">
              <path d="M24 4C13 4 4 12.1 4 22.2c0 5.8 3 11 7.8 14.4L10 42l6.2-3.2A21 21 0 0024 40.4c11 0 20-8.1 20-18.2S35 4 24 4z" />
              <path d="M14.5 25.5l3.2-4.7h1.5l-2.4 3.6 2.6 4h-1.6l-1.9-2.9-.9 1v1.9H14V20.8h1.5v4.7zm5.8-4.7h1.5v8H20.3zm2.8 0H27a3 3 0 013 3v2a3 3 0 01-3 3h-4v-8zm1.5 1.5v5H27a1.5 1.5 0 001.5-1.5v-2A1.5 1.5 0 0027 22.3h-2.4zm5.2-1.5h4.5v1.5H31v1.7h3v1.5h-3v1.8h3.3v1.5H30V20.8z" fill="white" />
            </svg>
            Zalo
          </a>
          <Button
            variant="outline"
            onClick={focusMessageForm}
            className="border-gray-200 text-gray-700 hover:bg-gray-50 font-bold h-11"
          >
            <MessageSquare className="w-4 h-4 mr-1.5" />
            Nhắn tin
          </Button>
        </div>
      </div>

      {/* Quick contact form */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-[15px] font-bold text-gray-900 mb-3">Yêu cầu tư vấn</h3>
        {sent ? (
          <div className="rounded-xl bg-primary-light px-4 py-3 text-[14px] text-gray-700">
            Đã gửi yêu cầu. Chủ tin sẽ liên hệ với bạn sớm nhất.
            <button
              type="button"
              onClick={() => setSent(false)}
              className="block mt-2 text-primary font-semibold"
            >
              Gửi thêm yêu cầu khác
            </button>
          </div>
        ) : (
          <>
            <Input
              placeholder="Họ tên"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              className="mb-2 h-11 text-[14px]"
            />
            <Input
              placeholder="Số điện thoại *"
              type="tel"
              value={leadPhone}
              onChange={(e) => setLeadPhone(e.target.value)}
              className="mb-2 h-11 text-[14px]"
            />
            <Textarea
              ref={messageFieldRef}
              placeholder={defaultMessage}
              value={leadMessage}
              onChange={(e) => setLeadMessage(e.target.value)}
              rows={3}
              className="mb-3 text-[14px] resize-none"
            />
            <Button
              onClick={submitLead}
              disabled={sending}
              className="w-full bg-cta hover:bg-cta-dark text-white font-bold h-11"
            >
              {sending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang gửi...</>) : 'Gửi yêu cầu'}
            </Button>
          </>
        )}
      </div>

      {/* Report */}
      <button
        type="button"
        onClick={openReport}
        className="w-full flex items-center justify-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors py-1"
      >
        <Flag className="w-3.5 h-3.5" />
        Báo cáo tin đăng vi phạm
      </button>

      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Báo cáo tin đăng vi phạm</DialogTitle>
            <DialogDescription>
              Chọn lý do để quản trị viên xem xét. Báo cáo sai sự thật có thể ảnh hưởng đến tài
              khoản của bạn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              {REPORT_REASONS.map((reason) => {
                const isActive = reportReason === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setReportReason(reason)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-primary bg-primary-light text-primary'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {reportReasonLabel(reason)}
                  </button>
                );
              })}
            </div>

            <Textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Mô tả thêm (không bắt buộc)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReport(false)}>
              Hủy
            </Button>
            <Button
              onClick={submitReport}
              disabled={reporting}
              className="bg-cta hover:bg-cta-dark text-white font-bold"
            >
              {reporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                'Gửi báo cáo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
