import { useState, useCallback, useRef } from 'react';
import axios from '@/lib/axios';

interface SearchSuggestion {
  type: 'property' | 'project' | 'location';
  text: string;
  data?: {
    province_id?: number;
    district_id?: number;
    ward_id?: number;
    id?: number;
  };
}

interface SearchFilters {
  type?: 'sale' | 'rent';
  category_id?: number;
  province_id?: number;
  district_id?: number;
  ward_id?: number;
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  bedrooms?: number;
  direction?: string;
  legal?: string;
  is_vip?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

interface SearchResult {
  id: number;
  title: string;
  slug: string;
  price: number;
  price_unit: string;
  area: number;
  thumbnail: string;
  address: string;
  type: string;
  category: {
    id: number;
    name: string;
  };
  province: {
    id: number;
    name: string;
  };
  district: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    name: string;
    avatar: string | null;
    phone: string;
  };
}

interface SearchResponse {
  success: boolean;
  data: SearchResult[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  aggregations?: {
    price: { min: number; max: number; avg: number };
    area: { min: number; max: number; avg: number };
  };
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const [aggregations, setAggregations] = useState<SearchResponse['aggregations'] | null>(null);
  
  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Main search
  const search = useCallback(async (keyword: string, filters: SearchFilters = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<SearchResponse>('/api/v2/search', {
        params: {
          keyword,
          ...filters,
        },
      });
      
      if (response.data.success) {
        setResults(response.data.data);
        setPagination(response.data.meta);
        setAggregations(response.data.aggregations || null);
        return { 
          success: true, 
          data: response.data.data, 
          meta: response.data.meta,
          aggregations: response.data.aggregations,
        };
      }
      
      throw new Error('Search failed');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Tìm kiếm thất bại';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced suggestions
  const fetchSuggestions = useCallback((keyword: string) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear suggestions if keyword too short
    if (keyword.length < 2) {
      setSuggestions([]);
      return;
    }

    // Debounce API call
    debounceTimerRef.current = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      
      try {
        const response = await axios.get('/api/v2/search/suggest', {
          params: { keyword, limit: 10 },
        });
        
        setSuggestions(response.data.data || []);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);
  }, []);

  // Immediate suggestions (no debounce)
  const fetchSuggestionsImmediate = useCallback(async (keyword: string) => {
    if (keyword.length < 2) {
      setSuggestions([]);
      return [];
    }
    
    setIsLoadingSuggestions(true);
    
    try {
      const response = await axios.get('/api/v2/search/suggest', {
        params: { keyword, limit: 10 },
      });
      
      const data = response.data.data || [];
      setSuggestions(data);
      return data;
    } catch (err) {
      setSuggestions([]);
      return [];
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Map search (bounding box)
  const mapSearch = useCallback(async (
    bounds: { north: number; south: number; east: number; west: number },
    filters: SearchFilters = {}
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/v2/search/map', {
        params: {
          north: bounds.north,
          south: bounds.south,
          east: bounds.east,
          west: bounds.west,
          ...filters,
        },
      });
      
      if (response.data.success) {
        setResults(response.data.data);
        return { success: true, data: response.data.data };
      }
      
      throw new Error('Map search failed');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Tìm kiếm thất bại';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get search count by type
  const getCountByType = useCallback(async (filters: Partial<SearchFilters> = {}) => {
    try {
      const response = await axios.get('/api/v2/search/count', { params: filters });
      return { 
        success: true, 
        data: response.data.data || { sale: 0, rent: 0, total: 0 } 
      };
    } catch (err) {
      return { success: false, data: { sale: 0, rent: 0, total: 0 } };
    }
  }, []);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    setResults([]);
    setSuggestions([]);
    setError(null);
    setPagination({
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 0,
    });
    setAggregations(null);
    clearSuggestions();
  }, [clearSuggestions]);

  return {
    // State
    results,
    suggestions,
    isLoading,
    isLoadingSuggestions,
    error,
    pagination,
    aggregations,
    
    // Actions
    search,
    fetchSuggestions,
    fetchSuggestionsImmediate,
    mapSearch,
    getCountByType,
    clearSuggestions,
    clearAll,
    
    // Clear
    clearError: () => setError(null),
  };
}
