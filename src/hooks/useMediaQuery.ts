'use client';

import { useState, useEffect } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

interface UseMediaQueryOptions {
  ssr?: boolean; // Server-side rendering support
}

/**
 * Hook to check if a media query matches
 */
export function useMediaQuery(
  query: string,
  options: UseMediaQueryOptions = {}
): boolean {
  const { ssr = true } = options;
  const [matches, setMatches] = useState(ssr);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handler);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}

/**
 * Hook to check current breakpoint
 */
export function useBreakpoint(): Breakpoint | null {
  const [breakpoint, setBreakpoint] = useState<Breakpoint | null>(null);

  useEffect(() => {
    const calculateBreakpoint = () => {
      const width = window.innerWidth;

      if (width >= breakpoints['2xl']) {
        setBreakpoint('2xl');
      } else if (width >= breakpoints.xl) {
        setBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setBreakpoint('md');
      } else {
        setBreakpoint('sm');
      }
    };

    // Initial calculation
    calculateBreakpoint();

    // Listen for resize
    window.addEventListener('resize', calculateBreakpoint);

    // Cleanup
    return () => {
      window.removeEventListener('resize', calculateBreakpoint);
    };
  }, []);

  return breakpoint;
}

/**
 * Hook for common device types
 */
export function useDevice() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTouch = useMediaQuery('(pointer: coarse)');
  const isDark = useMediaQuery('(prefers-color-scheme: dark)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    isDark,
    deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
  };
}

/**
 * Hook to check if screen is at least a certain size
 */
export function useMinWidth(minWidth: number): boolean {
  return useMediaQuery(`(min-width: ${minWidth}px)`);
}

/**
 * Hook to check if screen is at most a certain size
 */
export function useMaxWidth(maxWidth: number): boolean {
  return useMediaQuery(`(max-width: ${maxWidth}px)`);
}

/**
 * Hook for sm breakpoint (640px)
 */
export function useSm(): boolean {
  return useMinWidth(breakpoints.sm);
}

/**
 * Hook for md breakpoint (768px)
 */
export function useMd(): boolean {
  return useMinWidth(breakpoints.md);
}

/**
 * Hook for lg breakpoint (1024px)
 */
export function useLg(): boolean {
  return useMinWidth(breakpoints.lg);
}

/**
 * Hook for xl breakpoint (1280px)
 */
export function useXl(): boolean {
  return useMinWidth(breakpoints.xl);
}

/**
 * Hook for 2xl breakpoint (1536px)
 */
export function use2xl(): boolean {
  return useMinWidth(breakpoints['2xl']);
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook for prefers contrast
 */
export function usePrefersContrast(): boolean {
  return useMediaQuery('(prefers-contrast: more)');
}

/**
 * Hook for hover capability
 */
export function useHoverable(): boolean {
  return useMediaQuery('(hover: hover)');
}

/**
 * Hook for orientation
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
    };
  }, []);

  return orientation;
}
