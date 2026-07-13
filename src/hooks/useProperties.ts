import { useState, useCallback } from 'react';
import axios from '@/lib/axios';
import type { Property, PropertyFormData } from '@/types/property';

interface PropertyFilters {
  type?: 'sell' | 'rent';
  // Tên khớp đúng query param mà GET /api/v2/properties đọc (category/province/district — không
  // phải category_id/district_id, xem src/app/api/v2/properties/route.ts).
  category?: number;
  province?: number;
  district?: number;
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  bedrooms?: number;
  direction?: string;
  legal?: string;
  is_vip?: string;
  keyword?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

interface PropertyResponse {
  success: boolean;
  data: Property[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface PropertyDetailResponse {
  success: boolean;
  data: Property;
}

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  // Fetch properties list
  const fetchProperties = useCallback(async (filters: PropertyFilters = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<PropertyResponse>('/api/v2/properties', {
        params: filters,
      });
      
      if (response.data.success) {
        setProperties(response.data.data);
        setPagination(response.data.meta);
        return { success: true, data: response.data.data, meta: response.data.meta };
      }
      
      throw new Error('Failed to fetch properties');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi tải tin đăng';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch single property
  const fetchProperty = useCallback(async (slugOrId: string) => {
    setIsLoading(true);
    setError(null);
    setProperty(null);
    
    try {
      const response = await axios.get<PropertyDetailResponse>(`/api/v2/properties/${slugOrId}`);
      
      if (response.data.success) {
        setProperty(response.data.data);
        return { success: true, data: response.data.data };
      }
      
      throw new Error('Failed to fetch property');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi tải tin đăng';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch featured properties
  const fetchFeatured = useCallback(async (limit = 10) => {
    try {
      const response = await axios.get('/api/v2/properties/featured', {
        params: { limit },
      });
      
      return { success: true, data: response.data.data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  // Fetch nearby properties
  const fetchNearby = useCallback(async (lat: number, lng: number, radius = 5) => {
    try {
      const response = await axios.get('/api/v2/properties/nearby', {
        params: { lat, lng, radius },
      });
      
      return { success: true, data: response.data.data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  // Fetch similar properties
  const fetchSimilar = useCallback(async (propertyId: number, limit = 6) => {
    try {
      const response = await axios.get(`/api/v2/properties/${propertyId}/similar`, {
        params: { limit },
      });
      
      return { success: true, data: response.data.data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  // Create property
  const createProperty = useCallback(async (data: PropertyFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/v2/my/properties', data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      
      throw new Error(response.data.message || 'Tạo tin thất bại');
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const message = err.response?.data?.message || err.message || 'Tạo tin thất bại';
      setError(message);
      return { success: false, error: message, errors };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update property
  const updateProperty = useCallback(async (id: number, data: Partial<PropertyFormData>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(`/api/v2/my/properties/${id}`, data);
      
      if (response.data.success) {
        setProperty(response.data.data);
        return { success: true, data: response.data.data };
      }
      
      throw new Error(response.data.message || 'Cập nhật thất bại');
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const message = err.response?.data?.message || err.message || 'Cập nhật thất bại';
      setError(message);
      return { success: false, error: message, errors };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete property
  const deleteProperty = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/api/v2/my/properties/${id}`);
      
      // Remove from list
      setProperties(prev => prev.filter(p => p.id !== id));
      
      return { success: true };
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Xóa tin thất bại';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Contact property
  const contactProperty = useCallback(async (propertyId: number, data: {
    name: string;
    phone: string;
    email?: string;
    message?: string;
  }) => {
    try {
      const response = await axios.post(`/api/v2/properties/${propertyId}/contact`, data);
      return { success: response.data.success, message: response.data.message };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || 'Gửi liên hệ thất bại' };
    }
  }, []);

  // Save/Unsave property
  const toggleSave = useCallback(async (propertyId: number) => {
    try {
      const response = await axios.post(`/api/v2/my/saved/${propertyId}`);
      return { success: true, saved: response.data.saved };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || 'Lỗi' };
    }
  }, []);

  // Fetch my properties
  const fetchMyProperties = useCallback(async (filters: PropertyFilters = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/v2/my/properties', {
        params: filters,
      });
      
      if (response.data.success) {
        setProperties(response.data.data);
        setPagination(response.data.meta);
        return { success: true, data: response.data.data, meta: response.data.meta };
      }
      
      throw new Error('Failed to fetch properties');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi tải tin đăng';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch saved properties
  const fetchSavedProperties = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/v2/my/saved');
      
      if (response.data.success) {
        setProperties(response.data.data);
        return { success: true, data: response.data.data };
      }
      
      throw new Error('Failed to fetch saved properties');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi tải tin đã lưu';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    properties,
    property,
    isLoading,
    error,
    pagination,
    
    // Actions
    fetchProperties,
    fetchProperty,
    fetchFeatured,
    fetchNearby,
    fetchSimilar,
    createProperty,
    updateProperty,
    deleteProperty,
    contactProperty,
    toggleSave,
    fetchMyProperties,
    fetchSavedProperties,
    
    // Clear
    clearError: () => setError(null),
    clearProperty: () => setProperty(null),
  };
}
