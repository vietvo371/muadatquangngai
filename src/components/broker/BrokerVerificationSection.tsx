'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShieldCheck, Building2, Upload, Loader2, Search, Plus, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fileUploadApi } from '@/lib/admin-api';
import { brokerApi, type BrokerCompany, type BrokerProfile, type ReviewStatus } from '@/lib/broker-api';

const STATUS_BADGE: Record<ReviewStatus, { label: string; className: string; Icon: typeof Clock }> = {
  // Nhãn theo đúng cách gọi của khách (Notion 24/09 "Trạng thái xác thực").
  pending: { label: 'Đang chờ kiểm tra', className: 'bg-gray-100 text-gray-700', Icon: Clock },
  approved: { label: 'Đã xác thực', className: 'bg-primary-light text-primary', Icon: CheckCircle },
  rejected: { label: 'Không được xác thực', className: 'bg-cta/10 text-cta', Icon: XCircle },
};

function StatusBadge({ status }: { status: ReviewStatus | null }) {
  if (!status) return <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[12px] font-semibold text-gray-600">Chưa gửi</span>;
  const { label, className, Icon } = STATUS_BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

const apiMessage = (err: unknown, fallback: string) => {
  const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
  const first = data?.errors && Object.values(data.errors).flat()[0];
  return first || data?.message || fallback;
};

/**
 * Mục "Xác thực môi giới" trong trang Hồ sơ (Notion 24/09): chứng chỉ hành nghề + Công ty/Sàn
 * trực thuộc. Chỉ hiện với tài khoản môi giới. Popup chặn đăng tin dẫn về đây (#xac-thuc-moi-gioi).
 */
/** Hash mà popup chặn đăng tin và thông báo dùng để mở thẳng tab này. */
export const BROKER_SECTION_HASH = '#xac-thuc-moi-gioi';

export function BrokerVerificationSection() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({ queryKey: ['broker-profile'], queryFn: brokerApi.profile });
  const setProfile = (p: BrokerProfile) => queryClient.setQueryData(['broker-profile'], p);

  // Link từ popup có hash #xac-thuc-moi-gioi — cuộn tới đây sau khi dữ liệu hiện ra.
  const sectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined' && window.location.hash === BROKER_SECTION_HASH) {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isLoading]);

  if (isLoading || !profile) {
    return <Card className="rounded-2xl border-gray-100"><CardContent className="p-6 text-sm text-gray-500">Đang tải thông tin xác thực...</CardContent></Card>;
  }
  if (!profile.applies) return null;

  return (
    <div ref={sectionRef} id="xac-thuc-moi-gioi" className="scroll-mt-24 space-y-6">
      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardContent className="space-y-3 p-6">
          <h2 className="text-lg font-bold text-gray-900">Thông tin hành nghề / Xác thực môi giới</h2>
          <p className={`rounded-xl px-4 py-3 text-[13.5px] ${profile.eligible ? 'bg-primary-light text-primary' : 'border border-gray-200 bg-gray-50 text-gray-700'}`}>
            {profile.eligible
              ? 'Tài khoản đã đủ điều kiện đăng tin: chứng chỉ hành nghề và Công ty/Sàn đều đã được duyệt.'
              : `${profile.message} Bạn vẫn soạn tin và lưu nháp bình thường, chỉ bước Đăng tin cần đủ điều kiện.`}
          </p>
        </CardContent>
      </Card>
      <CertificationCard profile={profile} onSaved={setProfile} />
      <CompanyCard profile={profile} onSaved={setProfile} />
    </div>
  );
}

