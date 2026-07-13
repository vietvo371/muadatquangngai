'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import axios from '@/lib/axios';
import { PRIORITY_REGIONS } from '@/lib/category-menu';

interface District {
  id: number;
  name: string;
}

interface RegionSelectProps {
  value?: number | '';
  onChange: (districtId: number | '', name: string) => void;
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
}

// Bộ chọn Khu vực dùng chung cho FilterHorizontal + FilterSidebar: 9 xã/phường ưu tiên hiện
// trước, "Xem thêm" mở hết 96 đơn vị (có ô tìm kiếm vì danh sách khá dài).
export function RegionSelect({
  value = '',
  onChange,
  className = '',
  buttonClassName = '',
  placeholder = 'Chọn khu vực',
}: RegionSelectProps) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const provRes = await axios.get('/api/v2/locations/provinces');
        const province = provRes.data.data?.[0];
        if (!province) return;
        const distRes = await axios.get(`/api/v2/locations/districts/${province.id}`);
        setDistricts(distRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch regions:', error);
      }
    };
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const priorityDistricts = districts.filter((d) => PRIORITY_REGIONS.includes(d.name));
  const restDistricts = districts.filter((d) => !PRIORITY_REGIONS.includes(d.name));

  const filteredRest = search
    ? restDistricts.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    : restDistricts;

  const selectedName = districts.find((d) => d.id === value)?.name;

  const handlePick = (d: District) => {
    onChange(d.id, d.name);
    setOpen(false);
    setShowAll(false);
    setSearch('');
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          buttonClassName ||
          'h-9 px-3.5 rounded-lg border border-gray-200 hover:border-gray-350 bg-white font-medium flex items-center gap-1.5 text-[13px] text-gray-700'
        }
      >
        <MapPin className="w-3.5 h-3.5 text-gray-400" />
        <span>{selectedName || placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-[42px] left-0 w-[280px] bg-white border border-gray-150 rounded-xl shadow-xl z-40 overflow-hidden">
          {!showAll ? (
            <>
              <div className="px-3.5 pt-3 pb-1">
                <h4 className="font-bold text-gray-800 text-[12px] uppercase tracking-wider">Khu vực nổi bật</h4>
              </div>
              <div className="max-h-72 overflow-auto py-1">
                <button
                  type="button"
                  onClick={() => { onChange('', ''); setOpen(false); }}
                  className={`w-full px-3.5 py-2 text-left text-[13px] hover:bg-gray-50 ${value === '' ? 'text-primary font-semibold' : 'text-gray-700'}`}
                >
                  Tất cả khu vực
                </button>
                {priorityDistricts.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handlePick(d)}
                    className={`w-full px-3.5 py-2 text-left text-[13px] hover:bg-gray-50 ${d.id === value ? 'text-primary font-semibold' : 'text-gray-700'}`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-100 px-3.5 py-2">
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="text-[12.5px] font-semibold text-primary hover:underline"
                >
                  Xem thêm ({restDistricts.length} khu vực khác)
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="p-2.5 border-b border-gray-100 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm xã/phường/đặc khu..."
                  className="w-full text-[13px] outline-none"
                />
              </div>
              <div className="max-h-72 overflow-auto py-1">
                {filteredRest.length === 0 && (
                  <div className="px-3.5 py-2 text-[13px] text-gray-400">Không tìm thấy</div>
                )}
                {filteredRest.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handlePick(d)}
                    className={`w-full px-3.5 py-2 text-left text-[13px] hover:bg-gray-50 ${d.id === value ? 'text-primary font-semibold' : 'text-gray-700'}`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-100 px-3.5 py-2">
                <button
                  type="button"
                  onClick={() => { setShowAll(false); setSearch(''); }}
                  className="text-[12.5px] font-semibold text-gray-500 hover:text-gray-800"
                >
                  ← Quay lại khu vực nổi bật
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
