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
  // Simple mode — individual props
  searchKey?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: () => void;
  onStatusChange?: (status: string) => void;
  statusValue?: string;
  statusOptions?: FilterOption[];
  onDateRangeChange?: (range: { from?: string; to?: string }) => void;
  showDateRange?: boolean;
  // Legacy mode — filters array
  filters?: FilterConfig[];
  className?: string;
}

export function FilterBar(props: FilterBarProps) {
  const {
    searchKey, searchPlaceholder = 'Tim kiem...', searchValue, onSearchChange,
    onSearch, onStatusChange, statusValue, statusOptions,
    onDateRangeChange, showDateRange,
    filters: legacyFilters,
    className,
  } = props;

  // Legacy array mode
  if (legacyFilters) {
    const searchFilter = legacyFilters.find(f => f.type === 'search');
    const selectFilters = legacyFilters.filter(f => f.type === 'select');

    return (
      <div className={`flex flex-wrap gap-3 ${className || ''}`}>
        {searchFilter && (
          <div className="flex-1 min-w-[180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={searchFilter.placeholder || 'Tim kiem...'}
                value={searchFilter.value}
                onChange={(e) => searchFilter.onChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchFilter.onChange}
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
            <option value="">{filter.placeholder || 'Tat ca'}</option>
            {filter.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
      </div>
    );
  }

  // Simple mode — individual props
  return (
    <div className={`flex flex-wrap gap-3 ${className || ''}`}>
      {searchKey !== undefined && (
        <div className="flex-1 min-w-[180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {onStatusChange && statusOptions && (
        <select
          className="h-10 px-3 border border-input bg-white rounded-md text-sm min-w-[140px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          value={statusValue}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="">Tat ca</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {showDateRange && onDateRangeChange && (
        <Input
          type="date"
          className="h-10 w-36"
          onChange={(e) => onDateRangeChange({ from: e.target.value })}
        />
      )}

      {onSearch && (
        <Button variant="outline" size="sm" onClick={onSearch}>
          Loc
        </Button>
      )}
    </div>
  );
}
