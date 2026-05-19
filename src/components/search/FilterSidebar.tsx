'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export function FilterSidebar() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    type: true,
    location: true,
    price: true,
    area: true,
    bedrooms: true,
  });

  const toggleSection = (section: string) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="py-5 border-b border-gray-100">
      <button 
        onClick={() => toggleSection(id)}
        className="flex items-center justify-between w-full text-[13px] font-semibold text-gray-900 uppercase tracking-wider mb-3 hover:text-primary transition-colors"
      >
        {title}
        {expanded[id] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded[id] && <div>{children}</div>}
    </div>
  );

  return (
    <div className="w-[260px] flex-shrink-0 border-r border-gray-100 pr-6 hidden lg:block bg-white h-[calc(100vh-80px)] sticky top-20 overflow-y-auto">
      {/* Types */}
      <Section id="type" title="Loại bất động sản">
        <div className="space-y-3">
          {['Nhà phố', 'Căn hộ', 'Đất nền', 'Biệt thự', 'Mặt bằng kinh doanh'].map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox id={`type-${type}`} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
              <span className="text-[14px] text-gray-700 group-hover:text-gray-900 transition-colors">{type}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Location */}
      <Section id="location" title="Khu vực">
        <select className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[14px] focus:ring-[3px] focus:ring-primary/15 focus:border-primary outline-none transition-all mb-2 cursor-pointer text-gray-700">
          <option value="">Chọn Quận/Huyện</option>
          <option value="1">TP Quảng Ngãi</option>
          <option value="2">Huyện Bình Sơn</option>
          <option value="3">Huyện Sơn Tịnh</option>
          <option value="4">Huyện Tư Nghĩa</option>
        </select>
        <select className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[14px] focus:ring-[3px] focus:ring-primary/15 focus:border-primary outline-none transition-all cursor-pointer text-gray-700 mt-2">
          <option value="">Chọn Phường/Xã</option>
        </select>
      </Section>

      {/* Price */}
      <Section id="price" title="Mức giá">
        <div className="flex items-center gap-2 mb-3">
          <input type="number" placeholder="Từ" className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[14px] focus:ring-[3px] focus:ring-primary/15 focus:border-primary outline-none transition-all placeholder:text-gray-400 text-gray-700" />
          <span className="text-gray-400 font-medium">-</span>
          <input type="number" placeholder="Đến" className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[14px] focus:ring-[3px] focus:ring-primary/15 focus:border-primary outline-none transition-all placeholder:text-gray-400 text-gray-700" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['Dưới 1 tỷ', '1-3 tỷ', '3-5 tỷ', 'Trên 5 tỷ'].map((preset) => (
            <button key={preset} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[12px] font-medium rounded-full transition-colors border border-gray-200">
              {preset}
            </button>
          ))}
        </div>
      </Section>

      {/* Area */}
      <Section id="area" title="Diện tích">
        <div className="flex items-center gap-2 mb-3">
          <input type="number" placeholder="Từ m²" className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[14px] focus:ring-[3px] focus:ring-primary/15 focus:border-primary outline-none transition-all placeholder:text-gray-400 text-gray-700" />
          <span className="text-gray-400 font-medium">-</span>
          <input type="number" placeholder="Đến m²" className="w-full h-10 border border-gray-200 rounded-lg px-3 text-[14px] focus:ring-[3px] focus:ring-primary/15 focus:border-primary outline-none transition-all placeholder:text-gray-400 text-gray-700" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['Dưới 50m²', '50-100m²', '100-200m²', 'Trên 200m²'].map((preset) => (
            <button key={preset} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[12px] font-medium rounded-full transition-colors border border-gray-200">
              {preset}
            </button>
          ))}
        </div>
      </Section>

      {/* Bedrooms */}
      <Section id="bedrooms" title="Số phòng ngủ">
        <div className="flex flex-wrap gap-2">
          {['Bất kỳ', '1', '2', '3', '4+'].map((bed, i) => (
            <button key={bed} className={`px-4 py-1.5 text-[13px] font-medium rounded-full transition-colors ${i === 0 ? 'bg-primary text-white border border-primary' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
              {bed}
            </button>
          ))}
        </div>
      </Section>

      {/* Footer Actions */}
      <div className="py-5 flex items-center gap-3">
        <Button variant="outline" className="flex-1 h-10 text-[13px] font-medium border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900">Đặt lại</Button>
        <Button className="flex-1 h-10 bg-primary hover:bg-primary-dark text-white text-[13px] font-medium">Áp dụng</Button>
      </div>
    </div>
  );
}
