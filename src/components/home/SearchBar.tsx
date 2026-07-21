'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, ChevronDown, Clock, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

const tabs = ['Mua bán', 'Cho thuê', 'Dự án'];
const tabPaths = ['/mua-ban', '/cho-thue', '/du-an'];

const categories = [
  'Tất cả loại',
  'Nhà ở',
  'Đất nền',
  'Căn hộ',
  'Biệt thự',
  'Shophouse',
  'Văn phòng',
];

const placeholderExamples = [
  'Bán nhà Vệ Giang...',
  'Đất nền Nghĩa Hành...',
  'Căn hộ trung tâm Quảng Ngãi...',
  'Nhà mặt tiền Quang Trung...',
  'Cho thuê phòng trọ Lê Lợi...',
  'Biệt thự ven sông Trà Khúc...',
  'Shophouse KDC Vạn Tường...',
];

const suggestions = [
  { label: 'Nhà đất bán Quảng Ngãi', type: 'trending' },
  { label: 'Đất nền Nghĩa Hành', type: 'trending' },
  { label: 'Cho thuê nhà Quảng Ngãi', type: 'trending' },
  { label: 'Căn hộ chung cư Quảng Ngãi', type: 'trending' },
  { label: 'Bán nhà Vệ Giang', type: 'recent' },
  { label: 'Đất KDC Vạn Tường', type: 'recent' },
];

export function SearchBar() {
  const [activeTab, setActiveTab] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tất cả loại');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const placeholderIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Typewriter animation for placeholder
  const runTypewriter = useCallback(() => {
    const examples = placeholderExamples;
    const currentText = examples[placeholderIndexRef.current];

    if (charIndexRef.current <= currentText.length) {
      setAnimatedPlaceholder(currentText.slice(0, charIndexRef.current));
      charIndexRef.current += 1;
      timerRef.current = setTimeout(runTypewriter, 60);
    } else {
      // Pause at full text, then erase
      timerRef.current = setTimeout(() => {
        eraseTypewriter();
      }, 1800);
    }
  }, []);

  const eraseTypewriter = useCallback(() => {
    const examples = placeholderExamples;
    const currentText = examples[placeholderIndexRef.current];

    if (charIndexRef.current > 0) {
      charIndexRef.current -= 1;
      setAnimatedPlaceholder(currentText.slice(0, charIndexRef.current));
      timerRef.current = setTimeout(eraseTypewriter, 30);
    } else {
      // Move to next example
      placeholderIndexRef.current = (placeholderIndexRef.current + 1) % examples.length;
      timerRef.current = setTimeout(runTypewriter, 400);
    }
  }, [runTypewriter]);

  useEffect(() => {
    timerRef.current = setTimeout(runTypewriter, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [runTypewriter]);

  // Stop animation while user is typing
  useEffect(() => {
    if (query) {
      setIsTyping(true);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      setIsTyping(false);
      charIndexRef.current = 0;
      timerRef.current = setTimeout(runTypewriter, 600);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, runTypewriter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setShowCategoryMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearch(q?: string) {
    const searchQuery = q ?? query;
    const base = tabPaths[activeTab];
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (category !== 'Tất cả loại') params.set('cat', category);
    setShowSuggestions(false);
    router.push(`${base}?${params.toString()}`);
  }

  const filteredSuggestions = query
    ? suggestions.filter((s) => s.label.toLowerCase().includes(query.toLowerCase()))
    : suggestions;

  return (
    <div className="w-full" ref={wrapperRef}>
      {/* Tabs */}
      <div className="flex w-fit">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-5 py-2.5 text-sm font-semibold transition-colors first:rounded-tl-xl last:rounded-tr-xl ${
              activeTab === i
                ? 'bg-white text-primary'
                : 'bg-white/15 text-white/90 hover:bg-white/25'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search input row */}
      <div className="relative">
        <div className="flex flex-col sm:flex-row rounded-b-xl rounded-tr-xl overflow-visible shadow-2xl">
          {/* Category dropdown + text input — luôn ở 1 hàng, đủ chỗ ngay cả trên mobile 375px */}
          <div className="flex">
            <div className="relative z-10">
              <button
                onClick={() => { setShowCategoryMenu((v) => !v); setShowSuggestions(false); }}
                className="h-full bg-white flex items-center gap-1.5 px-4 border-r border-gray-200 text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap transition-colors rounded-bl-xl sm:rounded-bl-xl"
              >
                {category}
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showCategoryMenu ? 'rotate-180' : ''}`} />
              </button>
              {showCategoryMenu && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setCategory(cat); setShowCategoryMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-primary-light hover:text-primary transition-colors ${
                        category === cat ? 'text-primary font-medium' : 'text-gray-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Text input */}
            <div className="flex items-center bg-white flex-1 px-4 gap-2 min-w-0">
              <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                  if (e.key === 'Escape') setShowSuggestions(false);
                }}
                placeholder={isTyping ? '' : animatedPlaceholder}
                className="w-full min-w-0 py-4 text-sm outline-none text-gray-700 placeholder:text-gray-400 bg-transparent"
              />
            </div>
          </div>

          {/* Submit — hàng riêng, full-width trên mobile để không đẩy tràn viewport */}
          <button
            onClick={() => handleSearch()}
            className="bg-cta hover:bg-cta-dark text-white px-6 py-3.5 sm:py-0 font-bold text-sm flex items-center justify-center gap-2 transition-colors shrink-0 rounded-b-xl sm:rounded-bl-none sm:rounded-br-xl"
          >
            <Search className="h-4 w-4" />
            Tìm kiếm
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            <div className="px-4 pt-3 pb-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {query ? 'Gợi ý tìm kiếm' : 'Tìm kiếm phổ biến'}
              </p>
            </div>
            <ul>
              {filteredSuggestions.map((s) => (
                <li key={s.label}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setQuery(s.label); handleSearch(s.label); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-light hover:text-primary transition-colors text-left"
                  >
                    {s.type === 'trending' ? (
                      <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
            {query && (
              <div className="border-t border-gray-50 px-4 py-2.5">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSearch()}
                  className="text-sm text-primary font-medium hover:underline flex items-center gap-1.5"
                >
                  <Search className="h-3.5 w-3.5" />
                  Tìm &quot;{query}&quot; trong {tabs[activeTab].toLowerCase()}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
