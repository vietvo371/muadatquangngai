'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { fileUploadApi } from '@/lib/admin-api';

export interface UploadedFile {
  id?: number;
  url: string;
  thumbnail?: string;
  name: string;
  size: number;
  isPrimary?: boolean;
  /** Original File object for newly uploaded items */
  file?: File;
}

interface ImageUploaderProps {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  disabled?: boolean;
  className?: string;
}

export function ImageUploader({
  files,
  onChange,
  maxFiles = 10,
  maxSize = 10,
  disabled = false,
  className = '',
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  /** Ảnh tải lỗi, giữ lại File gốc để bấm thử lại được. */
  const [failed, setFailed] = useState<Array<{ id: string; file: File; message: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)';
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `Kích thước file không được vượt quá ${maxSize}MB`;
    }
    return null;
  };

  const handleFiles = useCallback(async (selectedFiles: FileList | File[]) => {
    const newFiles = Array.from(selectedFiles);
    
    // Check max files
    if (files.length + newFiles.length > maxFiles) {
      setError(`Tối đa ${maxFiles} ảnh được phép tải lên`);
      return;
    }

    // Validate each file
    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        setError(error);
        return;
      }
    }

    setError(null);
    setUploadingCount(prev => prev + newFiles.length);

    const uploadPromises = newFiles.map(async (file, idx): Promise<UploadedFile | null> => {
      try {
        const res = await fileUploadApi.upload(file);
        return {
          url: (res as any).url ?? (res as any).data?.url,
          name: file.name,
          size: file.size,
          isPrimary: files.length === 0 && idx === 0,
          file,
        };
      } catch (e) {
        // Giữ lại file lỗi kèm nút thử lại (spec mục 7.1) thay vì chỉ báo toast rồi bỏ
        // luôn — người dùng vừa chọn 10 ảnh mà rớt mạng 1 tấm sẽ không biết là tấm nào.
        setFailed((prev) => [
          ...prev,
          { id: `${file.name}-${file.size}-${Date.now()}-${idx}`, file, message: (e as Error).message },
        ]);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const uploadedFiles: UploadedFile[] = results.filter((item): item is UploadedFile => item !== null);

    setUploadingCount(prev => prev - newFiles.length);
    if (uploadedFiles.length > 0) onChange([...files, ...uploadedFiles]);
  }, [files, maxFiles, maxSize, onChange]);

  /** Tải lại một ảnh đã lỗi. Thành công thì bỏ khỏi danh sách lỗi và thêm vào danh sách ảnh. */
  const retryFailed = useCallback(async (id: string) => {
    const item = failed.find((f) => f.id === id);
    if (!item) return;
    setFailed((prev) => prev.filter((f) => f.id !== id));
    setUploadingCount((n) => n + 1);
    try {
      const res = await fileUploadApi.upload(item.file);
      onChange([
        ...files,
        {
          url: (res as any).url ?? (res as any).data?.url,
          name: item.file.name,
          size: item.file.size,
          isPrimary: files.length === 0,
          file: item.file,
        },
      ]);
    } catch (e) {
      setFailed((prev) => [...prev, { ...item, message: (e as Error).message }]);
      toast.error('Tải lại vẫn thất bại: ' + (e as Error).message);
    } finally {
      setUploadingCount((n) => n - 1);
    }
  }, [failed, files, onChange]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    const file = files[index];
    if (file.url.startsWith('blob:')) {
      URL.revokeObjectURL(file.url);
    }
    const newFiles = files.filter((_, i) => i !== index);
    
    // If removed file was primary, make first file primary
    if (file.isPrimary && newFiles.length > 0) {
      newFiles[0].isPrimary = true;
    }
    
    onChange(newFiles);
  };

  const setPrimary = (index: number) => {
    const newFiles = files.map((file, i) => ({
      ...file,
      isPrimary: i === index,
    }));
    onChange(newFiles);
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    const newFiles = [...files];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    onChange(newFiles);
  };

  // Kéo-thả sắp xếp lại thứ tự ảnh (spec mục 7.1). Dùng HTML5 drag and drop có sẵn thay
  // vì thêm thư viện — danh sách tối đa 10 ảnh nên không cần giải pháp nặng.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Đánh dấu vừa kéo xong để cú click phát sinh sau đó không vô tình đổi ảnh bìa.
  const justDragged = useRef(false);

  const handleCardDragStart = (index: number) => {
    setDragIndex(index);
    justDragged.current = false;
  };

  const handleCardDragEnter = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);
  };

  const handleCardDrop = (index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      moveFile(dragIndex, index);
      justDragged.current = true;
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleCardClick = (index: number) => {
    // Bỏ qua click ngay sau thao tác kéo, tránh đổi ảnh bìa ngoài ý muốn.
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    setPrimary(index);
  };

  const canUpload = files.length < maxFiles;

  return (
    <div className={className}>
      {/* Drop Zone */}
      {canUpload && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary-light'
              : 'border-gray-300 hover:border-gray-400',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />
          
          <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium">
            Kéo thả ảnh vào đây hoặc <span className="text-blue-600">chọn từ máy</span>
          </p>
          <p className="text-sm text-gray-400 mt-1">
            JPG, PNG, GIF, WEBP - Tối đa {maxSize}MB mỗi ảnh
          </p>
          <p className="text-sm text-gray-400">
            Còn lại: {maxFiles - files.length} ảnh
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Uploading indicator */}
      {uploadingCount > 0 && (
        <div className="mt-4 flex items-center gap-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Đang tải {uploadingCount} ảnh...</span>
        </div>
      )}

      {/* Ảnh tải lỗi — hiện rõ tấm nào hỏng kèm nút thử lại (spec mục 7.1) */}
      {failed.length > 0 && (
        <div className="mt-4 space-y-2">
          {failed.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-red-50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-800 truncate">{item.file.name}</p>
                <p className="text-xs text-red-600 truncate">Tải lên thất bại — {item.message}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => retryFailed(item.id)}
                disabled={disabled}
                className="h-8 shrink-0 border-red-300 text-red-700 hover:bg-red-100"
              >
                Thử lại
              </Button>
              <button
                type="button"
                onClick={() => setFailed((prev) => prev.filter((f) => f.id !== item.id))}
                className="p-1.5 text-red-500 hover:bg-red-100 rounded shrink-0"
                title="Bỏ qua ảnh này"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file, index) => (
            <div
              key={file.url}
              draggable={!disabled}
              onDragStart={() => handleCardDragStart(index)}
              onDragEnter={() => handleCardDragEnter(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                // Chặn nổi bọt lên drop zone tải ảnh, nếu không thả ảnh để sắp xếp
                // sẽ bị hiểu nhầm thành thả file để upload.
                e.preventDefault();
                e.stopPropagation();
                handleCardDrop(index);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setDragOverIndex(null);
              }}
              onClick={() => handleCardClick(index)}
              className={cn(
                'relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer',
                file.isPrimary ? 'border-blue-500' : 'border-gray-200 hover:border-blue-300',
                dragIndex === index && 'opacity-40',
                dragOverIndex === index && dragIndex !== index && 'ring-2 ring-primary ring-offset-1'
              )}
            >
              {/* Tay nắm kéo — gợi ý trực quan là thẻ này kéo được */}
              <div className="absolute top-2 right-2 z-10 p-1 rounded bg-black/45 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <GripVertical className="h-3.5 w-3.5" />
              </div>

              {/* Số thứ tự — cho người dùng thấy rõ vị trí hiện tại khi sắp xếp */}
              <div className="absolute bottom-2 left-2 z-10 h-5 min-w-5 px-1.5 rounded bg-black/55 text-white text-[11px] font-bold flex items-center justify-center">
                {index + 1}
              </div>

              {/* Image */}
              <div className="aspect-square bg-gray-100">
                <img
                  src={file.thumbnail || file.url}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Primary Badge */}
              {file.isPrimary && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded font-medium">
                  Ảnh bìa
                </div>
              )}

              {/* Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {/* Set Primary */}
                {!file.isPrimary && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrimary(index);
                    }}
                    className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                    title="Đặt làm ảnh bìa"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>
                )}

                {/* Remove */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50"
                  title="Xóa ảnh"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      {files.length > 0 && (
        <p className="mt-2 text-sm text-gray-500">
          Nhấp vào ảnh để đặt làm ảnh bìa. Kéo thả ảnh để thay đổi thứ tự hiển thị.
        </p>
      )}
    </div>
  );
}

