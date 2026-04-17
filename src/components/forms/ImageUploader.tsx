'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Camera, X, GripVertical, Image as ImageIcon, Upload } from 'lucide-react';

interface UploadedImage {
  id: string;
  url: string;
  is_primary?: boolean;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

export function ImageUploader({
  images,
  onChange,
  maxImages = 20,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith('image/'));

      // In real app, upload to S3 here
      const newImages = imageFiles.slice(0, maxImages - images.length).map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
      }));

      onChange([...images, ...newImages]);
    },
    [images, maxImages, onChange]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    const newImages = imageFiles.slice(0, maxImages - images.length).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
    }));

    onChange([...images, ...newImages]);
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    onChange(images.filter((img) => img.id !== id));
  };

  const setPrimary = (id: string) => {
    onChange(
      images.map((img) => ({
        ...img,
        is_primary: img.id === id,
      }))
    );
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 mb-2">
          Kéo thả hình ảnh vào đây hoặc
        </p>
        <label>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button variant="outline" asChild className="cursor-pointer">
            <span>Chọn tệp</span>
          </Button>
        </label>
        <p className="text-xs text-gray-400 mt-2">
          Tối đa {maxImages} ảnh, định dạng JPG, PNG
        </p>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`
                relative aspect-square rounded-lg overflow-hidden group
                ${image.is_primary ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <img
                src={image.url}
                alt=""
                className="w-full h-full object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={() => setPreviewImage(image)}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8"
                  onClick={() => removeImage(image.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Primary Badge */}
              {image.is_primary ? (
                <Badge className="absolute top-2 left-2 bg-blue-500">Đại diện</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 h-6 text-xs opacity-0 group-hover:opacity-100"
                  onClick={() => setPrimary(image.id)}
                >
                  Đặt làm đại diện
                </Button>
              )}

              {/* Drag Handle */}
              <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100">
                <GripVertical className="h-4 w-4 text-white" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Hình ảnh</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage.url}
              alt=""
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
