'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  ShieldCheck,
  Building2,
  Shield,
  ExternalLink,
  Eye,
  Search,
} from 'lucide-react';
import { verificationApi, type Verification } from '@/lib/admin-api';
import { toast } from 'sonner';

type VerificationStatus = 'pending' | 'approved' | 'rejected';
type VerificationType = 'agent' | 'agency';

const statusConfig: Record<VerificationStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: 'Cho duyet', className: 'bg-yellow-100 text-yellow-700', icon: Eye },
  approved: { label: 'Da duyet', className: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Tu choi', className: 'bg-red-100 text-red-700', icon: XCircle },
};

const typeConfig: Record<VerificationType, { label: string; icon: React.ElementType }> = {
  agent: { label: 'Dai ly', icon: ShieldCheck },
  agency: { label: 'Cong ty', icon: Building2 },
};

export default function AdminVerificationsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: number | null; reason: string }>({
    open: false, id: null, reason: '',
  });
  const [detailItem, setDetailItem] = useState<Verification | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-verifications', statusFilter, search],
    queryFn: () => verificationApi.list({ type: statusFilter || undefined }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => verificationApi.approve(id),
    onSuccess: () => {
      toast.success('Da duyet yeu cau xac thuc');
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Loi khi duyet'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      verificationApi.reject(id, reason),
    onSuccess: () => {
      toast.success('Da tu choi yeu cau');
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      setRejectDialog({ open: false, id: null, reason: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Loi khi tu choi'),
  });

  const verifications: Verification[] = data?.data || [];

  const filtered = search
    ? verifications.filter(
        (v) =>
          v.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          v.user?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : verifications;

  const pendingCount = verifications.filter((v) => v.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Xac thuc dai ly</h1>
        <p className="text-sm text-gray-500 mt-1">Duyet yeu cau xac thuc dai ly va cong ty moi gioi</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(Object.keys(statusConfig) as VerificationStatus[]).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const count = verifications.filter((v) => v.status === status).length;
          return (
            <Card key={status}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${config.className}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-gray-500">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tim theo ten, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="h-10 px-3 border rounded-md text-sm bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tat ca trang thai</option>
          {statusConfig && (Object.entries(statusConfig) as [VerificationStatus, typeof statusConfig[keyof typeof statusConfig]][]).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Khong co yeu cau nao"
          description="Tat ca yeu cau xac thuc da duoc xu ly"
          icon={<ShieldCheck className="h-12 w-12" />}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Nguoi dung</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Loai</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Thong tin</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Tai lieu</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Ngay gui</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Trang thai</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Thao tac</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((v) => {
                    const typeCfg = typeConfig[v.type as VerificationType];
                    const statusCfg = statusConfig[v.status as VerificationStatus];
                    const TypeIcon = typeCfg?.icon || ShieldCheck;
                    const StatusIcon = statusCfg?.icon || Eye;
                    return (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={v.user?.avatar || undefined} />
                              <AvatarFallback>{v.user?.name?.charAt(0) ?? '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{v.user?.name}</p>
                              <p className="text-xs text-gray-500">{v.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <TypeIcon className="h-4 w-4 text-primary" />
                            {typeCfg?.label}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {v.type === 'agency' && v.agency_name && (
                            <p className="font-medium">{v.agency_name}</p>
                          )}
                          {v.license_number && (
                            <p className="text-xs text-gray-500">GPLX: {v.license_number}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {v.documents?.slice(0, 2).map((doc, i) => (
                              <a key={i} href={doc} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded hover:bg-gray-100">
                                <ExternalLink className="h-4 w-4 text-primary" />
                              </a>
                            ))}
                            {v.documents && v.documents.length > 2 && (
                              <span className="text-xs text-gray-400">+{v.documents.length - 2}</span>
                            )}
                            {(!v.documents || v.documents.length === 0) && (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(v.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusCfg?.className}>
                            {statusCfg?.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setDetailItem(v)} className="h-8 px-2">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {v.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={() => { if (confirm('Xac nhan duyet?')) approveMutation.mutate(v.id); }}
                                  disabled={approveMutation.isPending}
                                  className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={() => setRejectDialog({ open: true, id: v.id, reason: '' })}
                                  className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(o) => !o && setRejectDialog({ open: false, id: null, reason: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tu choi yeu cau</DialogTitle>
            <DialogDescription>Vui long nhap ly do tu choi. Nguoi dung se duoc thong bao.</DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog((p) => ({ ...p, reason: e.target.value }))}
            placeholder="Vi du: Giay phép khong hop le, thong tin khong chinh xac..."
            rows={4}
            className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-primary/20"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: null, reason: '' })}>
              Huy
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectDialog.id && rejectMutation.mutate({ id: rejectDialog.id, reason: rejectDialog.reason })}
              disabled={!rejectDialog.reason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Dang xu ly...' : 'Tu choi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailItem} onOpenChange={(o) => !o && setDetailItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiet yeu cau xac thuc</DialogTitle>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={detailItem.user?.avatar || undefined} />
                  <AvatarFallback>{detailItem.user?.name?.charAt(0) ?? '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{detailItem.user?.name}</p>
                  <p className="text-sm text-gray-500">{detailItem.user?.email}</p>
                  {detailItem.user?.phone && <p className="text-sm text-gray-500">{detailItem.user?.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Loai</p>
                  <p className="font-medium">{typeConfig[detailItem.type as VerificationType]?.label}</p>
                </div>
                {detailItem.agency_name && (
                  <div>
                    <p className="text-gray-500">Cong ty</p>
                    <p className="font-medium">{detailItem.agency_name}</p>
                  </div>
                )}
                {detailItem.license_number && (
                  <div>
                    <p className="text-gray-500">So GPLX</p>
                    <p className="font-medium">{detailItem.license_number}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Trang thai</p>
                  <Badge className={statusConfig[detailItem.status as VerificationStatus]?.className}>
                    {statusConfig[detailItem.status as VerificationStatus]?.label}
                  </Badge>
                </div>
              </div>

              {detailItem.documents && detailItem.documents.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Tai lieu dinh kem</p>
                  <div className="flex flex-col gap-2">
                    {detailItem.documents.map((doc, i) => (
                      <a key={i} href={doc} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <ExternalLink className="h-4 w-4" />
                        Tai lieu {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {detailItem.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      if (confirm('Xac nhan duyet?')) {
                        approveMutation.mutate(detailItem.id);
                        setDetailItem(null);
                      }
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Duyet
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setRejectDialog({ open: true, id: detailItem.id, reason: '' });
                      setDetailItem(null);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Tu choi
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
