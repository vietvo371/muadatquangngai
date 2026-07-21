'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MoreVertical, Edit2, Trash2, PlusCircle, Search, Building2, ShieldCheck, ExternalLink,
} from 'lucide-react';
import { agencyAdminApi, type AdminAgency } from '@/lib/admin-api';
import api from '@/lib/axios';
import { AGENCY_BUSINESS_TYPES, agencyBusinessTypeLabel, type AgencyBusinessType } from '@/lib/agency-business-types';

/** Trạng thái form dùng chung cho cả tạo mới và sửa. */
interface AgencyFormState {
  name: string;
  logo: string;
  description: string;
  address: string;
  district_id: string;
  phone: string;
  email: string;
  website: string;
  business_type: AgencyBusinessType;
  is_verified: boolean;
  is_active: boolean;
}

const EMPTY_FORM: AgencyFormState = {
  name: '', logo: '', description: '', address: '', district_id: '',
  phone: '', email: '', website: '', business_type: 'brokerage', is_verified: false, is_active: true,
};

export default function AgenciesClient() {
  const confirm = useConfirm();
  const [agencies, setAgencies] = useState<AdminAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [districts, setDistricts] = useState<Array<{ id: number; name: string }>>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AgencyFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadAgencies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await agencyAdminApi.list();
      setAgencies(res.data ?? []);
    } catch {
      toast.error('Không tải được danh sách doanh nghiệp.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgencies();
    api.get('/api/v2/locations/provinces').then((res) => {
      const province = res.data?.data?.[0];
      if (!province) return;
      return api.get(`/api/v2/locations/districts/${province.id}`).then((d) => setDistricts(d.data?.data ?? []));
    }).catch(() => setDistricts([]));
  }, [loadAgencies]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return agencies.filter((a) => {
      if (typeFilter !== 'all' && a.business_type !== typeFilter) return false;
      if (q && !a.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [agencies, searchQuery, typeFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (a: AdminAgency) => {
    setEditingId(a.id);
    setForm({
      name: a.name,
      logo: a.logo ?? '',
      description: a.description ?? '',
      address: a.address ?? '',
      district_id: a.district_id ? String(a.district_id) : '',
      phone: a.phone ?? '',
      email: a.email ?? '',
      website: a.website ?? '',
      business_type: (a.business_type as AgencyBusinessType) || 'brokerage',
      is_verified: a.verified,
      is_active: a.active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên doanh nghiệp.');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      logo: form.logo.trim() || null,
      description: form.description.trim() || null,
      address: form.address.trim() || null,
      district_id: form.district_id ? Number(form.district_id) : null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      website: form.website.trim() || null,
      business_type: form.business_type,
      is_verified: form.is_verified,
      is_active: form.is_active,
    };
    try {
      if (editingId) {
        await agencyAdminApi.update(editingId, payload);
        toast.success('Đã lưu thay đổi.');
      } else {
        await agencyAdminApi.create(payload);
        toast.success('Đã tạo doanh nghiệp mới.');
      }
      setDialogOpen(false);
      await loadAgencies();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Không lưu được doanh nghiệp.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: AdminAgency) => {
    if (a.agent_count > 0) {
      toast.error(`Còn ${a.agent_count} môi giới thuộc doanh nghiệp này — gỡ hết trước khi xoá.`);
      return;
    }
    const isConfirmed = await confirm({
      title: 'Xoá doanh nghiệp?',
      description: `Bạn có chắc muốn xoá "${a.name}"? Doanh nghiệp sẽ biến mất khỏi danh bạ công khai.`,
      confirmText: 'Xoá ngay',
      variant: 'destructive',
    });
    if (!isConfirmed) return;
    try {
      await agencyAdminApi.delete(a.id);
      setAgencies((prev) => prev.filter((x) => x.id !== a.id));
      toast.success('Đã xoá doanh nghiệp.');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Không xoá được doanh nghiệp.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Quản lý doanh nghiệp
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Danh bạ doanh nghiệp hiển thị công khai tại <code className="text-xs">/doanh-nghiep</code>.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Thêm doanh nghiệp
        </Button>
      </div>

      <Card className="border-gray-100 rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên..."
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
              <SelectTrigger className="w-full sm:w-56">
                {/* SelectValue mặc định hiện thẳng giá trị thô ("developer") — phải tự tra nhãn. */}
                <SelectValue placeholder="Lĩnh vực">
                  {(v: string) => (v === 'all' || !v ? 'Tất cả lĩnh vực' : agencyBusinessTypeLabel(v))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
                {AGENCY_BUSINESS_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doanh nghiệp</TableHead>
                <TableHead>Lĩnh vực</TableHead>
                <TableHead>Khu vực</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead className="text-center">Môi giới</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-gray-400 py-8">Đang tải...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-gray-400 py-8">Chưa có doanh nghiệp nào.</TableCell></TableRow>
              ) : (
                filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{a.name}</span>
                        {a.verified && <ShieldCheck className="h-4 w-4 text-primary" />}
                      </div>
                      <a
                        href={`/doanh-nghiep/${a.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-primary flex items-center gap-1 mt-0.5"
                      >
                        /doanh-nghiep/{a.slug}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {agencyBusinessTypeLabel(a.business_type)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {districts.find((d) => d.id === a.district_id)?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{a.phone || '—'}</TableCell>
                    <TableCell className="text-center font-medium">{a.agent_count}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={a.active ? 'default' : 'secondary'} className={a.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                        {a.active ? 'Đang hoạt động' : 'Đã ẩn'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(a)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(a)} className="text-red-600 focus:text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xoá
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Sửa doanh nghiệp' : 'Thêm doanh nghiệp'}</DialogTitle>
            <DialogDescription>Thông tin hiển thị tại trang danh bạ doanh nghiệp công khai.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Tên doanh nghiệp *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="VD: Sàn GD BĐS Quảng Ngãi"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Lĩnh vực *</Label>
              <Select
                value={form.business_type}
                onValueChange={(v) => v && setForm((f) => ({ ...f, business_type: v as AgencyBusinessType }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue>{(v: string) => agencyBusinessTypeLabel(v)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {AGENCY_BUSINESS_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.business_type !== 'brokerage' && (
                <p className="text-xs text-gray-500 mt-1.5">
                  Chỉ lĩnh vực &quot;Sàn giao dịch bất động sản&quot; mới gán được môi giới và tin đăng.
                </p>
              )}
            </div>

            <div>
              <Label>Mô tả</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Khu vực</Label>
                <Select
                  value={form.district_id || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, district_id: v ?? '' }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Chọn xã/phường">
                      {(v: string) => (!v ? 'Chọn xã/phường' : districts.find((d) => String(d.id) === v)?.name ?? v)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {districts.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>Địa chỉ cụ thể</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>Ảnh logo (URL)</Label>
              <Input
                value={form.logo}
                onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Đã xác minh</p>
                <p className="text-xs text-gray-500">Hiện huy hiệu xác minh trên danh bạ công khai.</p>
              </div>
              <Switch checked={form.is_verified} onCheckedChange={(v) => setForm((f) => ({ ...f, is_verified: v }))} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Đang hoạt động</p>
                <p className="text-xs text-gray-500">Tắt để ẩn khỏi danh bạ công khai mà không xoá dữ liệu.</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Huỷ</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo doanh nghiệp'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
