'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShieldCheck, Check, X, Mail, Phone, Building2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/axios';
import { formatDate } from '@/lib/formatters';
import type { ReviewStatus } from '@/lib/broker-api';
import { ReviewTabs } from '@/components/admin/broker/ReviewTabs';
import { RejectReasonDialog } from '@/components/admin/broker/RejectReasonDialog';

interface CertRow {
  id: number;
  certificate_number: string;
  issued_date: string;
  issued_by: string;
  front_image: string;
  back_image: string;
  status: ReviewStatus;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
  user: { id: number; name: string; email: string; phone: string | null; company_name: string | null; company_status: string | null };
}

const errMsg = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

/** Quản lý môi giới → Xác thực chứng chỉ (Notion 24/09): xem hồ sơ + ảnh, Duyệt / Từ chối có lý do. */
export default function CertificationsClient() {
  const [status, setStatus] = useState<ReviewStatus>('pending');
  const [rejecting, setRejecting] = useState<CertRow | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-broker-certs', status],
    queryFn: () => api.get('/api/v2/admin/broker-certifications', { params: { status } }).then((r) => r.data.data as { counts: Record<string, number>; data: CertRow[] }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-broker-certs'] });
  const approve = useMutation({
    mutationFn: (id: number) => api.put(`/api/v2/admin/broker-certifications/${id}/approve`).then((r) => r.data),
    onSuccess: (res) => { toast.success(res.message || 'Đã duyệt.'); refresh(); },
    onError: (err) => toast.error(errMsg(err, 'Không duyệt được hồ sơ.')),
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.put(`/api/v2/admin/broker-certifications/${id}/reject`, { rejection_reason: reason }).then((r) => r.data),
    onSuccess: (res) => { toast.success(res.message || 'Đã từ chối.'); setRejecting(null); refresh(); },
    onError: (err) => toast.error(errMsg(err, 'Không từ chối được hồ sơ.')),
  });

  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Xác thực chứng chỉ</h1>
          <p className="mt-0.5 text-sm text-gray-500">Quản lý môi giới — duyệt chứng chỉ hành nghề trước khi môi giới được đăng tin.</p>
        </div>
      </div>

      <ReviewTabs value={status} counts={data?.counts} onChange={setStatus} />

      {isLoading ? (
        <p className="py-10 text-center text-sm text-gray-500">Đang tải...</p>
      ) : isError ? (
        <p className="py-10 text-center text-sm text-cta">Không tải được danh sách hồ sơ.</p>
      ) : rows.length === 0 ? (
        <Card className="rounded-2xl border-gray-100"><CardContent className="py-16 text-center text-sm text-gray-500">Không có hồ sơ nào.</CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((r) => (
            <Card key={r.id} className="rounded-2xl border-gray-100 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-gray-900">{r.user.name}</p>
                    <p className="flex items-center gap-1.5 text-[12.5px] text-gray-500"><Mail className="h-3.5 w-3.5" />{r.user.email}</p>
                    {r.user.phone && <p className="flex items-center gap-1.5 text-[12.5px] text-gray-500"><Phone className="h-3.5 w-3.5" />{r.user.phone}</p>}
                    <p className="flex items-center gap-1.5 text-[12.5px] text-gray-500">
                      <Building2 className="h-3.5 w-3.5" />
                      {r.user.company_name ? `${r.user.company_name}${r.user.company_status === 'approved' ? '' : ' (chưa duyệt)'}` : 'Chưa chọn Công ty/Sàn'}
                    </p>
                  </div>
                  <span className="shrink-0 text-[12px] text-gray-400">Gửi {r.submitted_at ? formatDate(r.submitted_at) : '—'}</span>
                </div>

                <dl className="grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-3 text-[12.5px]">
                  <div><dt className="text-gray-500">Số chứng chỉ</dt><dd className="font-semibold text-gray-900">{r.certificate_number}</dd></div>
                  <div><dt className="text-gray-500">Ngày cấp</dt><dd className="font-semibold text-gray-900">{formatDate(r.issued_date)}</dd></div>
                  <div><dt className="text-gray-500">Nơi cấp</dt><dd className="font-semibold text-gray-900">{r.issued_by}</dd></div>
                </dl>

                <div className="grid grid-cols-2 gap-3">
                  {([['Mặt trước', r.front_image], ['Mặt sau', r.back_image]] as const).map(([label, src]) => (
                    <a key={label} href={src} target="_blank" rel="noopener noreferrer" className="group block">
                      <span className="mb-1 block text-[12px] font-medium text-gray-500">{label} (bấm để xem lớn)</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`${label} chứng chỉ của ${r.user.name}`} className="aspect-[16/10] w-full rounded-lg border border-gray-200 bg-gray-50 object-contain transition group-hover:border-primary" />
                    </a>
                  ))}
                </div>

                {r.status === 'rejected' && r.rejection_reason && (
                  <p className="rounded-lg bg-cta/5 px-3 py-2 text-[12.5px] text-gray-700"><span className="font-semibold text-cta">Lý do: </span>{r.rejection_reason}</p>
                )}
                {r.status !== 'pending' && (
                  <p className="text-[12px] text-gray-400">Xử lý bởi {r.reviewed_by_name ?? '—'} lúc {r.reviewed_at ? formatDate(r.reviewed_at) : '—'}</p>
                )}

                {r.status === 'pending' && (
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setRejecting(r)} disabled={approve.isPending} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-4 text-[13px] font-semibold text-cta hover:bg-cta/5">
                      <X className="h-4 w-4" />Từ chối
                    </button>
                    <button type="button" onClick={() => approve.mutate(r.id)} disabled={approve.isPending} className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
                      {approve.isPending && approve.variables === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Duyệt
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RejectReasonDialog
        open={rejecting !== null}
        title="Từ chối chứng chỉ hành nghề"
        subject={rejecting ? `${rejecting.user.name} — số ${rejecting.certificate_number}` : ''}
        isPending={reject.isPending}
        onClose={() => setRejecting(null)}
        onConfirm={(reason) => rejecting && reject.mutate({ id: rejecting.id, reason })}
      />
    </div>
  );
}
