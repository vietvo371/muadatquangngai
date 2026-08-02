'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fileUploadApi } from '@/lib/admin-api';
import { useUploadProgress } from '@/hooks/useUploadProgress';

export interface FloorPlanFile {
  url: string;
  thumbnail?: string;
  name: string;
  size: number;
}

interface FloorPlanUploaderProps {
  files: FloorPlanFile[];
  onChange: (files: FloorPlanFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

/**
 * Upload mặt bằng (feedback I.13) — ảnh hoặc PDF. Không dùng chung `ImageUploader` vì mặt
 * bằng KHÔNG có ảnh bìa/kéo-thả sắp xếp, chỉ là danh sách file đơn giản.
 *
 * PDF không dùng thumbnail transform của Cloudinary (chưa kiểm chứng được tài khoản này có hỗ
 * trợ hay không) — hiện icon file + nút "Xem file" mở thẳng URL gốc, luôn hoạt động bất kể
 * Cloudinary phân loại PDF là resource_type nào.
 */
export function FloorPlanUploader({ files, onChange, maxFiles = 5, disabled = false }: FloorPlanUploaderProps) {
  const uploadProgress = useUploadProgress();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPdf = (name: string) => name.toLowerCase().endsWith('.pdf');

  const handleFiles = useCallback(
    async (selectedFiles: FileList | File[]) => {
      const newFiles = Array.from(selectedFiles);
      if (files.length + newFiles.length > maxFiles) {
        setError(`Tối đa ${maxFiles} file mặt bằng được phép tải lên`);
        return;
      }
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      for (const file of newFiles) {
        if (!validTypes.includes(file.type)) {
          setError('Chỉ chấp nhận file JPG, PNG hoặc PDF');
          return;
        }
      }

      setError(null);
      const results = await Promise.all(
        newFiles.map(async (file, idx): Promise<FloorPlanFile | null> => {
          const progressId = `${file.name}-${file.size}-${Date.now()}-${idx}`;
          uploadProgress.start(progressId, file.name);
          try {
            const res = await fileUploadApi.upload(file, (percent) => uploadProgress.update(progressId, percent));
            return {
              url: res.url,
              // PDF: bỏ qua thumbnail transform, xem ghi chú đầu file.
              thumbnail: isPdf(file.name) ? undefined : res.thumbnail,
              name: file.name,
              size: file.size,
            };
          } catch {
            return null;
          } finally {
            uploadProgress.finish(progressId);
          }
        })
      );
      const uploaded = results.filter((f): f is FloorPlanFile => f !== null);
      if (uploaded.length > 0) onChange([...files, ...uploaded]);
      if (uploaded.length < newFiles.length) setError('Một vài file tải lên thất bại, vui lòng thử lại.');
    },
    [files, maxFiles, onChange, uploadProgress]
  );

  const canUpload = files.length < maxFiles;

  return (
    <div>
      {canUpload && (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors border-gray-300 hover:border-gray-400',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            multiple
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = '';
            }}
            disabled={disabled}
            className="hidden"
          />
          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600 font-medium">
            Kéo thả hoặc <span className="text-blue-600">chọn file mặt bằng</span>
          </p>
          <p className="text-sm text-gray-400 mt-1">JPG, PNG, PDF — tối đa {maxFiles} file</p>
        </div>
      )}

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      {/* Tiến trình upload thật theo từng file (feedback I.8) */}
      {Object.entries(uploadProgress.items).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(uploadProgress.items).map(([id, item]) => (
            <div key={id} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 truncate max-w-[140px]">{item.name}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-150"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-9 text-right">{item.percent}%</span>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={file.url} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {file.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.thumbnail} alt={file.name} className="h-14 w-14 object-cover rounded shrink-0" />
              ) : (
                <div className="h-14 w-14 rounded bg-gray-200 flex items-center justify-center shrink-0">
                  <FileText className="h-6 w-6 text-gray-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  Xem file <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                className="p-2 text-red-500 hover:bg-red-50 rounded shrink-0"
                title="Xóa"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
