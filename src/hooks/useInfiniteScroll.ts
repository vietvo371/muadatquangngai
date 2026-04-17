import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number) => Promise<{ data: T[]; hasMore: boolean }>;
  initialPage?: number;
  threshold?: number; // Intersection observer threshold
}

interface UseInfiniteScrollReturn<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  reset: () => void;
  observerRef: (node: HTMLDivElement | null) => void;
}

export function useInfiniteScroll<T>({
  fetchFn,
  initialPage = 1,
  threshold = 0.1,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Initial fetch
  useEffect(() => {
    const loadInitial = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchFn(initialPage);
        setItems(result.data);
        setHasMore(result.hasMore);
        setPage(initialPage + 1);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    };

    loadInitial();
  }, [fetchFn, initialPage]);

  // Load more
  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    try {
      const result = await fetchFn(page);
      setItems(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load more');
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchFn, page, isLoading, isLoadingMore, hasMore]);

  // Refresh
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPage(initialPage);

    try {
      const result = await fetchFn(initialPage);
      setItems(result.data);
      setHasMore(result.hasMore);
      setPage(initialPage + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, initialPage]);

  // Reset
  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    setIsInitialLoad(true);
  }, [initialPage]);

  // Intersection observer callback
  const setObserverRef = useCallback((node: HTMLDivElement | null) => {
    if (loadMoreRef.current) {
      observerRef.current?.disconnect();
    }

    loadMoreRef.current = node;

    if (node && observerRef.current === null) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
            loadMore();
          }
        },
        { threshold }
      );

      observerRef.current.observe(node);
    }
  }, [hasMore, isLoading, isLoadingMore, loadMore, threshold]);

  // Cleanup observer
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    reset,
    observerRef: setObserverRef,
  };
}

// Simple version without observer
export function useInfiniteScrollSimple<T>(
  fetchFn: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  initialPage = 1
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInitial = async () => {
    setIsLoading(true);
    try {
      const result = await fetchFn(initialPage);
      setItems(result.data);
      setHasMore(result.hasMore);
      setPage(initialPage + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const result = await fetchFn(page);
      setItems(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  return { items, isLoading, hasMore, error, loadMore };
}
