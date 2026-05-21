import api from './axios';

// Types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent_id?: number;
  sort_order: number;
  is_active: boolean;
  children?: Category[];
  parent?: Category;
}

export interface Package {
  id: number;
  name: string;
  type: 'vip' | 'vip_plus' | 'diamond';
  price: number;
  duration_days: number;
  highlight_color?: string;
  features?: string[];
  sort_order: number;
  is_active: boolean;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  developer_id?: number;
  province_id: number;
  district_id?: number;
  type?: string;
  status: 'draft' | 'published' | 'archived';
  description?: string;
  highlights?: string[];
  total_units?: number;
  min_price?: number;
  max_price?: number;
  price_display?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  cover_image?: string;
  published_at?: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  type: string;
  method: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  description?: string;
  transaction_id?: string;
  payment_method?: string;
  user?: { id: number; name: string; email: string };
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

// Categories
export const categoryApi = {
  list: async (params?: { active_only?: boolean; parent_only?: boolean }) => {
    const { data } = await api.get<PaginatedResponse<Category>>('/api/admin/categories', { params });
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<Category>(`/api/admin/categories/${id}`);
    return data;
  },

  create: async (payload: Partial<Category>) => {
    const { data } = await api.post<Category>('/api/admin/categories', payload);
    return data;
  },

  update: async (id: number, payload: Partial<Category>) => {
    const { data } = await api.put<Category>(`/api/admin/categories/${id}`, payload);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/admin/categories/${id}`);
  },

  toggle: async (id: number) => {
    const { data } = await api.put<Category>(`/api/admin/categories/${id}/toggle`);
    return data;
  },

  reorder: async (order: number[]) => {
    await api.post('/api/admin/categories/reorder', { order });
  },
};

// Packages
export const packageApi = {
  list: async (params?: { active_only?: boolean; type?: string }) => {
    const { data } = await api.get<{ data: Package[] }>('/api/admin/packages', { params });
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<Package>(`/api/admin/packages/${id}`);
    return data;
  },

  create: async (payload: Partial<Package>) => {
    const { data } = await api.post<Package>('/api/admin/packages', payload);
    return data;
  },

  update: async (id: number, payload: Partial<Package>) => {
    const { data } = await api.put<Package>(`/api/admin/packages/${id}`, payload);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/admin/packages/${id}`);
  },

  toggle: async (id: number) => {
    const { data } = await api.put<Package>(`/api/admin/packages/${id}/toggle`);
    return data;
  },

  stats: async () => {
    const { data } = await api.get('/api/admin/packages/stats');
    return data;
  },
};

// Projects
export const projectApi = {
  list: async (params?: {
    status?: string;
    province_id?: number;
    search?: string;
    page?: number;
  }) => {
    const { data } = await api.get<PaginatedResponse<Project>>('/api/admin/projects', { params });
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<{ project: Project; stats: Record<string, unknown> }>(`/api/admin/projects/${id}`);
    return data;
  },

  create: async (payload: Partial<Project>) => {
    const { data } = await api.post<Project>('/api/admin/projects', payload);
    return data;
  },

  update: async (id: number, payload: Partial<Project>) => {
    const { data } = await api.put<Project>(`/api/admin/projects/${id}`, payload);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/admin/projects/${id}`);
  },

  publish: async (id: number) => {
    const { data } = await api.put<Project>(`/api/admin/projects/${id}/publish`);
    return data;
  },

  archive: async (id: number) => {
    const { data } = await api.put<Project>(`/api/admin/projects/${id}/archive`);
    return data;
  },
};

// Transactions
export const transactionApi = {
  list: async (params?: {
    status?: string;
    type?: string;
    method?: string;
    user_id?: number;
    from_date?: string;
    to_date?: string;
    page?: number;
  }) => {
    const { data } = await api.get<PaginatedResponse<Transaction>>('/api/admin/transactions', { params });
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<Transaction>(`/api/admin/transactions/${id}`);
    return data;
  },

  stats: async (params?: { from_date?: string; to_date?: string }) => {
    const { data } = await api.get('/api/admin/transactions/stats', { params });
    return data;
  },

  approve: async (id: number) => {
    const { data } = await api.put<Transaction>(`/api/admin/transactions/${id}/approve`);
    return data;
  },

  reject: async (id: number, reason?: string) => {
    const { data } = await api.put<Transaction>(`/api/admin/transactions/${id}/reject`, { reason });
    return data;
  },

  refund: async (id: number, reason?: string) => {
    const { data } = await api.put<Transaction>(`/api/admin/transactions/${id}/refund`, { reason });
    return data;
  },
};

// Verifications
export interface Verification {
  id: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    role: string;
  };
  type: 'agent' | 'agency';
  status: 'pending' | 'approved' | 'rejected';
  license_number?: string;
  agency_name?: string;
  documents?: string[];
  verified_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  admin?: { id: number; name: string };
  created_at: string;
}

export interface VerificationStats {
  pending: number;
  approved: number;
  rejected: number;
}

export const verificationApi = {
  list: async (params?: { type?: string; page?: number; per_page?: number }) => {
    const { data } = await api.get<{ data: Verification[]; meta: Record<string, number> }>(
      '/api/admin/verifications', { params }
    );
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<{ data: Verification }>(`/api/admin/verifications/${id}`);
    return data;
  },

  approve: async (id: number) => {
    const { data } = await api.put(`/api/admin/verifications/${id}/approve`);
    return data;
  },

  reject: async (id: number, rejection_reason: string) => {
    const { data } = await api.put(`/api/admin/verifications/${id}/reject`, { rejection_reason });
    return data;
  },

  stats: async () => {
    const { data } = await api.get<{ data: VerificationStats }>('/api/admin/verifications/stats');
    return data;
  },
};

// Banners (admin)
export interface AdminBanner {
  id: number;
  title: string;
  slug: string;
  image: string;
  url?: string;
  position: string;
  is_active: boolean;
  click_count: number;
  view_count: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export const bannerAdminApi = {
  list: async (params?: { position?: string; page?: number }) => {
    const { data } = await api.get<{ data: AdminBanner[]; meta: Record<string, number> }>(
      '/api/admin/banners', { params }
    );
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<{ data: AdminBanner }>(`/api/admin/banners/${id}`);
    return data;
  },

  create: async (payload: Partial<AdminBanner>) => {
    const { data } = await api.post<AdminBanner>('/api/admin/banners', payload);
    return data;
  },

  update: async (id: number, payload: Partial<AdminBanner>) => {
    const { data } = await api.put<AdminBanner>(`/api/admin/banners/${id}`, payload);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/admin/banners/${id}`);
  },

  toggle: async (id: number) => {
    const { data } = await api.put<AdminBanner>(`/api/admin/banners/${id}/toggle`);
    return data;
  },

  reorder: async (order: number[]) => {
    await api.post('/api/admin/banners/reorder', { order });
  },

  stats: async (id: number) => {
    const { data } = await api.get(`/api/admin/banners/${id}/stats`);
    return data;
  },
};
