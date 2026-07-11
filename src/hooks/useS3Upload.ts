'use client';

import { useState, useCallback, useRef } from 'react';
import axios from '@/lib/axios';

interface UploadedFile {
  id?: number;
  url: string;
  thumbnail?: string;
  name: string;
  size: number;
}

interface UploadOptions {
  folder?: string;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
}

interface UseS3UploadOptions {
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
}

export function useS3Upload(options: UseS3UploadOptions = {}) {
  const {
    maxFiles = 10,
    maxSize = 10 * 1024 * 1024, // 10MB default
    acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  } = options;

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type not accepted. Accepted: ${acceptedTypes.join(', ')}`;
    }
    if (file.size > maxSize) {
      return `File too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB`;
    }
    return null;
  }, [acceptedTypes, maxSize]);

  // Upload single file
  const uploadFile = useCallback(async (file: File, folder = 'uploads'): Promise<UploadedFile | null> => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return null;
    }

    setIsUploading(true);
    setUploadingCount(prev => prev + 1);

    try {
      // Get presigned URL from backend
      const path = `${folder}/${Date.now()}-${file.name}`;
      const presignedResponse = await axios.get('/api/v2/files/presigned-url', {
        params: { path },
      });

      const { url, fields } = presignedResponse.data.data;

      // Upload to S3 using presigned URL
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append('file', file);

      await axios.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Get the final URL
      const finalUrl = presignedResponse.data.data.final_url || url;

      return {
        url: finalUrl,
        name: file.name,
        size: file.size,
      };
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Upload failed');
      return null;
    } finally {
      setIsUploading(false);
      setUploadingCount(prev => prev - 1);
    }
  }, [validateFile]);

  // Upload multiple files
  const uploadFiles = useCallback(async (
    fileList: FileList | File[],
    folder = 'uploads'
  ): Promise<UploadedFile[]> => {
    const newFiles = Array.from(fileList);
    
    if (files.length + newFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return [];
    }

    setIsUploading(true);
    setError(null);

    const uploaded: UploadedFile[] = [];

    for (const file of newFiles) {
      const result = await uploadFile(file, folder);
      if (result) {
        uploaded.push(result);
        setFiles(prev => [...prev, result]);
      }
    }

    setIsUploading(false);
    return uploaded;
  }, [files.length, maxFiles, uploadFile]);

  // Remove file
  const removeFile = useCallback(async (index: number) => {
    const file = files[index];
    if (!file) return;

    // If file has ID, delete from server
    if (file.id) {
      try {
        await axios.delete(`/api/v2/files/${file.id}`);
      } catch (err) {
        // Continue even if server delete fails
      }
    }

    setFiles(prev => prev.filter((_, i) => i !== index));
  }, [files]);

  // Clear all files
  const clearFiles = useCallback(async () => {
    // Delete from server
    for (const file of files) {
      if (file.id) {
        try {
          await axios.delete(`/api/v2/files/${file.id}`);
        } catch (err) {
          // Continue even if server delete fails
        }
      }
    }
    setFiles([]);
  }, [files]);

  // Set files directly (e.g., from API response)
  const setFilesDirect = useCallback((newFiles: UploadedFile[]) => {
    setFiles(newFiles);
  }, []);

  return {
    // State
    files,
    isUploading,
    uploadingCount,
    error,
    canUpload: files.length < maxFiles,
    remainingSlots: maxFiles - files.length,

    // Actions
    uploadFile,
    uploadFiles,
    removeFile,
    clearFiles,
    setFiles: setFilesDirect,

    // Clear
    clearError: () => setError(null),
  };
}

// Hook for getting presigned URL
export function usePresignedUrl() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPresignedUrl = useCallback(async (path: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/v2/files/presigned-url', {
        params: { path },
      });

      return response.data.data.url;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getPresignedUrl,
  };
}
