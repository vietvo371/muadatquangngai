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
    const { data } = await api.get<PaginatedResponse<Category>>('/admin/categories', { params });
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<Category>(`/admin/categories/${id}`);
    return data;
  },

  create: async (payload: Partial<Category>) => {
    const { data } = await api.post<Category>('/admin/categories', payload);
    return data;
  },

  update: async (id: number, payload: Partial<Category>) => {
    const { data } = await api.put<Category>(`/admin/categories/${id}`, payload);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/admin/categories/${id}`);
  },

  toggle: async (id: number) => {
    const { data } = await api.put<Category>(`/admin/categories/${id}/toggle`);
    return data;
  },

  reorder: async (order: number[]) => {
    await api.post('/admin/categories/reorder', { order });
  },
};

// Packages
export const packageApi = {
  list: async (params?: { active_only?: boolean; type?: string }) => {
    const { data } = await api.get<{ data: Package[] }>('/admin/packages', { params });
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<Package>(`/admin/packages/${id}`);
    return data;
  },

  create: async (payload: Partial<Package>) => {
    const { data } = await api.post<Package>('/admin/packages', payload);
    return data;
  },

  update: async (id: number, payload: Partial<Package>) => {
    const { data } = await api.put<Package>(`/admin/packages/${id}`, payload);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/admin/packages/${id}`);
  },

  toggle: async (id: number) => {
    const { data } = await api.put<Package>(`/admin/packages/${id}/toggle`);
    return data;
  },

  stats: async () => {
    const { data } = await api.get('/admin/packages/stats');
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
    const { data } = await api.get<PaginatedResponse<Project>>('/admin/projects', { params });
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<{ project: Project; stats: Record<string, unknown> }>(`/admin/projects/${id}`);
    return data;
  },

  create: async (payload: Partial<Project>) => {
    const { data } = await api.post<Project>('/admin/projects', payload);
    return data;
  },

  update: async (id: number, payload: Partial<Project>) => {
    const { data } = await api.put<Project>(`/admin/projects/${id}`, payload);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/admin/projects/${id}`);
  },

  publish: async (id: number) => {
    const { data } = await api.put<Project>(`/admin/projects/${id}/publish`);
    return data;
  },

  archive: async (id: number) => {
    const { data } = await api.put<Project>(`/admin/projects/${id}/archive`);
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
    const { data } = await api.get<PaginatedResponse<Transaction>>('/admin/transactions', { params });
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<Transaction>(`/admin/transactions/${id}`);
    return data;
  },

  stats: async (params?: { from_date?: string; to_date?: string }) => {
    const { data } = await api.get('/admin/transactions/stats', { params });
    return data;
  },

  approve: async (id: number) => {
    const { data } = await api.put<Transaction>(`/admin/transactions/${id}/approve`);
    return data;
  },

  reject: async (id: number, reason?: string) => {
    const { data } = await api.put<Transaction>(`/admin/transactions/${id}/reject`, { reason });
    return data;
  },

  refund: async (id: number, reason?: string) => {
    const { data } = await api.put<Transaction>(`/admin/transactions/${id}/refund`, { reason });
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
      '/admin/verifications', { params }
    );
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<{ data: Verification }>(`/admin/verifications/${id}`);
    return data;
  },

  approve: async (id: number) => {
    const { data } = await api.put(`/admin/verifications/${id}/approve`);
    return data;
  },

  reject: async (id: number, rejection_reason: string) => {
    const { data } = await api.put(`/admin/verifications/${id}/reject`, { rejection_reason });
    return data;
  },

  stats: async () => {
    const { data } = await api.get<{ data: VerificationStats }>('/admin/verifications/stats');
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
      '/admin/banners', { params }
    );
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<{ data: AdminBanner }>(`/admin/banners/${id}`);
    return data;
  },

  create: async (payload: Partial<AdminBanner>) => {
    const { data } = await api.post<AdminBanner>('/admin/banners', payload);
    return data;
  },

  update: async (id: number, payload: Partial<AdminBanner>) => {
    const { data } = await api.put<AdminBanner>(`/admin/banners/${id}`, payload);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/admin/banners/${id}`);
  },

  toggle: async (id: number) => {
    const { data } = await api.put<AdminBanner>(`/admin/banners/${id}/toggle`);
    return data;
  },

  reorder: async (order: number[]) => {
    await api.post('/admin/banners/reorder', { order });
  },

  stats: async (id: number) => {
    const { data } = await api.get(`/admin/banners/${id}/stats`);
    return data;
  },
};