/**
 * Rút id video từ link YouTube. Nhận cả dạng watch?v=, youtu.be/, /embed/ và /shorts/
 * vì người dùng thường dán bất kỳ dạng nào trong số đó. Trả null nếu không phải YouTube.
 */
export function parseYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

// Video Uploader (similar structure)
interface VideoUploaderProps {
  videos: UploadedFile[];
  onChange: (videos: UploadedFile[]) => void;
  maxVideos?: number;
  maxSize?: number; // in MB
  disabled?: boolean;
  className?: string;
}

export function VideoUploader({
  videos,
  onChange,
  maxVideos = 2,
  maxSize = 100,
  disabled = false,
  className = '',
}: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'youtube' | 'upload'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addYoutube = () => {
    const url = youtubeUrl.trim();
    const id = parseYoutubeId(url);
    if (!id) {
      setError('Link YouTube không hợp lệ. Ví dụ: https://www.youtube.com/watch?v=abc123');
      return;
    }
    if (videos.some((v) => v.url === url)) {
      setError('Video này đã được thêm.');
      return;
    }
    setError(null);
    onChange([
      ...videos,
      {
        url,
        // Ảnh xem trước lấy thẳng từ YouTube, không cần tự sinh.
        thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        name: `Video YouTube (${id})`,
        size: 0,
      },
    ]);
    setYoutubeUrl('');
  };

  const validateFile = (file: File): string | null => {
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      return 'Chỉ chấp nhận file video (MP4, WebM, MOV)';
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `Kích thước video không được vượt quá ${maxSize}MB`;
    }
    return null;
  };

  const handleFiles = useCallback(async (selectedFiles: FileList | File[]) => {
    const newFiles = Array.from(selectedFiles);
    
    if (videos.length + newFiles.length > maxVideos) {
      setError(`Tối đa ${maxVideos} video được phép tải lên`);
      return;
    }

    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        setError(error);
        return;
      }
    }

    setError(null);
    setUploadingCount(prev => prev + newFiles.length);

    const uploadPromises = newFiles.map(async (file): Promise<UploadedFile | null> => {
      try {
        const res = await fileUploadApi.upload(file);
        return { url: res.url, name: file.name, size: file.size };
      } catch (e) {
        toast.error('Upload video thất bại: ' + (e as any).message);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const uploadedVideos: UploadedFile[] = results.filter((v): v is UploadedFile => v !== null);

    setUploadingCount(prev => prev - newFiles.length);
    onChange([...videos, ...uploadedVideos]);
  }, [videos, maxVideos, maxSize, onChange]);

  const removeVideo = (index: number) => {
    const video = videos[index];
    if (video.url.startsWith('blob:')) {
      URL.revokeObjectURL(video.url);
    }
    onChange(videos.filter((_, i) => i !== index));
  };

  const canUpload = videos.length < maxVideos;

  return (
    <div className={className}>
      {/* Spec mục 7.2: người dùng chọn MỘT trong hai cách — tải video lên, hoặc dán link
          YouTube. Link YouTube không tốn dung lượng lưu trữ nên để làm mặc định. */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setMode('youtube')}
          className={cn(
            'px-3.5 h-9 rounded-lg text-sm font-semibold border transition-colors',
            mode === 'youtube'
              ? 'border-primary bg-primary-light text-primary'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          )}
        >
          Link YouTube
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={cn(
            'px-3.5 h-9 rounded-lg text-sm font-semibold border transition-colors',
            mode === 'upload'
              ? 'border-primary bg-primary-light text-primary'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          )}
        >
          Tải video lên
        </button>
      </div>

      {mode === 'youtube' && canUpload && (
        <div className="flex gap-2">
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => { setYoutubeUrl(e.target.value); setError(null); }}
            placeholder="Dán link YouTube, VD: https://www.youtube.com/watch?v=..."
            disabled={disabled}
            className="flex-1 h-11 px-3.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          <Button type="button" onClick={addYoutube} disabled={disabled || !youtubeUrl.trim()} className="h-11">
            Thêm
          </Button>
        </div>
      )}

      {mode === 'upload' && canUpload && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
            isDragging ? 'border-primary bg-primary-light' : 'border-gray-300 hover:border-gray-400',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            multiple
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            disabled={disabled}
            className="hidden"
          />
          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600 font-medium">
            Tải lên video (tối đa {maxVideos})
          </p>
          <p className="text-sm text-gray-400 mt-1">
            MP4, WebM, MOV - Tối đa {maxSize}MB
          </p>
        </div>
      )}

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {videos.length > 0 && (
        <div className="mt-4 space-y-2">
          {videos.map((video, index) => (
            <div key={video.url} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {/* Video YouTube chỉ có link nên dùng ảnh thumbnail của YouTube; video tải
                  lên mới phát được bằng thẻ <video>. */}
              {video.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={video.thumbnail} alt={video.name} className="h-16 w-24 object-cover rounded shrink-0" />
              ) : (
                <video src={video.url} className="h-16 w-24 object-cover rounded shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{video.name}</p>
                <p className="text-xs text-gray-500">
                  {video.size > 0 ? `${(video.size / 1024 / 1024).toFixed(1)} MB` : 'Nhúng từ YouTube'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeVideo(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded"
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
