'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Building2, Check, Edit2, ExternalLink, MoreVertical, PlusCircle, Search, Trash2, X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useConfirm } from '@/components/providers/confirm-provider';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReviewTabs } from '@/components/admin/broker/ReviewTabs';
import { RejectReasonDialog } from '@/components/admin/broker/RejectReasonDialog';
import { businessAdminApi, type AdminBusiness, type BusinessPayload, type BusinessStatus } from '@/lib/admin-api';
import { AGENCY_BUSINESS_TYPES, agencyBusinessTypeLabel, type AgencyBusinessType } from '@/lib/agency-business-types';
import { formatDate } from '@/lib/formatters';
import api from '@/lib/axios';

const STATUS_TABS: ReadonlyArray<{ value: BusinessStatus; label: string }> = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'rejected', label: 'Bị từ chối' },
];

interface BusinessForm {
  name: string;
  tax_code: string;
  business_type: AgencyBusinessType;
  industry: string;
  area: string;
  description: string;
  district_id: string;
  phone: string;
  address: string;
  email: string;
  website: string;
  logo: string;
  is_demo: boolean;
}

const EMPTY_FORM: BusinessForm = {
  name: '', tax_code: '', business_type: 'brokerage', industry: '', area: '', description: '',
  district_id: '', phone: '', address: '', email: '', website: '', logo: '', is_demo: false,
};

const toForm = (b: AdminBusiness): BusinessForm => ({
  name: b.name,
  tax_code: b.tax_code ?? '',
  business_type: (b.business_type as AgencyBusinessType) || 'brokerage',
  industry: b.industry ?? '',
  area: b.area ?? '',
  description: b.description ?? '',
  district_id: b.district_id ? String(b.district_id) : '',
  phone: b.phone ?? '',
  address: b.address ?? '',
  email: b.email ?? '',
  website: b.website ?? '',
  logo: b.logo ?? '',
  is_demo: b.is_demo,
});

const toPayload = (f: BusinessForm): BusinessPayload => ({
  name: f.name.trim(),
  tax_code: f.tax_code.trim() || null,
  business_type: f.business_type,
  industry: f.industry.trim() || null,
  area: f.area.trim() || null,
  description: f.description.trim() || null,
  district_id: f.district_id ? Number(f.district_id) : null,
  phone: f.phone.trim() || null,
  address: f.address.trim() || null,
  email: f.email.trim() || null,
  website: f.website.trim() || null,
  logo: f.logo.trim() || null,
  is_demo: f.is_demo,
});

const errMsg = (err: unknown, fallback: string) => {
  const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
  const first = data?.errors && Object.values(data.errors).flat()[0];
  return first || data?.message || fallback;
};

const selectClass = 'mt-1.5 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-primary focus:outline-none';

/**
 * Admin → Doanh nghiệp / Sàn giao dịch (Notion 25/09): MỘT module thay cho "Doanh nghiệp" và
 * "Công ty/Sàn giao dịch" cũ, dữ liệu từ bảng businesses. Tab theo status; Từ chối bắt buộc lý do
 * (cũng dùng để ẩn doanh nghiệp đang hoạt động); Duyệt để bật lại doanh nghiệp đã từ chối.
 */
