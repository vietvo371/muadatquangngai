import { useState, useCallback } from 'react';
import axios from '@/lib/axios';

export interface ProjectFilters {
  province?: number;
  type?: string;
  page?: number;
  per_page?: number;
}

export interface Project {
  id: number;
  uuid: string;
  slug: string;
  name: string;
  developer: string;
  description: string;
  thumbnail: string;
  status: 'upcoming' | 'selling' | 'completed' | 'paused';
  type: 'apartment' | 'villa' | 'townhouse' | 'commercial' | 'land';
  location: {
    province?: { id: number; name: string };
    district?: { id: number; name: string };
    address: string;
  };
  scale: {
    total_area: number | null;
    total_units: number | null;
    total_blocks: number | null;
    total_floors: number | null;
  };
  price: {
    from: number | null;
    to: number | null;
  };
  legal: string | null;
  handover_date: string | null;
  construction_progress: number | null;
  utilities: string[];
  view_count: number;
  owner?: {
    id: number;
    name: string;
    avatar: string | null;
  };
  created_at: string;
}

interface ProjectResponse {
  success: boolean;
  data: Project[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface ProjectDetailResponse {
  success: boolean;
  data: Project;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  // Fetch projects list
  const fetchProjects = useCallback(async (filters: ProjectFilters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<ProjectResponse>('/api/projects', {
        params: filters,
      });

      if (response.data.success) {
        setProjects(response.data.data);
        setPagination(response.data.meta);
        return { success: true, data: response.data.data, meta: response.data.meta };
      }
      throw new Error('Failed to fetch projects');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi tải danh sách dự án';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch single project detail
  const fetchProjectDetail = useCallback(async (slug: string) => {
    setIsLoading(true);
    setError(null);
    setProject(null);
    try {
      const response = await axios.get<ProjectDetailResponse>(`/api/projects/${slug}`);
      if (response.data.success) {
        setProject(response.data.data);
        return { success: true, data: response.data.data };
      }
      throw new Error('Failed to fetch project detail');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi tải chi tiết dự án';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch properties/units inside a project
  const fetchProjectUnits = useCallback(async (projectId: number, page = 1) => {
    try {
      const response = await axios.get(`/api/projects/${projectId}/units`, {
        params: { page, per_page: 6 },
      });
      return { success: true, data: response.data.data, meta: response.data.meta };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi khi tải danh sách mở bán' };
    }
  }, []);

  return {
    projects,
    project,
    isLoading,
    error,
    pagination,
    fetchProjects,
    fetchProjectDetail,
    fetchProjectUnits,
    clearError: () => setError(null),
    clearProject: () => setProject(null),
  };
}
