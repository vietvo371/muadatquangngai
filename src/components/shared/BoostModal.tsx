'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Zap,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import api from '@/lib/axios';
import { formatPrice } from '@/lib/formatters';
import { toast } from 'sonner';

interface BoostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: number;
  propertyTitle: string;
}

interface BoostInfo {
  current_tier: string;
  current_tier_label: string;
  vip_expired_at?: string;
  is_expired: boolean;
  can_renew: boolean;
  packages: Array<{
    id: number;
    name: string;
    type: string;
    price: number;
    duration_days: number;
  }>;
}

const tierColors: Record<string, string> = {
  normal: 'border-gray-200',
  vip: 'border-yellow-400 bg-yellow-50',
  vip_plus: 'border-orange-400 bg-orange-50',
  diamond: 'border-purple-400 bg-purple-50',
};

export function BoostModal({ open, onOpenChange, propertyId, propertyTitle }: BoostModalProps) {
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [mode, setMode] = useState<'boost' | 'renew'>('boost');

  const { data: boostInfo, isLoading } = useQuery({
    queryKey: ['boost-info', propertyId],
    queryFn: async () => {
      const res = await api.get(`/api/v2/properties/${propertyId}/boost`);
      return res.data as { success: boolean; data: BoostInfo };
    },
    enabled: open,
  });

  const boostMutation = useMutation({
    mutationFn: async (tier: string) => {
      // Khoá chống trừ tiền hai lần khi bấm nhanh hai lần hoặc mạng retry (server dedupe theo khoá này).
      const res = await api.post(`/api/v2/properties/${propertyId}/boost`, {
        tier,
        idempotency_key: `boost-${propertyId}-${tier}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Nang cap VIP thanh cong!');
      queryClient.invalidateQueries({ queryKey: ['boost-info', propertyId] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Loi khi nang cap VIP');
    },
  });

  const renewMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/v2/properties/${propertyId}/renew`, {
        idempotency_key: `renew-${propertyId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Gia han VIP thanh cong!');
      queryClient.invalidateQueries({ queryKey: ['boost-info', propertyId] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Loi khi gia han VIP');
    },
  });

  const info = boostInfo?.data;
  const canRenew = info?.can_renew && !info?.is_expired;

  const handleSubmit = () => {
    if (mode === 'renew') {
      renewMutation.mutate();
    } else if (selectedTier) {
      boostMutation.mutate(selectedTier);
    }
  };

  const isPending = boostMutation.isPending || renewMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Nang cap tin dang
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : info ? (
          <div className="space-y-5">
            {/* Property name */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 line-clamp-2">{propertyTitle}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">Hien tai:</span>
                <Badge className={tierColors[info.current_tier]?.split(' ')[0] === 'border-yellow-400' ? 'bg-yellow-100 text-yellow-700' : tierColors[info.current_tier]?.includes('orange') ? 'bg-orange-100 text-orange-700' : tierColors[info.current_tier]?.includes('purple') ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}>
                  {info.current_tier_label}
                </Badge>
                {info.vip_expired_at && (
                  <span className="text-xs text-gray-400">
                    Het han: {new Date(info.vip_expired_at).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
            </div>

            {/* Mode toggle */}
            {canRenew && (
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('renew')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    mode === 'renew'
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-200 text-gray-600 hover:border-primary'
                  }`}
                >
                  <RefreshCw className="h-4 w-4 inline mr-1.5" />
                  Gia han {info.current_tier_label}
                </button>
                <button
                  onClick={() => setMode('boost')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    mode === 'boost'
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-200 text-gray-600 hover:border-primary'
                  }`}
                >
                  <Zap className="h-4 w-4 inline mr-1.5" />
                  Nang cap
                </button>
              </div>
            )}

            {mode === 'renew' ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Gia han VIP {info.current_tier_label} them 30 ngay.
                </p>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500 mb-1">Phi gia han</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(info.packages[0]?.price || 0)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">30 ngay</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-2">
                  Chon goi VIP de hien thi noi bat hon:
                </p>
                <RadioGroup value={selectedTier} onValueChange={setSelectedTier}>
                  {info.packages.map((pkg) => {
                    const isSelected = selectedTier === pkg.type;
                    return (
                      <div key={pkg.id}>
                        <RadioGroupItem value={pkg.type} id={pkg.type} className="peer sr-only" />
                        <Label
                          htmlFor={pkg.type}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${tierColors[pkg.type] || ''} ${isSelected ? 'border-primary ring-2 ring-primary/20' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                            }`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{pkg.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{pkg.duration_days} ngay</p>
                            </div>
                          </div>
                          <p className="font-bold text-primary">{formatPrice(pkg.price)}</p>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Huy
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleSubmit}
                disabled={
                  isPending ||
                  (mode === 'boost' && !selectedTier) ||
                  (mode === 'renew' && !canRenew)
                }
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> :
                  mode === 'renew' ? <RefreshCw className="h-4 w-4 mr-2" /> :
                  <Zap className="h-4 w-4 mr-2" />}
                {mode === 'renew' ? 'Gia han ngay' : 'Nang cap ngay'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Khong the tai thong tin VIP.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
