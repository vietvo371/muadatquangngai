'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/** Từ chối BẮT BUỘC có lý do (Notion 24/09) — nút Từ chối chỉ bật khi đã nhập đủ 5 ký tự. */
export function RejectReasonDialog({
  open, title, subject, isPending, onClose, onConfirm,
}: {
  open: boolean;
  title: string;
  subject: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const valid = reason.trim().length >= 5;
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isPending) { setReason(''); onClose(); } }}>
      <DialogContent className="sm:max-w-[460px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          <DialogDescription className="text-[13.5px]">{subject}</DialogDescription>
        </DialogHeader>
        <label className="block space-y-1.5 text-[13px] font-medium text-gray-700">
          Lý do từ chối *
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 500))}
            rows={4}
            placeholder="Người gửi sẽ thấy lý do này để sửa lại hồ sơ."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
          <span className="block text-right text-[11.5px] text-gray-400">{reason.length}/500</span>
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" disabled={isPending} onClick={() => { setReason(''); onClose(); }} className="h-10 rounded-lg border border-gray-200 px-4 text-[14px] font-medium text-gray-700 hover:bg-gray-50">
            Huỷ
          </button>
          <button
            type="button"
            disabled={!valid || isPending}
            onClick={() => onConfirm(reason.trim())}
            className="flex h-10 items-center gap-2 rounded-lg bg-cta px-5 text-[14px] font-semibold text-white hover:bg-cta-dark disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Từ chối
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
