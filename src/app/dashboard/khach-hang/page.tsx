'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { UnderlineTabs } from '@/components/ui/underline-tabs';
import { Phone, Mail, Users, AlertCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/axios';
import { formatDistanceToNow } from '@/lib/formatters';
import { LEAD_STATUSES, LEAD_STATUS_LABEL, type LeadStatus } from '@/lib/leads';

interface Lead {
  uuid: string;
  name: string | null;
  phone: string;
  email: string | null;
  message: string | null;
  status: LeadStatus;
  created_at: string | null;
  property: { title: string; slug: string; type: string; thumbnail: string | null } | null;
}

interface LeadsResponse {
  data: Lead[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
  counts: Record<'all' | LeadStatus, number>;
}

const STATUS_TONE: Record<LeadStatus, string> = {
  new: 'bg-cta text-white',
  contacted: 'bg-primary-light text-primary',
  closed: 'bg-gray-100 text-gray-600',
};

/**
 * Khách hàng tiềm năng (lead) gửi qua form "Yêu cầu tư vấn" ở trang chi tiết các tin của mình
 * (Notion 23/09). Trước trang này, lead được lưu vào DB nhưng không có chỗ nào để môi giới xem.
 */
export default function LeadsPage() {
  const [tab, setTab] = useState<'all' | LeadStatus>('all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<LeadsResponse>({
    queryKey: ['my-leads', tab, page],
    queryFn: () =>
      api
        .get('/api/v2/my/leads', { params: { page, ...(tab !== 'all' ? { status: tab } : {}) } })
        .then((res) => res.data.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ uuid, status }: { uuid: string; status: LeadStatus }) =>
      api.patch(`/api/v2/my/leads/${uuid}`, { status }).then((res) => res.data),
    onSuccess: (res) => {
      toast.success(res?.message || 'Đã cập nhật.');
      queryClient.invalidateQueries({ queryKey: ['my-leads'] });
    },
    onError: () => toast.error('Không cập nhật được trạng thái. Vui lòng thử lại.'),
  });

  const leads = data?.data ?? [];
  const counts = data?.counts;
  const meta = data?.meta;

  const changeTab = (next: string) => {
    setTab(next as 'all' | LeadStatus);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Khách hàng tiềm năng</h1>
        <p className="mt-1 text-gray-500">
          Người xem để lại số điện thoại qua form &quot;Yêu cầu tư vấn&quot; ở tin đăng của bạn.
        </p>
      </div>

      <Card className="overflow-hidden rounded-2xl border-gray-100 shadow-sm">
        <div className="bg-gray-50/50 px-6">
          <UnderlineTabs
            tabs={[
              { id: 'all', label: 'Tất cả', count: counts?.all || undefined },
              ...LEAD_STATUSES.map((s) => ({ id: s, label: LEAD_STATUS_LABEL[s], count: counts?.[s] || undefined })),
            ]}
            activeTab={tab}
            onChange={changeTab}
          />
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-gray-100">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-4 p-5">
                  <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              icon={<AlertCircle className="h-8 w-8 text-cta" />}
              title="Không tải được danh sách khách hàng"
              text="Đã xảy ra lỗi khi tải dữ liệu. Vui lòng tải lại trang."
            />
          ) : leads.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8 text-gray-400" />}
              title={tab === 'all' ? 'Chưa có khách hàng nào' : `Không có khách hàng "${LEAD_STATUS_LABEL[tab]}"`}
              text="Khi người xem gửi form Yêu cầu tư vấn ở tin của bạn, họ sẽ hiện ở đây kèm một thông báo."
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <li key={lead.uuid} className="flex flex-col gap-3 p-5 md:flex-row md:items-start">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-bold text-gray-900">{lead.name || 'Khách chưa để tên'}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[lead.status]}`}>
                        {LEAD_STATUS_LABEL[lead.status]}
                      </span>
                      {lead.created_at && (
                        <span className="text-[12px] text-gray-400">{formatDistanceToNow(lead.created_at)}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13.5px]">
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 font-semibold text-primary hover:underline">
                        <Phone className="h-3.5 w-3.5" />
                        {lead.phone}
                      </a>
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-gray-600 hover:text-primary">
                          <Mail className="h-3.5 w-3.5" />
                          {lead.email}
                        </a>
                      )}
                    </div>
                    {lead.message && <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-gray-600">{lead.message}</p>}
                    {lead.property && (
                      <Link
                        href={`/${lead.property.type === 'rent' ? 'cho-thue' : 'mua-ban'}/${lead.property.slug}`}
                        className="inline-flex max-w-full items-center gap-1.5 text-[12.5px] text-gray-500 hover:text-primary"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{lead.property.title}</span>
                      </Link>
                    )}
                  </div>

                  <label className="flex shrink-0 items-center gap-2 text-[13px] text-gray-500">
                    Trạng thái
                    <select
                      value={lead.status}
                      disabled={updateStatus.isPending}
                      onChange={(e) => updateStatus.mutate({ uuid: lead.uuid, status: e.target.value as LeadStatus })}
                      className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-[13px] font-medium text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white disabled:opacity-40"
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[13px] text-gray-600">Trang {meta.current_page} / {meta.last_page}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            disabled={page >= meta.last_page}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white disabled:opacity-40"
            aria-label="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="py-20 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">{icon}</div>
      <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
      <p className="mx-auto max-w-md text-gray-500">{text}</p>
    </div>
  );
}