export default function BusinessesClient() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<BusinessStatus>('pending');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBusiness | null>(null);
  const [form, setForm] = useState<BusinessForm>(EMPTY_FORM);
  const [rejecting, setRejecting] = useState<AdminBusiness | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-businesses', status],
    queryFn: () => businessAdminApi.list(status),
  });
  const { data: districts = [] } = useQuery({
    queryKey: ['admin-districts'],
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const provinces = await api.get('/api/v2/locations/provinces');
      const province = provinces.data?.data?.[0];
      if (!province) return [] as Array<{ id: number; name: string }>;
      const res = await api.get(`/api/v2/locations/districts/${province.id}`);
      return (res.data?.data ?? []) as Array<{ id: number; name: string }>;
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
  const save = useMutation({
    mutationFn: () => (editing ? businessAdminApi.update(editing.id, toPayload(form)) : businessAdminApi.create(toPayload(form))),
    onSuccess: (res) => { toast.success(res.message); setDialogOpen(false); refresh(); },
    onError: (err) => toast.error(errMsg(err, 'Không lưu được doanh nghiệp.')),
  });
  const approve = useMutation({
    mutationFn: (id: number) => businessAdminApi.approve(id),
    onSuccess: (res) => { toast.success(res.message); refresh(); },
    onError: (err) => toast.error(errMsg(err, 'Không duyệt được doanh nghiệp.')),
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => businessAdminApi.reject(id, reason),
    onSuccess: (res) => { toast.success(res.message); setRejecting(null); refresh(); },
    onError: (err) => toast.error(errMsg(err, 'Không từ chối được doanh nghiệp.')),
  });
  const remove = useMutation({
    mutationFn: (id: number) => businessAdminApi.delete(id),
    onSuccess: (res) => { toast.success(res.message); refresh(); },
    onError: (err) => toast.error(errMsg(err, 'Không xoá được doanh nghiệp.')),
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.data ?? []).filter((b) => {
      if (typeFilter && b.business_type !== typeFilter) return false;
      return !q || b.name.toLowerCase().includes(q) || (b.tax_code ?? '').includes(q);
    });
  }, [data, search, typeFilter]);

  const districtName = (id: number | null) => districts.find((d) => d.id === id)?.name ?? '—';
  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (b: AdminBusiness) => { setEditing(b); setForm(toForm(b)); setDialogOpen(true); };
  const set = <K extends keyof BusinessForm>(key: K, value: BusinessForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleDelete = async (b: AdminBusiness) => {
    if (b.broker_count > 0) {
      toast.error(`Còn ${b.broker_count} môi giới trực thuộc — hãy dùng Từ chối để ẩn doanh nghiệp.`);
      return;
    }
    const ok = await confirm({
      title: 'Xoá doanh nghiệp?',
      description: `Xoá hẳn "${b.name}" khỏi hệ thống. Hành động này không thể hoàn tác.`,
      confirmText: 'Xoá',
      variant: 'destructive',
    });
    if (ok) remove.mutate(b.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Doanh nghiệp / Sàn giao dịch</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Doanh nghiệp đang hoạt động hiện ở danh bạ <code className="text-xs">/doanh-nghiep</code> và ô chọn Công ty/Sàn của môi giới.
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Thêm doanh nghiệp
        </Button>
      </div>

      <ReviewTabs<BusinessStatus> value={status} counts={data?.counts} onChange={setStatus} tabs={STATUS_TABS} />

      <Card className="overflow-hidden rounded-2xl border-gray-100 shadow-sm">
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc mã số thuế..." className="pl-9" />
            </div>
            <select aria-label="Lĩnh vực" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-primary focus:outline-none sm:w-56">
              <option value="">Tất cả lĩnh vực</option>
              {AGENCY_BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doanh nghiệp</TableHead>
                  <TableHead>Lĩnh vực</TableHead>
                  <TableHead>Khu vực</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead className="text-center">Môi giới</TableHead>
                  <TableHead>{status === 'rejected' ? 'Lý do từ chối' : status === 'pending' ? 'Đề xuất bởi' : 'Duyệt bởi'}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-gray-400">Đang tải...</TableCell></TableRow>
                ) : isError ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-cta">Không tải được danh sách.</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-gray-400">Không có doanh nghiệp nào.</TableCell></TableRow>
                ) : rows.map((b) => (
                  <TableRow key={b.id} data-testid="business-row">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{b.name}</span>
                        {b.is_demo && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Demo</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">{b.tax_code ? `MST ${b.tax_code}` : 'Chưa có MST'}</p>
                      {b.status === 'active' && (
                        <a href={`/doanh-nghiep/${b.slug}`} target="_blank" rel="noopener noreferrer"
                          className="mt-0.5 flex items-center gap-1 text-xs text-gray-400 hover:text-primary">
                          /doanh-nghiep/{b.slug} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{agencyBusinessTypeLabel(b.business_type)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{districtName(b.district_id)}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      <p>{b.phone || '—'}</p>
                      {b.address && <p className="max-w-[220px] truncate text-xs text-gray-400">{b.address}</p>}
                    </TableCell>
                    <TableCell className="text-center font-medium">{b.broker_count}</TableCell>
                    <TableCell className="max-w-[240px] text-sm text-gray-600">
                      {status === 'rejected' ? (
                        <>
                          <p className="line-clamp-2">{b.rejection_reason || '—'}</p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {b.proposed_by_name ? `Đề xuất: ${b.proposed_by_name}` : ''}
                            {b.rejected_at ? ` · ${formatDate(b.rejected_at)}` : ''}
                          </p>
                        </>
                      ) : status === 'pending' ? (
                        <>
                          <p>{b.proposed_by_name ?? '—'}</p>
                          {b.created_at && <p className="text-xs text-gray-400">{formatDate(b.created_at)}</p>}
                        </>
                      ) : (
                        <>
                          <p>{b.reviewed_by_name ?? '—'}</p>
                          {b.approved_at && <p className="text-xs text-gray-400">{formatDate(b.approved_at)}</p>}
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {b.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => approve.mutate(b.id)} disabled={approve.isPending} className="h-8 gap-1">
                              <Check className="h-3.5 w-3.5" /> Duyệt
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setRejecting(b)} className="h-8 gap-1">
                              <X className="h-3.5 w-3.5" /> Từ chối
                            </Button>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Thao tác ${b.name}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(b)}>
                              <Edit2 className="mr-2 h-4 w-4" /> Xem / Sửa
                            </DropdownMenuItem>
                            {b.status === 'rejected' && (
                              <DropdownMenuItem onClick={() => approve.mutate(b.id)}>
                                <Check className="mr-2 h-4 w-4" /> Duyệt lại
                              </DropdownMenuItem>
                            )}
                            {b.status === 'active' && (
                              <DropdownMenuItem onClick={() => setRejecting(b)}>
                                <X className="mr-2 h-4 w-4" /> Từ chối (ẩn khỏi danh bạ)
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDelete(b)} className="text-cta focus:text-cta">
                              <Trash2 className="mr-2 h-4 w-4" /> Xoá
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <RejectReasonDialog
        open={rejecting !== null}
        title={rejecting?.status === 'active' ? 'Từ chối doanh nghiệp đang hoạt động' : 'Từ chối doanh nghiệp'}
        subject={rejecting
          ? `${rejecting.name}${rejecting.broker_count > 0 ? ` — ${rejecting.broker_count} môi giới trực thuộc sẽ mất điều kiện đăng tin cho tới khi chọn doanh nghiệp khác.` : ''}`
          : ''}
        isPending={reject.isPending}
        onClose={() => setRejecting(null)}
        onConfirm={(reason) => rejecting && reject.mutate({ id: rejecting.id, reason })}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Thông tin doanh nghiệp' : 'Thêm doanh nghiệp'}</DialogTitle>
            <DialogDescription>
              {editing
                ? `${STATUS_TABS.find((t) => t.value === editing.status)?.label}${editing.proposed_by_name ? ` · Đề xuất bởi ${editing.proposed_by_name}` : ''}`
                : 'Doanh nghiệp do Admin tạo sẽ hoạt động ngay.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Tên doanh nghiệp *</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mã số thuế</Label>
                <Input value={form.tax_code} onChange={(e) => set('tax_code', e.target.value)} placeholder="10 số" className="mt-1.5" />
              </div>
              <div>
                <Label>Lĩnh vực *</Label>
                <select aria-label="Lĩnh vực doanh nghiệp" value={form.business_type}
                  onChange={(e) => set('business_type', e.target.value as AgencyBusinessType)} className={selectClass}>
                  {AGENCY_BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            {form.business_type !== 'brokerage' && (
              <p className="-mt-2 text-xs text-gray-500">Chỉ lĩnh vực &quot;Sàn giao dịch bất động sản&quot; mới được môi giới chọn làm Công ty/Sàn trực thuộc.</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ngành nghề chi tiết</Label>
                <Input value={form.industry} onChange={(e) => set('industry', e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Khu vực hoạt động</Label>
                <Input value={form.area} onChange={(e) => set('area', e.target.value)} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Mô tả</Label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Xã / Phường</Label>
                <select aria-label="Xã phường" value={form.district_id} onChange={(e) => set('district_id', e.target.value)} className={selectClass}>
                  <option value="">Chọn xã/phường</option>
                  {districts.map((d) => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Địa chỉ</Label>
              <Input value={form.address} onChange={(e) => set('address', e.target.value)} className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => set('email', e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Website</Label>
                <Input value={form.website} onChange={(e) => set('website', e.target.value)} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Ảnh logo (URL)</Label>
              <Input value={form.logo} onChange={(e) => set('logo', e.target.value)} placeholder="https://..." className="mt-1.5" />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Dữ liệu mẫu (demo)</p>
                <p className="text-xs text-gray-500">Vẫn hiện ở danh bạ nhưng ẩn số điện thoại và không bao giờ được chọn làm Công ty/Sàn của môi giới.</p>
              </div>
              <Switch checked={form.is_demo} onCheckedChange={(v) => set('is_demo', v)} />
            </div>
            {editing?.rejection_reason && (
              <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                <span className="font-semibold text-gray-900">Lý do từ chối:</span> {editing.rejection_reason}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Huỷ</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.name.trim()}>
              {save.isPending ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo doanh nghiệp'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
