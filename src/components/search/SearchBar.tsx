'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, X, Clock, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  type: 'property' | 'project' | 'location';
  text: string;
  data?: {
    province_id?: number;
    district_id?: number;
    id?: number;
  };
}

interface SearchBarProps {
  variant?: 'hero' | 'header' | 'listing';
  className?: string;
}

const popularSearches = [
  'Căn hộ Quảng Ngãi',
  'Nhà mặt phố Đà Nẵng',
  'Đất nền Hội An',
  'Villa Sơn Trà',
  'Chung cư Tam Kỳ',
];

export function SearchBar({ variant = 'hero', className }: SearchBarProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (keyword.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        setSuggestions([
          { type: 'location', text: `${keyword} - Quảng Ngãi`, data: { province_id: 1 } },
          { type: 'location', text: `${keyword} - Đà Nẵng`, data: { province_id: 2 } },
          { type: 'property', text: `Căn hộ ${keyword} view biển`, data: { id: 1 } },
          { type: 'project', text: `Dự án ${keyword} Residence`, data: { id: 1 } },
        ]);
      } catch (error) {
        console.error('Search suggestions error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchKeyword?: string) => {
    const query = searchKeyword || keyword;
    if (!query.trim()) return;
    setShowSuggestions(false);
    router.push(`/tim-kiem?q=${encodeURIComponent(query)}`);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setKeyword(suggestion.text);
    setShowSuggestions(false);
    if (suggestion.type === 'location') {
      const params = new URLSearchParams();
      if (suggestion.data?.province_id) params.set('province_id', String(suggestion.data.province_id));
      if (suggestion.data?.district_id) params.set('district_id', String(suggestion.data.district_id));
      router.push(`/tim-kiem?${params.toString()}`);
    } else if (suggestion.type === 'property') {
      router.push(`/mua-ban/${suggestion.data?.id}`);
    } else if (suggestion.type === 'project') {
      router.push(`/du-an/${suggestion.data?.id}`);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'location': return <MapPin className="h-4 w-4 text-gray-400" />;
      case 'property': return <Building2 className="h-4 w-4 text-primary" />;
      case 'project': return <Clock className="h-4 w-4 text-primary" />;
      default: return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  const isHero = variant === 'hero';

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search Input */}
      <div
        className={cn(
          'relative flex items-center bg-white rounded-xl overflow-visible',
          isHero ? 'shadow-xl' : 'border shadow-sm',
          isHero ? 'h-14' : 'h-11'
        )}
      >
        <Search className={cn('absolute left-4 text-gray-400', isHero ? 'h-5 w-5' : 'h-4 w-4')} />
        
        <input
          ref={inputRef}
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={isHero ? 'Tìm kiếm bất động sản...' : 'Tìm kiếm...'}
          className="flex-1 h-full pl-12 pr-4 bg-transparent border-0 outline-none text-gray-900 placeholder:text-gray-400"
        />

        {keyword && (
          <button
            onClick={() => {
              setKeyword('');
              inputRef.current?.focus();
            }}
            className="absolute right-20 p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}

        <Button
          onClick={() => handleSearch()}
          size={isHero ? 'default' : 'sm'}
          className={cn(
            'm-1 rounded-lg',
            isHero ? 'bg-primary hover:bg-primary/90 h-10 px-6' : 'bg-primary hover:bg-primary/90'
          )}
        >
          Tìm kiếm
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || popularSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border overflow-hidden z-50">
          {suggestions.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1 text-xs font-medium text-gray-500 uppercase">
                Gợi ý
              </p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary-light hover:text-primary rounded-lg text-left transition-colors"
                >
                  {getSuggestionIcon(suggestion.type)}
                  <span className="text-gray-700">{suggestion.text}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {suggestion.type === 'location' ? 'Địa điểm' : 
                     suggestion.type === 'property' ? 'Tin đăng' : 'Dự án'}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {!keyword && (
            <div className="p-2 border-t">
              <p className="px-3 py-1 text-xs font-medium text-gray-500 uppercase">
                Tìm kiếm phổ biến
              </p>
              <div className="flex flex-wrap gap-2 p-2">
                {popularSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handleSearch(search)}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-2 border-t bg-gray-50">
            <div className="flex items-center gap-2">
              <a href="/mua-ban" className="px-3 py-1.5 text-sm text-primary hover:bg-primary-light rounded-lg">
                Mua bán
              </a>
              <a href="/cho-thue" className="px-3 py-1.5 text-sm text-primary hover:bg-primary-light rounded-lg">
                Cho thuê
              </a>
              <a href="/du-an" className="px-3 py-1.5 text-sm text-primary hover:bg-primary-light rounded-lg">
                Dự án
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
