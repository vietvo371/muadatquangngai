'use client';

import { useState, useEffect, useCallback, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/formatters';

interface PriceInputProps {
  value?: number | string;
  onChange?: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  min?: number;
  max?: number;
  allowNegative?: boolean;
  showFormatted?: boolean;
}

export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(({
  value = 0,
  onChange,
  placeholder = 'Nhập giá',
  disabled = false,
  className = '',
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  allowNegative = false,
  showFormatted = true,
}, ref) => {
  // Raw input value (without formatting)
  const [rawValue, setRawValue] = useState<string>('');
  const [displayValue, setDisplayValue] = useState<string>('');

  // Initialize from prop
  useEffect(() => {
    if (typeof value === 'number') {
      const formatted = value > 0 ? value.toLocaleString('vi-VN') : '';
      setRawValue(value > 0 ? value.toString() : '');
      setDisplayValue(formatted);
    } else if (typeof value === 'string') {
      const num = parseInt(value.replace(/\D/g, ''), 10);
      if (!isNaN(num)) {
        setRawValue(num.toString());
        setDisplayValue(num.toLocaleString('vi-VN'));
      }
    }
  }, [value]);

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty, numbers, and minus sign for negative values
    if (allowNegative) {
      if (!/^-?\d*$/.test(inputValue)) return;
    } else {
      // Only allow digits
      if (!/^\d*$/.test(inputValue)) return;
    }

    const numericValue = allowNegative 
      ? parseInt(inputValue, 10) || 0 
      : parseInt(inputValue || '0', 10);

    // Clamp value
    const clampedValue = Math.max(min, Math.min(max, numericValue));

    setRawValue(clampedValue.toString());
    
    // Format display value
    const formatted = clampedValue > 0 
      ? clampedValue.toLocaleString('vi-VN') 
      : '';
    setDisplayValue(formatted);

    // Call onChange with numeric value
    onChange?.(clampedValue);
  }, [onChange, min, max, allowNegative]);

  // Handle paste - remove non-numeric characters
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('Text');
    const numericOnly = pastedData.replace(/\D/g, '');
    
    const numericValue = parseInt(numericOnly, 10) || 0;
    const clampedValue = Math.max(min, Math.min(max, numericValue));

    setRawValue(clampedValue.toString());
    setDisplayValue(clampedValue.toLocaleString('vi-VN'));
    onChange?.(clampedValue);
  }, [onChange, min, max]);

  // Get formatted value for display
  const getFormattedValue = () => {
    const num = parseInt(rawValue || '0', 10);
    if (num === 0) return '';
    return `${num.toLocaleString('vi-VN')} VNĐ`;
  };

  return (
    <div className={className}>
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={showFormatted ? displayValue : rawValue}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled}
        className="text-right font-medium"
      />
      {showFormatted && rawValue && (
        <p className="text-sm text-gray-500 mt-1 text-right">
          {formatPrice(parseInt(rawValue, 10))}
        </p>
      )}
    </div>
  );
});

PriceInput.displayName = 'PriceInput';

// Price Range Input
interface PriceRangeInputProps {
  value?: { min?: number; max?: number };
  onChange?: (value: { min?: number; max?: number }) => void;
  disabled?: boolean;
  className?: string;
  min?: number;
  max?: number;
}

export function PriceRangeInput({
  value = {},
  onChange,
  disabled = false,
  className = '',
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
}: PriceRangeInputProps) {
  const [minValue, setMinValue] = useState<number | undefined>(value.min);
  const [maxValue, setMaxValue] = useState<number | undefined>(value.max);

  useEffect(() => {
    setMinValue(value.min);
    setMaxValue(value.max);
  }, [value.min, value.max]);

  const handleMinChange = (val: number) => {
    setMinValue(val);
    onChange?.({ min: val, max: maxValue });
  };

  const handleMaxChange = (val: number) => {
    setMaxValue(val);
    onChange?.({ min: minValue, max: val });
  };

  return (
    <div className={`flex gap-3 ${className}`}>
      <div className="flex-1">
        <label className="block text-sm text-gray-500 mb-1">Từ</label>
        <PriceInput
          value={minValue}
          onChange={handleMinChange}
          placeholder="Giá thấp nhất"
          disabled={disabled}
          min={min}
          max={maxValue || max}
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm text-gray-500 mb-1">Đến</label>
        <PriceInput
          value={maxValue}
          onChange={handleMaxChange}
          placeholder="Giá cao nhất"
          disabled={disabled}
          min={minValue || min}
          max={max}
        />
      </div>
    </div>
  );
}
