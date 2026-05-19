'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterTag {
  id: string;
  label: string;
}

interface FilterTagsProps {
  tags: FilterTag[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function FilterTags({ tags, onRemove, onClearAll, className }: FilterTagsProps) {
  if (tags.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => onRemove(tag.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-light text-primary text-sm font-medium hover:bg-primary/20 transition-colors group"
        >
          <span>{tag.label}</span>
          <X className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
        </button>
      ))}
      {tags.length > 1 && (
        <button
          onClick={onClearAll}
          className="px-3 py-1.5 rounded-full text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Xóa tất cả
        </button>
      )}
    </div>
  );
}