function CertificationCard({ profile, onSaved }: { profile: BrokerProfile; onSaved: (p: BrokerProfile) => void }) {
  const cert = profile.certification;
  const [editing, setEditing] = useState(!cert || cert.status === 'rejected');
  const [form, setForm] = useState({
    certificate_number: cert?.certificate_number ?? '',
    issued_date: cert?.issued_date ?? '',
    issued_by: cert?.issued_by ?? '',
    front_image: cert?.front_image ?? '',
    back_image: cert?.back_image ?? '',
  });
  const [uploading, setUploading] = useState<'front_image' | 'back_image' | null>(null);

  const submit = useMutation({
    mutationFn: () => brokerApi.submitCertification(form),
    onSuccess: (res) => { toast.success(res.message); onSaved(res.data); setEditing(false); },
    onError: (err) => toast.error(apiMessage(err, 'Không gửi được hồ sơ. Vui lòng thử lại.')),
  });

  const upload = async (field: 'front_image' | 'back_image', file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Vui lòng chọn file ảnh.'); return; }
    setUploading(field);
    try {
      const uploaded = await fileUploadApi.upload(file);
      setForm((f) => ({ ...f, [field]: uploaded.url }));
    } catch (error) {
      toast.error((error as Error)?.message || 'Không tải được ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploading(null);
    }
  };

  const inputClass = 'h-10 w-full rounded-lg border border-gray-200 px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-gray-50';
  const readOnly = !editing;

  return (
    <Card className="rounded-2xl border-gray-100 shadow-sm">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-[16px] font-bold text-gray-900">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Chứng chỉ hành nghề
          </h3>
          <StatusBadge status={cert?.status ?? null} />
        </div>

        {cert?.status === 'rejected' && cert.rejection_reason && (
          <div className="rounded-xl border border-cta/30 bg-cta/5 px-4 py-3 text-[13.5px] text-gray-700">
            <span className="font-semibold text-cta">Lý do từ chối: </span>{cert.rejection_reason}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-[13px] font-medium text-gray-700">
            Số chứng chỉ *
            <input className={inputClass} disabled={readOnly} value={form.certificate_number} onChange={(e) => setForm({ ...form, certificate_number: e.target.value })} placeholder="VD: 123/2024/CCHN-BĐS" />
          </label>
          <label className="space-y-1.5 text-[13px] font-medium text-gray-700">
            Ngày cấp *
            <input type="date" className={inputClass} disabled={readOnly} value={form.issued_date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} />
          </label>
          <label className="space-y-1.5 text-[13px] font-medium text-gray-700 sm:col-span-2">
            Nơi cấp *
            <input className={inputClass} disabled={readOnly} value={form.issued_by} onChange={(e) => setForm({ ...form, issued_by: e.target.value })} placeholder="VD: Sở Xây dựng tỉnh Quảng Ngãi" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(['front_image', 'back_image'] as const).map((field) => (
            <div key={field} className="space-y-1.5">
              <p className="text-[13px] font-medium text-gray-700">{field === 'front_image' ? 'Ảnh mặt trước *' : 'Ảnh mặt sau *'}</p>
              <label className={`relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl border-2 border-dashed ${readOnly ? 'border-gray-200' : 'cursor-pointer border-gray-300 hover:border-primary'} bg-gray-50`}>
                {form[field] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form[field]} alt={field === 'front_image' ? 'Mặt trước chứng chỉ' : 'Mặt sau chứng chỉ'} className="absolute inset-0 h-full w-full object-contain" />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-[12.5px] text-gray-500">
                    <Upload className="h-5 w-5" />
                    Bấm để tải ảnh lên
                  </span>
                )}
                {uploading === field && (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="h-6 w-6 animate-spin text-primary" /></span>
                )}
                {!readOnly && (
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(field, e.target.files?.[0])} disabled={uploading !== null} />
                )}
              </label>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {readOnly ? (
            <button type="button" onClick={() => setEditing(true)} className="h-10 rounded-lg border border-gray-200 px-4 text-[14px] font-medium text-gray-700 hover:bg-gray-50">
              Cập nhật hồ sơ
            </button>
          ) : (
            <>
              {cert?.status === 'approved' && (
                <span className="text-[12.5px] text-gray-500">Gửi lại hồ sơ sẽ cần Admin duyệt lại trước khi đăng tin tiếp.</span>
              )}
              {cert && cert.status !== 'rejected' && (
                <button type="button" onClick={() => setEditing(false)} className="h-10 rounded-lg border border-gray-200 px-4 text-[14px] font-medium text-gray-700 hover:bg-gray-50">
                  Huỷ
                </button>
              )}
              <button
                type="button"
                onClick={() => submit.mutate()}
                disabled={submit.isPending || uploading !== null}
                className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
              >
                {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {cert ? 'Gửi lại hồ sơ' : 'Gửi hồ sơ xác thực'}
              </button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyCard({ profile, onSaved }: { profile: BrokerProfile; onSaved: (p: BrokerProfile) => void }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: companies = [], isFetching } = useQuery({
    queryKey: ['broker-companies', debounced],
    queryFn: () => brokerApi.searchCompanies(debounced),
    enabled: open,
  });

  const select = useMutation({
    mutationFn: (c: BrokerCompany) => brokerApi.selectCompany(c.id),
    onSuccess: (res) => { toast.success(res.message); onSaved(res.data); setOpen(false); setQuery(''); },
    onError: (err) => toast.error(apiMessage(err, 'Không cập nhật được Công ty/Sàn.')),
  });

  const company = profile.company;

  return (
    <Card className="rounded-2xl border-gray-100 shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-[16px] font-bold text-gray-900">
            <Building2 className="h-5 w-5 text-primary" />
            Công ty/Sàn giao dịch trực thuộc *
          </h3>
          <StatusBadge status={company?.status ?? null} />
        </div>

        {company && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-[13.5px]">
            <p className="font-semibold text-gray-900">{company.name}</p>
            <p className="text-gray-500">MST {company.tax_code ?? '—'}{company.address ? ` · ${company.address}` : ''}</p>
            {company.status === 'rejected' && company.rejection_reason && (
              <p className="mt-1 text-cta">Lý do từ chối: {company.rejection_reason}. Vui lòng chọn Công ty/Sàn khác.</p>
            )}
          </div>
        )}

        <div className="relative">
          <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder={company ? 'Tìm để đổi Công ty/Sàn khác...' : 'Tìm theo tên hoặc mã số thuế...'}
              className="h-full w-full bg-transparent text-[14px] outline-none"
              aria-label="Tìm Công ty/Sàn giao dịch"
            />
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>
          {open && (
            <div className="absolute left-0 right-0 top-11 z-20 max-h-64 overflow-auto rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl">
              {companies.length === 0 ? (
                <p className="px-3 py-2 text-[13px] text-gray-500">{isFetching ? 'Đang tìm...' : 'Không tìm thấy Công ty/Sàn đã duyệt phù hợp.'}</p>
              ) : (
                companies.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => select.mutate(c)}
                    className="block w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                  >
                    <span className="block text-[13.5px] font-semibold text-gray-900">{c.name}</span>
                    <span className="block text-[12px] text-gray-500">MST {c.tax_code ?? '—'}{c.address ? ` · ${c.address}` : ''}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button type="button" onClick={() => setProposeOpen(true)} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary hover:underline">
          <Plus className="h-4 w-4" />
          Công ty của tôi chưa có trong danh sách
        </button>

        <ProposeCompanyDialog open={proposeOpen} onClose={() => setProposeOpen(false)} onSaved={(p) => { onSaved(p); setProposeOpen(false); }} />
      </CardContent>
    </Card>
  );
}

function ProposeCompanyDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (p: BrokerProfile) => void }) {
  const [form, setForm] = useState({ name: '', tax_code: '', address: '', phone: '', email: '' });
  const propose = useMutation({
    mutationFn: () => brokerApi.proposeCompany({ ...form, email: form.email || undefined }),
    onSuccess: (res) => { toast.success(res.message); onSaved(res.data); setForm({ name: '', tax_code: '', address: '', phone: '', email: '' }); },
    onError: (err) => toast.error(apiMessage(err, 'Không gửi được yêu cầu. Vui lòng thử lại.')),
  });
  const inputClass = 'h-10 w-full rounded-lg border border-gray-200 px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10';
  const fields: Array<{ key: keyof typeof form; label: string; placeholder: string }> = [
    { key: 'name', label: 'Tên Công ty/Sàn *', placeholder: 'VD: Công ty TNHH BĐS Quảng Ngãi' },
    { key: 'tax_code', label: 'Mã số thuế *', placeholder: '10 số' },
    { key: 'address', label: 'Địa chỉ *', placeholder: 'Số nhà, đường, phường/xã' },
    { key: 'phone', label: 'Số điện thoại *', placeholder: 'VD: 0255 3xxx xxx' },
    { key: 'email', label: 'Email', placeholder: 'Không bắt buộc' },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !propose.isPending) onClose(); }}>
      <DialogContent className="sm:max-w-[460px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Thêm Công ty/Sàn giao dịch</DialogTitle>
          <DialogDescription className="text-[13.5px]">
            Yêu cầu sẽ được Admin duyệt. Công ty được gắn ngay vào tài khoản của bạn ở trạng thái chờ duyệt.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map((f) => (
            <label key={f.key} className="block space-y-1.5 text-[13px] font-medium text-gray-700">
              {f.label}
              <input className={inputClass} value={form[f.key]} placeholder={f.placeholder} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
            </label>
          ))}
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={propose.isPending} className="h-10 rounded-lg border border-gray-200 px-4 text-[14px] font-medium text-gray-700 hover:bg-gray-50">Huỷ</button>
          <button type="button" onClick={() => propose.mutate()} disabled={propose.isPending} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
            {propose.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Gửi yêu cầu
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
