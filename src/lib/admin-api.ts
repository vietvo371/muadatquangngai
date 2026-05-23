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
  developer?: string;
  province_id?: number;
  district_id?: number;
  ward_id?: number;
  agent_id?: number;
  type?: string;
  status: 'draft' | 'published' | 'archived' | 'upcoming' | 'selling' | 'completed' | 'paused';
  description?: string;
  highlights?: string[];
  total_units?: number;
  total_blocks?: number;
  total_floors?: number;
  total_area?: number;
  min_price?: number;
  max_price?: number;
  price_display?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  cover_image?: string;
  images?: string[];
  legal?: string;
  handover_date?: string;
  construction_progress?: number;
  construction_note?: string;
  utilities?: string[];
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  // Backward compatibility frontend mappings:
  location?: string;
  category?: string;
  investor?: string;
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
  reject_reason?: string;
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
    const { data } = await api.get<{
      success: boolean;
      data: { project: Project; stats: Record<string, unknown> };
      project?: Project;
      stats?: Record<string, unknown>;
    }>(`/api/admin/projects/${id}`);
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
  reject_reason?: string;
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

// Admin Properties & Users Interfaces
export interface AdminProperty {
  id: number;
  title: string;
  slug: string;
  price: number;
  price_unit?: string;
  area: number;
  thumbnail?: string;
  status: string;
  type: string;
  category?: {
    id: number;
    name: string;
  };
  province?: {
    id: number;
    name: string;
  };
  district?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
  };
  created_at: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  role: string;
  status: string;
  email_verified_at?: string | null;
  total_listings?: number;
  ban_reason?: string | null;
  created_at: string;
}

// Dashboard Api
export const dashboardApi = {
  getStats: async () => {
    const { data } = await api.get<{
      success: boolean;
      data: {
        total_users: number;
        total_properties: number;
        active_properties: number;
        pending_properties: number;
        total_revenue: number;
        new_users_today: number;
        new_listings_today: number;
        pending_reports: number;
      };
    }>('/api/admin/dashboard');
    return data;
  },
};

// Properties Admin Api
export const propertyAdminApi = {
  list: async (params?: {
    status?: string;
    type?: string;
    q?: string;
    page?: number;
  }) => {
    const { data } = await api.get<PaginatedResponse<AdminProperty>>('/api/admin/properties', { params });
    return data;
  },

  approve: async (id: number) => {
    const { data } = await api.put<{ success: boolean; message?: string }>(`/api/admin/properties/${id}/approve`);
    return data;
  },

  reject: async (id: number, reason?: string) => {
    const { data } = await api.put<{ success: boolean; message?: string }>(`/api/admin/properties/${id}/reject`, { reason });
    return data;
  },

  delete: async (id: number) => {
    const { data } = await api.delete<{ success: boolean; message?: string }>(`/api/admin/properties/${id}`);
    return data;
  },
};

// Users Admin Api
export const userAdminApi = {
  list: async (params?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
  }) => {
    const { data } = await api.get<PaginatedResponse<AdminUser>>('/api/admin/users', { params });
    return data;
  },

  ban: async (id: number) => {
    const { data } = await api.put<{ success: boolean; message?: string }>(`/api/admin/users/${id}/ban`);
    return data;
  },

  unban: async (id: number) => {
    const { data } = await api.put<{ success: boolean; message?: string }>(`/api/admin/users/${id}/unban`);
    return data;
  },

  updateRole: async (id: number, role: string) => {
    const { data } = await api.put<{ success: boolean; message?: string }>(`/api/admin/users/${id}/role`, { role });
    return data;
  },

  create: async (payload: Partial<AdminUser> & { password?: string }) => {
    const { data } = await api.post<{ success: boolean; data: AdminUser }>('/api/admin/users', payload);
    return data;
  },

  update: async (id: number, payload: Partial<AdminUser>) => {
    const { data } = await api.put<{ success: boolean; data: AdminUser }>(`/api/admin/users/${id}`, payload);
    return data;
  },
};

export interface AdminSetting {
  id: number;
  key: string;
  group: string;
  type: string;
  label: string;
  value: string | null;
  options: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const settingAdminApi = {
  getGrouped: async () => {
    const { data } = await api.get<{
      success: boolean;
      data: Record<string, AdminSetting[]>;
    }>('/api/admin/settings/grouped');
    return data;
  },

  update: async (settings: Record<string, string | null>) => {
    const { data } = await api.put<{
      success: boolean;
      message: string;
      data: Record<string, string | null>;
    }>('/api/admin/settings', { settings });
    return data;
  },
};

export const fileUploadApi = {
  upload: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/api/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
};
