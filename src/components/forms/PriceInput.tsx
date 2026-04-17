'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PriceInputProps {
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  onUnitChange?: (unit: string) => void;
  placeholder?: string;
}

export function PriceInput({
  value,
  onChange,
  unit = 'total',
  onUnitChange,
  placeholder = '0',
}: PriceInputProps) {
  const [displayValue, setDisplayValue] = useState(
    value > 0 ? value.toLocaleString('vi-VN') : ''
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const numValue = parseInt(rawValue) || 0;
    setDisplayValue(numValue > 0 ? numValue.toLocaleString('vi-VN') : '');
    onChange(numValue);
  };

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="flex-1"
      />
      {onUnitChange ? (
        <Select value={unit} onValueChange={(v) => v && onUnitChange && onUnitChange(v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="total">Tổng giá</SelectItem>
            <SelectItem value="per_m2">Giá/m²</SelectItem>
            <SelectItem value="per_month">Giá/tháng</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="flex items-center px-3 bg-gray-100 rounded-md text-gray-600 text-sm">
          {unit === 'total' && 'VNĐ'}
          {unit === 'per_m2' && 'VNĐ/m²'}
          {unit === 'per_month' && 'VNĐ/tháng'}
        </div>
      )}
    </div>
  );
}
