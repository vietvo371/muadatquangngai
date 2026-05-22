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
        toast.error('Upload thất bại: ' + (e as any).message);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const uploadedFiles: UploadedFile[] = results.filter((item): item is UploadedFile => item !== null);

    setUploadingCount(prev => prev - newFiles.length);
    onChange([...files, ...uploadedFiles]);
  }, [files, maxFiles, maxSize, onChange]);

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

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file, index) => (
            <div
              key={file.url}
              onClick={() => setPrimary(index)}
              className={cn(
                'relative group rounded-lg overflow-hidden border-2 transition-colors cursor-pointer',
                file.isPrimary ? 'border-blue-500' : 'border-gray-200 hover:border-blue-300'
              )}
            >
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
          Nhấp vào ảnh để đặt làm ảnh bìa. Ảnh đầu tiên sẽ là ảnh bìa mặc định.
        </p>
      )}
    </div>
  );
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      {canUpload && (
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
              <video src={video.url} className="h-16 w-24 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{video.name}</p>
                <p className="text-xs text-gray-500">{(video.size / 1024 / 1024).toFixed(1)} MB</p>
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
