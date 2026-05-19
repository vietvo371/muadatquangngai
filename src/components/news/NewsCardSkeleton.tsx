import { Skeleton } from '@/components/ui/skeleton';

interface NewsCardSkeletonProps {
  featured?: boolean;
}

export function NewsCardSkeleton({ featured = false }: NewsCardSkeletonProps) {
  if (featured) {
    return (
      <div className="grid md:grid-cols-10 gap-0 rounded-2xl overflow-hidden bg-white border border-gray-100">
        <Skeleton className="h-[240px] sm:h-[320px] md:h-[400px] md:col-span-6 rounded-none" />
        <div className="p-6 md:p-8 md:col-span-4 flex flex-col justify-center space-y-4">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex justify-between pt-4 border-t border-gray-100">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
      <Skeleton className="h-48 sm:h-52 w-full rounded-none" />
      <div className="p-5 flex flex-col flex-1 space-y-3">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between pt-3 border-t border-gray-100 mt-auto">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function NewsListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <NewsCardSkeleton key={i} />
      ))}
    </div>
  );
}
