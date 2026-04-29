'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/formatters';

interface Package {
  id: number;
  name: string;
  type: 'vip' | 'vip_plus' | 'diamond';
  price: number;
  duration_days: number;
  highlight_color: string;
  features: string[];
}

interface BoostModalProps {
  propertyId: number;
  propertyTitle: string;
  currentVipType: string | null;
  vipExpiresAt: string | null;
  packages: Package[];
  onSuccess: () => void;
}

const VIP_LABELS = {
  normal: 'Tin thường',
  vip: 'VIP',
  vip_plus: 'VIP+',
  diamond: 'Diamond',
};

const VIP_COLORS = {
  normal: 'bg-gray-100 text-gray-700',
  vip: 'bg-blue-100 text-blue-700',
  vip_plus: 'bg-red-100 text-red-700',
  diamond: 'bg-purple-100 text-purple-700',
};

export function BoostModal({
  propertyId,
  propertyTitle,
  currentVipType,
  vipExpiresAt,
  packages,
  onSuccess,
}: BoostModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBoost = async () => {
    if (!selectedPackage) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/my/properties/${propertyId}/boost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ package_id: selectedPackage.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to boost property');
      }

      toast.success('Đã nâng cấp tin thành công!');
      onSuccess();
    } catch (error) {
      toast.error('Không thể nâng cấp tin. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/my/properties/${propertyId}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to renew property');
      }

      toast.success('Đã gia hạn tin thành công!');
      onSuccess();
    } catch (error) {
      toast.error('Không thể gia hạn tin. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const currentVip = currentVipType || 'normal';

  return (
    <div className="space-y-6">
      {/* Property Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-500">Tin đăng</p>
        <p className="font-medium">{propertyTitle}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge className={VIP_COLORS[currentVip as keyof typeof VIP_COLORS]}>
            {VIP_LABELS[currentVip as keyof typeof VIP_LABELS]}
          </Badge>
          {vipExpiresAt && (
            <span className="text-sm text-gray-500">
              Hết hạn: {new Date(vipExpiresAt).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <h3 className="font-semibold">Nâng cấp tin VIP</h3>
        <div className="grid gap-3">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedPackage?.id === pkg.id
                  ? 'border-primary bg-primary-light'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{pkg.name}</p>
                  <p className="text-sm text-gray-500">{pkg.duration_days} ngày</p>
                </div>
                <p className="font-bold text-primary">{formatPrice(pkg.price)}</p>
              </div>
              {pkg.features && pkg.features.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {pkg.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <span className="mr-2 text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </button>
          ))}
        </div>

        {selectedPackage && (
          <Button
            className="w-full bg-cta hover:bg-cta-dark"
            onClick={handleBoost}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : `Nâng cấp lên ${selectedPackage.name}`}
          </Button>
        )}

        <div className="border-t pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleRenew}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Gia hạn tin đăng (miễn phí)'}
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Gia hạn sẽ đưa tin về đầu danh sách mà không cần mua VIP
          </p>
        </div>
      </div>
    </div>
  );
}
