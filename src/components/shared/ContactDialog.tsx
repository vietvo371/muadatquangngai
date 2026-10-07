'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { apiSend, toApiError } from '@/lib/api-client';

interface ContactDialogProps {
  open: boolean;
  onClose: () => void;
  projectName?: string;
  /** Có thì lead được gắn cho người phụ trách dự án và họ nhận thông báo ngay. */
  projectSlug?: string;
}

export function ContactDialog({ open, onClose, projectName, projectSlug }: ContactDialogProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState(projectName ? `Tôi quan tâm đến ${projectName}` : 'Tôi quan tâm đến dự án này');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    // Trước đây chỗ này chỉ chờ 0,8 giây rồi báo "Gửi thành công" — không gửi đi đâu cả, khách
    // để lại số điện thoại là mất. Giờ lưu thật vào bảng leads và báo cho người phụ trách.
    try {
      await apiSend('post', '/api/v2/leads', {
        name: name.trim(),
        phone: phone.trim(),
        message: note.trim(),
        ...(projectSlug ? { project_slug: projectSlug } : {}),
      });
      setSent(true);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSent(false);
    setError(null);
    setName('');
    setPhone('');
    setNote(projectName ? `Tôi quan tâm đến ${projectName}` : 'Tôi quan tâm đến dự án này');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Yêu cầu liên hệ</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent ? (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
              <svg className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-800 mb-1">Gửi thành công!</p>
            <p className="text-sm text-gray-500 mb-5">Chuyên viên sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
            <button
              onClick={handleClose}
              className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <p className="text-sm text-gray-500">
              Chúng tôi sẽ kết nối bạn với những môi giới / chủ đầu tư của dự án
            </p>

            <div>
              <input
                type="text"
                placeholder="Họ tên *"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary placeholder-gray-400 text-gray-800"
              />
            </div>

            <div>
              <input
                type="tel"
                placeholder="Số điện thoại *"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary placeholder-gray-400 text-gray-800"
              />
            </div>

            <div>
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary placeholder-gray-400 text-gray-800 resize-none"
              />
            </div>

            <p className="text-xs text-gray-400">
              Bằng việc gửi thông tin, bạn đồng ý với{' '}
              <Link href="/chinh-sach" target="_blank" className="text-primary underline">chính sách bảo mật</Link>{' '}
              và cho phép BatDongSanQN thu thập, xử lý, chia sẻ thông tin tới môi giới, chủ đầu tư để liên lạc với bạn.
            </p>

            {error && (
              <p role="alert" className="rounded-lg bg-gray-50 px-3 py-2 text-[13px] text-cta">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-cta hover:bg-cta-dark text-white text-sm font-bold py-3.5 rounded-xl transition-colors disabled:opacity-70"
            >
              {submitting ? 'Đang gửi...' : 'Gửi thông tin'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
