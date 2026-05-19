'use client';
import { X } from 'lucide-react';

export function ActiveFilterChips() {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="flex items-center gap-1.5 bg-primary-light text-primary text-[13px] font-medium rounded-full pl-3 pr-1 py-1 border border-primary/20">
        Nhà phố 
        <button className="hover:bg-primary/20 rounded-full p-0.5 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
      <span className="flex items-center gap-1.5 bg-primary-light text-primary text-[13px] font-medium rounded-full pl-3 pr-1 py-1 border border-primary/20">
        TP Quảng Ngãi 
        <button className="hover:bg-primary/20 rounded-full p-0.5 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
      <span className="flex items-center gap-1.5 bg-primary-light text-primary text-[13px] font-medium rounded-full pl-3 pr-1 py-1 border border-primary/20">
        1 - 3 tỷ
        <button className="hover:bg-primary/20 rounded-full p-0.5 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
      <button className="text-[13px] text-gray-500 hover:text-gray-900 font-semibold ml-2 underline underline-offset-2 transition-colors">
        Xóa tất cả
      </button>
    </div>
  );
}
