'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  name: string;
  placeholder?: string;
  type: 'search' | 'select';
  options?: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  filters: FilterConfig[];
  onSearch?: () => void;
  searchPlaceholder?: string;
  className?: string;
}

export function FilterBar({ filters, onSearch, searchPlaceholder = 'Tìm kiếm...', className }: FilterBarProps) {
  const searchFilter = filters.find(f => f.type === 'search');
  const selectFilters = filters.filter(f => f.type === 'select');

  return (
    <div className={`flex flex-wrap gap-3 ${className || ''}`}>
      {searchFilter && (
        <div className="flex-1 min-w-[180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchFilter.value}
              onChange={(e) => searchFilter.onChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {selectFilters.map((filter) => (
        <select
          key={filter.name}
          className="h-10 px-3 border border-input bg-white rounded-md text-sm min-w-[120px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
        >
          <option value="">{filter.placeholder || 'Tất cả'}</option>
          {filter.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {onSearch && (
        <Button variant="outline" size="sm" onClick={onSearch}>
          Lọc
        </Button>
      )}
    </div>
  );
}
