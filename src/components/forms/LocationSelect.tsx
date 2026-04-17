'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin } from 'lucide-react';

interface LocationValue {
  province_id: number;
  district_id: number;
  ward_id: number;
}

interface LocationSelectProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}

// Mock location data
const provinces = [
  { id: 1, name: 'Đà Nẵng' },
  { id: 2, name: 'TP. Hồ Chí Minh' },
  { id: 3, name: 'Hà Nội' },
  { id: 4, name: 'Quảng Nam' },
  { id: 5, name: 'Quảng Ngãi' },
];

const districts: Record<number, { id: number; name: string }[]> = {
  1: [
    { id: 1, name: 'Hải Châu' },
    { id: 2, name: 'Sơn Trà' },
    { id: 3, name: 'Ngũ Hành Sơn' },
    { id: 4, name: 'Thanh Khê' },
    { id: 5, name: 'Liên Chiểu' },
    { id: 6, name: 'Hòa Vang' },
    { id: 7, name: 'Cẩm Lệ' },
  ],
  2: [
    { id: 8, name: 'Quận 1' },
    { id: 9, name: 'Quận 2' },
    { id: 10, name: 'Quận 3' },
    { id: 11, name: 'Quận 4' },
    { id: 12, name: 'Quận 5' },
    { id: 13, name: 'Quận 7' },
    { id: 14, name: 'Quận Bình Thạnh' },
  ],
  3: [
    { id: 15, name: 'Hoàn Kiếm' },
    { id: 16, name: 'Đống Đa' },
    { id: 17, name: 'Ba Đình' },
    { id: 18, name: 'Hai Bà Trưng' },
    { id: 19, name: 'Thanh Xuân' },
  ],
};

const wards: Record<number, { id: number; name: string }[]> = {
  1: [
    { id: 1, name: 'Phường Hải Châu 1' },
    { id: 2, name: 'Phường Hải Châu 2' },
    { id: 3, name: 'Phường Thạch Thang' },
    { id: 4, name: 'Phường Nam Dương' },
  ],
  8: [
    { id: 5, name: 'Phường Bến Nghé' },
    { id: 6, name: 'Phường Đa Kao' },
    { id: 7, name: 'Phường Tân Định' },
  ],
  15: [
    { id: 8, name: 'Phường Hoàn Kiếm' },
    { id: 9, name: 'Phường Lý Thái Tổ' },
    { id: 10, name: 'Phường Tràng Tiền' },
  ],
};

export function LocationSelect({ value, onChange }: LocationSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedDistricts = districts[value.province_id] || [];
  const selectedWards = wards[value.district_id] || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium">Địa chỉ BĐS</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Province */}
        <Select
          value={String(value.province_id)}
          onValueChange={(v) =>
            onChange({
              province_id: parseInt(v),
              district_id: 0,
              ward_id: 0,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tỉnh/TP" />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* District */}
        <Select
          value={String(value.district_id)}
          onValueChange={(v) =>
            onChange({
              ...value,
              district_id: parseInt(v),
              ward_id: 0,
            })
          }
          disabled={!value.province_id}
        >
          <SelectTrigger>
            <SelectValue placeholder="Quận/Huyện" />
          </SelectTrigger>
          <SelectContent>
            {selectedDistricts.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Ward */}
        <Select
          value={String(value.ward_id)}
          onValueChange={(v) =>
            onChange({
              ...value,
              ward_id: parseInt(v),
            })
          }
          disabled={!value.district_id}
        >
          <SelectTrigger>
            <SelectValue placeholder="Phường/Xã" />
          </SelectTrigger>
          <SelectContent>
            {selectedWards.map((w) => (
              <SelectItem key={w.id} value={String(w.id)}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
