'use client';

import { Plus, Trash2, ChevronUp, ChevronDown, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PriceInput } from '@/components/shared/PriceInput';

export interface FloorPlanRow {
  id: string;
  type: string;
  area: number | '';
  count: number | '';
  priceFrom: number | '';
  visible: boolean;
}

export const EMPTY_FLOOR_PLAN_ROW = (): FloorPlanRow => ({
  id: `fp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type: '',
  area: '',
  count: '',
  priceFrom: '',
  visible: true,
});

// "Loại mặt bằng điển hình" — CRUD ngay trong form dự án, cùng dữ liệu này feed thẳng vào
// ProjectLivePreview (đã hỗ trợ sẵn field floor_plans) và tính "Đơn giá tự tính" ở trang public.
interface FloorPlansEditorProps {
  value: FloorPlanRow[];
  onChange: (rows: FloorPlanRow[]) => void;
}

export function FloorPlansEditor({ value, onChange }: FloorPlansEditorProps) {
  const updateRow = (id: string, updates: Partial<FloorPlanRow>) => {
    onChange(value.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  };

  const removeRow = (id: string) => {
    onChange(value.filter((row) => row.id !== id));
  };

  const addRow = () => {
    onChange([...value, EMPTY_FLOOR_PLAN_ROW()]);
  };

  const moveRow = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow duration-300">
      <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-6">
        <CardTitle className="text-[14px] font-bold text-gray-800 flex items-center gap-2">
          <Layers className="h-4.5 w-4.5 text-primary" />
          Loại mặt bằng điển hình
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {value.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            Chưa có loại mặt bằng nào — hệ thống sẽ tự tạo dữ liệu mẫu chung chung nếu để trống.
          </p>
        )}

        {value.map((row, index) => (
          <div key={row.id} className="rounded-xl border border-gray-150 p-4 space-y-3 bg-gray-50/40">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Tên loại mặt bằng
                </label>
                <Input
                  placeholder="Ví dụ: Shophouse 3,5 tầng"
                  value={row.type}
                  onChange={(e) => updateRow(row.id, { type: e.target.value })}
                  className="h-10 text-sm rounded-xl border-gray-200 bg-white"
                />
              </div>
              <div className="flex items-center gap-1 pt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => moveRow(index, -1)}
                  disabled={index === 0}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Di chuyển lên"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveRow(index, 1)}
                  disabled={index === value.length - 1}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Di chuyển xuống"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                  aria-label="Xóa loại mặt bằng"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Diện tích (m²)</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="120"
                  value={row.area}
                  onChange={(e) => updateRow(row.id, { area: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="h-10 text-sm rounded-xl border-gray-200 bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Số lượng</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="2"
                  value={row.count}
                  onChange={(e) => updateRow(row.id, { count: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="h-10 text-sm rounded-xl border-gray-200 bg-white"
                />
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Giá bán (VNĐ)</label>
                <PriceInput
                  value={row.priceFrom}
                  onChange={(val) => updateRow(row.id, { priceFrom: val })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hiển thị</label>
                <div className="h-10 flex items-center">
                  <Switch
                    checked={row.visible}
                    onCheckedChange={(checked) => updateRow(row.id, { visible: checked })}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addRow}
          className="w-full h-10 text-sm rounded-xl border-dashed border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Thêm loại mặt bằng
        </Button>
      </CardContent>
    </Card>
  );
}
