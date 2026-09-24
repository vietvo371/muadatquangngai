'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Briefcase, Check, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/axios';
import { formatDate } from '@/lib/formatters';
import type { ReviewStatus } from '@/lib/broker-api';
import { ReviewTabs } from '@/components/admin/broker/ReviewTabs';
import { RejectReasonDialog } from '@/components/admin/broker/RejectReasonDialog';

interface CompanyRow {
  id: number;
  name: string;
  tax_code: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: ReviewStatus;
  rejection_reason: string | null;
  broker_count: number;
  created_by_name: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  created_at: string | null;
}

const errMsg = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

/** Quản lý môi giới → Công ty/Sàn giao dịch (Notion 24/09): Xem / Duyệt / Từ chối, lưu người và giờ duyệt. */
export default function CompaniesClient() {
  const [status, setStatus] = useState<ReviewStatus>('pending');
  const [rejecting, setRejecting] = useState<CompanyRow | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-broker-companies', status],
    queryFn: () => api.get('/api/v2/admin/broker-companies', { params: { status } }).then((r) => r.data.data as { counts: Record<string, number>; data: CompanyRow[] }),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-broker-companies'] });
  const approve = useMutation({
    mutationFn: (id: number) => api.put(`/api/v2/admin/broker-companies/${id}/approve`).then((r) => r.data),
    onSuccess: (res) => { toast.success(res.message || 'Đã duyệt.'); refresh(); },
    onError: (err) => toast.error(errMsg(err, 'Không duyệt được Công ty/Sàn.')),
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.put(`/api/v2/admin/broker-companies/${id}/reject`, { rejection_reason: reason }).then((r) => r.data),
    onSuccess: (res) => { toast.success(res.message || 'Đã từ chối.'); setRejecting(null); refresh(); },
    onError: (err) => toast.error(errMsg(err, 'Không từ chối được Công ty/Sàn.')),
  });

  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
          <Briefcase className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Công ty/Sàn giao dịch</h1>
          <p className="mt-0.5 text-sm text-gray-500">Quản lý môi giới — môi giới chỉ đăng tin được khi Công ty/Sàn trực thuộc đã được duyệt.</p>
        </div>
      </div>

      <ReviewTabs value={status} counts={data?.counts} onChange={setStatus} />

      <Card className="overflow-hidden rounded-2xl border-gray-100 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-gray-500">Đang tải...</p>
          ) : isError ? (
            <p className="py-10 text-center text-sm text-cta">Không tải được danh sách.</p>
          ) : rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-500">Không có Công ty/Sàn nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-gray-50/50 text-[10.5px] font-extrabold uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="py-3.5 pl-6">Công ty/Sàn</th>
                    <th className="py-3.5">Liên hệ</th>
                    <th className="py-3.5">Môi giới</th>
                    <th className="py-3.5">Đề xuất bởi</th>
                    <th className="py-3.5 pr-6 text-right">{status === 'pending' ? 'Thao tác' : 'Xử lý'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((c) => (
                    <tr key={c.id} className="align-top">
                      <td className="py-3.5 pl-6">
                        <p className="font-bold text-gray-900">{c.name}</p>
                        <p className="text-[12px] text-gray-500">MST {c.tax_code ?? '—'}</p>
                        {c.address && <p className="text-[12px] text-gray-500">{c.address}</p>}
                        {c.status === 'rejected' && c.rejection_reason && <p className="mt-1 text-[12px] text-cta">Lý do: {c.rejection_reason}</p>}
                      </td>
                      <td className="py-3.5 text-gray-600">
                        <p>{c.phone ?? '—'}</p>
                        {c.email && <p className="text-[12px]">{c.email}</p>}
                      </td>
                      <td className="py-3.5 font-semibold text-gray-800">{c.broker_count}</td>
                      <td className="py-3.5 text-gray-600">
                        <p>{c.created_by_name ?? 'Admin'}</p>
                        <p className="text-[12px] text-gray-400">{c.created_at ? formatDate(c.created_at) : ''}</p>
                      </td>
                      <td className="py-3.5 pr-6 text-right">
                        {c.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setRejecting(c)} className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-[12.5px] font-semibold text-cta hover:bg-cta/5">
                              <X className="h-3.5 w-3.5" />Từ chối
                            </button>
                            <button type="button" onClick={() => approve.mutate(c.id)} disabled={approve.isPending} className="flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-[12.5px] font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
                              {approve.isPending && approve.variables === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              Duyệt
                            </button>
                          </div>
                        ) : (
                          <p className="text-[12px] text-gray-500">{c.approved_by_name ?? '—'}<br />{c.approved_at ? formatDate(c.approved_at) : ''}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <RejectReasonDialog
        open={rejecting !== null}
        title="Từ chối Công ty/Sàn"
        subject={rejecting ? `${rejecting.name} — MST ${rejecting.tax_code ?? '—'}` : ''}
        isPending={reject.isPending}
        onClose={() => setRejecting(null)}
        onConfirm={(reason) => rejecting && reject.mutate({ id: rejecting.id, reason })}
      />
    </div>
  );
}
