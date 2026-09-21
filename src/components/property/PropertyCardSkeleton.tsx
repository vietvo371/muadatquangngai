import { Skeleton } from '@/components/ui/skeleton';

interface PropertyCardSkeletonProps {
  variant?: 'grid' | 'list' | 'horizontal';
  className?: string;
}

export function PropertyCardSkeleton({ variant = 'grid', className }: PropertyCardSkeletonProps) {
  if (variant === 'horizontal') {
    return (
      <div className={`flex flex-col sm:flex-row overflow-hidden rounded-2xl border bg-white ${className || ''}`}>
        <div className="w-full sm:w-[42%] md:w-[320px] lg:w-[300px] xl:w-[340px] shrink-0 grid gap-1">
          <Skeleton className="aspect-[4/3] sm:aspect-auto sm:min-h-[180px] rounded-none" />
          <div className="grid grid-cols-2 gap-1">
            <Skeleton className="h-[72px] rounded-none" />
            <Skeleton className="h-[72px] rounded-none" />
          </div>
        </div>
        <div className="flex-1 space-y-3 p-5">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }
  if (variant === 'list') {
    return (
      <div className={`flex gap-4 p-4 bg-white rounded-xl border ${className || ''}`}>
        <Skeleton className="w-32 h-20 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${className || ''}`}>
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-4 pt-2 border-t">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

export function PropertyListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PropertyDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Gallery */}
      <div className="grid grid-cols-4 gap-2">
        <Skeleton className="col-span-4 md:col-span-2 aspect-video rounded-xl" />
        <Skeleton className="hidden md:block aspect-video rounded-xl" />
        <Skeleton className="hidden md:block aspect-video rounded-xl" />
      </div>

      {/* Info */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <div className="flex gap-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
