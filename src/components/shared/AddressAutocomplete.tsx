'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Search, X, Map } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, lat?: number, lon?: number) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

// Vietnamese Address Cleaner
const cleanOSMAddress = (addressObj: any, displayName: string): string => {
  if (!addressObj) {
    return displayName
      .replace(/,\s*\d{5,6}/g, '') // remove zip code
      .replace(/,\s*Việt Nam$/i, '') // remove country
      .trim();
  }

  const parts: string[] = [];

  // 1. House number & Road
  const houseNumber = addressObj.house_number || '';
  const road = addressObj.road || addressObj.street || '';
  if (houseNumber && road) {
    parts.push(`Số ${houseNumber} ${road}`);
  } else if (road) {
    parts.push(road);
  }

  // 2. Ward / Suburb / Village
  const ward = addressObj.suburb || addressObj.quarter || addressObj.neighbourhood || addressObj.village || addressObj.town || '';
  if (ward) {
    parts.push(ward);
  }

  // 3. District / County
  const district = addressObj.city_district || addressObj.district || addressObj.county || '';
  if (district) {
    parts.push(district);
  }

  // 4. Province / State (Defaulting/Standardizing to Quảng Ngãi)
  const state = addressObj.state || addressObj.province || addressObj.city || '';
  if (state) {
    const cleanedState = state.replace(/^(Tỉnh|Thành phố)\s+/i, '');
    parts.push(cleanedState);
  } else {
    parts.push('Quảng Ngãi');
  }

  // Join parts and clean
  let cleanAddress = parts.filter(Boolean).join(', ');
  cleanAddress = cleanAddress
    .replace(/,\s*\d{5,6}/g, '') // remove zip code
    .replace(/,\s*Việt Nam$/i, '') // remove country name
    .trim();

  return cleanAddress;
};

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Nhập địa chỉ chi tiết...',
  className = '',
  required = false,
}: AddressAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat?: number; lon?: number }>({});
  const isSelectedRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync value from parent
  useEffect(() => {
    if (value !== searchQuery) {
      setSearchQuery(value);
      isSelectedRef.current = true;
    }
  }, [value]);

  // Search logic (debounced)
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3 || isSelectedRef.current) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Query prioritizing Quảng Ngãi, Vietnam
        const q = `${searchQuery}, Quảng Ngãi, Việt Nam`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=vn`,
          {
            headers: {
              'Accept-Language': 'vi,en',
            },
          }
        );
        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) {
        console.error('Failed to fetch address suggestions:', err);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    isSelectedRef.current = false;
    if (!val) {
      onChange('', undefined, undefined);
      setCoords({});
    }
  };

  const handleSelectSuggestion = (item: any) => {
    const cleanAddress = cleanOSMAddress(item.address, item.display_name);
    const lat = Number(item.lat);
    const lon = Number(item.lon);

    isSelectedRef.current = true;
    setSearchQuery(cleanAddress);
    setSuggestions([]);
    setIsFocused(false);
    setCoords({ lat, lon });
    onChange(cleanAddress, lat, lon);
  };

  const clearAddress = () => {
    setSearchQuery('');
    setSuggestions([]);
    setCoords({});
    onChange('', undefined, undefined);
  };

  // Embeddable Google Map URL
  const getEmbedMapUrl = () => {
    if (coords.lat && coords.lon) {
      return `https://maps.google.com/maps?q=${coords.lat},${coords.lon}&z=16&output=embed`;
    }
    if (value) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(value + ', Quảng Ngãi')}&z=16&output=embed`;
    }
    return '';
  };

  const mapUrl = getEmbedMapUrl();

  return (
    <div className={cn('space-y-3 relative', className)} ref={dropdownRef}>
      <div className="relative">
        <Input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          required={required}
          className="h-10 pr-10 pl-9 text-sm rounded-xl border-gray-200 focus:border-primary focus:ring-primary/10 shadow-xs"
        />
        
        {/* Search icon */}
        <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
        
        {/* Loader or clear button */}
        <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {searchQuery && !isLoading && (
            <button
              type="button"
              onClick={clearAddress}
              className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isFocused && (suggestions.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-150 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-50 animate-in fade-in slide-in-from-top-1 duration-250">
          {isLoading && suggestions.length === 0 && (
            <div className="p-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Đang tìm kiếm gợi ý địa chỉ...
            </div>
          )}
          {suggestions.map((item, idx) => {
            const cleaned = cleanOSMAddress(item.address, item.display_name);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors text-xs"
              >
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-gray-800">{cleaned}</p>
                  <p className="text-[10px] text-gray-400 truncate">{item.display_name}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Embedded Map Visualizer */}
      {mapUrl && (
        <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-xs animate-in fade-in duration-300">
          <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Map className="h-3.5 w-3.5 text-primary" />
              Bản đồ vị trí dự án
            </span>
            <span className="text-[10px] text-gray-400 italic">
              {coords.lat ? 'Đã xác định vị trí thực tế' : 'Định vị theo địa chỉ'}
            </span>
          </div>
          <div className="h-48 w-full bg-gray-50 relative">
            <iframe
              src={mapUrl}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}
    </div>
  );
}
