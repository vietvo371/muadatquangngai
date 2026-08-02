'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface TitleDescriptionFieldsProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  categoryId: string;
  aiLoading: boolean;
  onGenerateAI: () => void;
  descriptionMin: number;
  /**
   * Trang đăng tin đặt tiêu đề/mô tả ở CUỐI form, trong 1 section riêng kèm ô AI nổi bật
   * ("callout") — vì spec yêu cầu AI dùng dữ liệu các mục nhập trước đó. Trang sửa tin đặt
   * ngay trong section "Thông tin cơ bản", nút AI nhỏ nằm cạnh nhãn ("inline"). Đây là khác
   * biệt bố cục CÓ CHỦ ĐÍCH giữa 2 trang, không phải lỗi cần đồng bộ — nên tách 2 biến thể
   * thay vì ép về một kiểu.
   */
  variant: 'callout' | 'inline';
}

export function TitleDescriptionFields({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  categoryId,
  aiLoading,
  onGenerateAI,
  descriptionMin,
  variant,
}: TitleDescriptionFieldsProps) {
  if (variant === 'inline') {
    return (
      <>
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <Label className="font-semibold text-gray-700">Tiêu đề tin đăng <span className="text-red-500">*</span></Label>
            <Button
              type="button"
              size="sm"
              disabled={aiLoading || !categoryId}
              onClick={onGenerateAI}
              className="h-8 bg-primary hover:bg-primary/90 text-white"
            >
              {aiLoading ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Đang viết...</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Tạo bằng AI</>
              )}
            </Button>
          </div>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="VD: Nhà riêng 3 tầng mặt tiền đường Hùng Vương, sổ hồng riêng"
            className="h-12 bg-gray-50 border-gray-200 focus:ring-primary focus:border-primary"
          />
          <div className="flex justify-between mt-2">
            <p className="text-xs text-gray-500">Tối thiểu 10 ký tự</p>
            <p className="text-xs font-medium text-gray-500">{title.length}/99</p>
          </div>
        </div>

        <div>
          <Label className="font-semibold text-gray-700">Mô tả chi tiết <span className="text-red-500">*</span></Label>
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Giới thiệu chi tiết về diện tích, tiện ích, vị trí, tình trạng pháp lý..."
            rows={7}
            className="mt-2 bg-gray-50 border-gray-200 focus:ring-primary focus:border-primary resize-none"
          />
          <p className="text-xs text-gray-500 mt-1.5">Tối thiểu {descriptionMin} ký tự — {description.length} ký tự</p>
        </div>
      </>
    );
  }

  return (
    <section>
      <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b">Nội dung tin đăng</h3>

      {/* Trợ lý AI — sinh nội dung từ đúng dữ liệu đã nhập ở trên. Không tự ghi đè nội dung
          có sẵn mà hỏi xác nhận trước (xử lý trong onGenerateAI). */}
      <div className="mb-6 rounded-xl border border-primary/20 bg-primary-light/40 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">Để AI viết giúp bạn</p>
            <p className="text-[13px] text-gray-500 mt-0.5">
              AI dựa trên thông tin bạn vừa nhập ở trên, không tự thêm thông tin khác.
            </p>
          </div>
          {/* Một nút duy nhất (feedback 28/07 mục 5) — trước đây 3 nút Tạo tiêu đề / Viết mô
              tả / Tạo cả hai chỉ làm tăng số thao tác mà kết quả mong muốn gần như luôn là
              "sinh cả hai". */}
          <div className="shrink-0">
            <Button
              type="button"
              disabled={aiLoading || !categoryId}
              onClick={onGenerateAI}
              className="h-10 px-4 bg-primary hover:bg-primary/90 text-white"
            >
              {aiLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang viết nội dung...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />Tạo tiêu đề & mô tả bằng AI</>
              )}
            </Button>
          </div>
        </div>
        {!categoryId && (
          <p className="text-[13px] text-amber-700 mt-2.5">
            Chọn danh mục bất động sản ở trên trước khi dùng AI.
          </p>
        )}
      </div>

      <div className="mb-6">
        <Label className="font-semibold text-gray-700">Tiêu đề tin đăng <span className="text-red-500">*</span></Label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="VD: Nhà riêng 3 tầng mặt tiền đường Hùng Vương, sổ hồng riêng"
          className="mt-2 h-12 bg-gray-50 border-gray-200 focus:ring-primary focus:border-primary"
        />
        <div className="flex justify-between mt-2">
          <p className="text-xs text-gray-500">Tối thiểu 10 ký tự</p>
          <p className="text-xs font-medium text-gray-500">{title.length}/99</p>
        </div>
      </div>

      <div>
        <Label className="font-semibold text-gray-700">Mô tả chi tiết <span className="text-red-500">*</span></Label>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Giới thiệu chi tiết về diện tích, tiện ích, vị trí, tình trạng pháp lý..."
          rows={7}
          className="mt-2 bg-gray-50 border-gray-200 focus:ring-primary focus:border-primary resize-none"
        />
        <div className="flex justify-between items-center mt-1.5">
          <p className="text-xs text-gray-500">Tối thiểu {descriptionMin} ký tự</p>
          <p className={`text-xs font-medium ${description.length < descriptionMin ? 'text-gray-400' : 'text-green-600'}`}>
            {description.length}/{descriptionMin}
          </p>
        </div>
      </div>
    </section>
  );
}
