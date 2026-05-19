'use client';
import { Grid, List, Map } from 'lucide-react';

export function SortBar() {
  return (
    <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm lg:bg-transparent lg:p-0 lg:rounded-none lg:border-none lg:shadow-none">
      <span className="text-[14px] text-gray-500">
        <strong className="text-gray-900">234</strong> kết quả
      </span>
      <div className="flex items-center gap-3">
        <select className="h-9 border border-gray-200 rounded-lg px-3 text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-[3px] focus:ring-primary/15 focus:border-primary bg-white cursor-pointer hover:bg-gray-50 transition-colors">
          <option>Mới nhất</option>
          <option>Giá tăng dần</option>
          <option>Giá giảm dần</option>
          <option>Diện tích lớn nhất</option>
        </select>
        <div className="hidden lg:flex border border-gray-200 rounded-lg overflow-hidden h-9">
          <button className="px-3 bg-primary text-white flex items-center justify-center transition-colors" title="Dạng lưới">
            <Grid className="w-4 h-4" />
          </button>
          <button className="px-3 bg-white hover:bg-gray-50 text-gray-500 flex items-center justify-center transition-colors border-l border-gray-200" title="Dạng danh sách">
            <List className="w-4 h-4" />
          </button>
        </div>
        <button className="lg:hidden px-3 border border-gray-200 rounded-lg h-9 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors">
          <Map className="w-4 h-4 text-primary" />
          <span className="text-[13px] font-medium">Bản đồ</span>
        </button>
      </div>
    </div>
  );
}
