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
    const { data } = await api.get<PaginatedResponse<Category>>('/api/v2/admin/categories', { params });
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<Category>(`/api/v2/admin/categories/${id}`);
    return data;
  },

  create: async (payload: Partial<Category>) => {
    const { data } = await api.post<Category>('/api/v2/admin/categories', payload);
    return data;
  },

  update: async (id: number, payload: Partial<Category>) => {
    const { data } = await api.put<Category>(`/api/v2/admin/categories/${id}`, payload);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/v2/admin/categories/${id}`);
  },

  toggle: async (id: number) => {
    const { data } = await api.put<Category>(`/api/v2/admin/categories/${id}/toggle`);
    return data;
  },

  reorder: async (order: number[]) => {
    await api.post('/api/v2/admin/categories/reorder', { order });
  },
};

// Packages
export const packageApi = {
  list: async (params?: { active_only?: boolean; type?: string }) => {
    const { data } = await api.get<{ data: Package[] }>('/api/v2/admin/packages', { params });
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<Package>(`/api/v2/admin/packages/${id}`);
    return data;
  },

  create: async (payload: Partial<Package>) => {
    const { data } = await api.post<Package>('/api/v2/admin/packages', payload);
    return data;
  },

  update: async (id: number, payload: Partial<Package>) => {
    const { data } = await api.put<Package>(`/api/v2/admin/packages/${id}`, payload);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/v2/admin/packages/${id}`);
  },

  toggle: async (id: number) => {
    const { data } = await api.put<Package>(`/api/v2/admin/packages/${id}/toggle`);
    return data;
  },

  stats: async () => {
    const { data } = await api.get('/api/v2/admin/packages/stats');
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
    const { data } = await api.get<PaginatedResponse<Project>>('/api/v2/admin/projects', { params });
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<{
      success: boolean;
      data: { project: Project; stats: Record<string, unknown> };
      project?: Project;
      stats?: Record<string, unknown>;
    }>(`/api/v2/admin/projects/${id}`);
    return data;
  },

  create: async (payload: Partial<Project>) => {
    const { data } = await api.post<Project>('/api/v2/admin/projects', payload);
    return data;
  },

  update: async (id: number, payload: Partial<Project>) => {
    const { data } = await api.put<Project>(`/api/v2/admin/projects/${id}`, payload);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/v2/admin/projects/${id}`);
  },

  publish: async (id: number) => {
    const { data } = await api.put<Project>(`/api/v2/admin/projects/${id}/publish`);
    return data;
  },

  archive: async (id: number) => {
    const { data } = await api.put<Project>(`/api/v2/admin/projects/${id}/archive`);
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
    const { data } = await api.get<PaginatedResponse<Transaction>>('/api/v2/admin/transactions', { params });
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<Transaction>(`/api/v2/admin/transactions/${id}`);
    return data;
  },

  stats: async (params?: { from_date?: string; to_date?: string }) => {
    const { data } = await api.get('/api/v2/admin/transactions/stats', { params });
    return data;
  },

  approve: async (id: number) => {
    const { data } = await api.put<Transaction>(`/api/v2/admin/transactions/${id}/approve`);
    return data;
  },

  reject: async (id: number, reason?: string) => {
    const { data } = await api.put<Transaction>(`/api/v2/admin/transactions/${id}/reject`, { reason });
    return data;
  },

  refund: async (id: number, reason?: string) => {
    const { data } = await api.put<Transaction>(`/api/v2/admin/transactions/${id}/refund`, { reason });
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
      '/api/v2/admin/verifications', { params }
    );
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<{ data: Verification }>(`/api/v2/admin/verifications/${id}`);
    return data;
  },

  approve: async (id: number) => {
    const { data } = await api.put(`/api/v2/admin/verifications/${id}/approve`);
    return data;
  },

  reject: async (id: number, rejection_reason: string) => {
    const { data } = await api.put(`/api/v2/admin/verifications/${id}/reject`, { rejection_reason });
    return data;
  },

  stats: async () => {
    const { data } = await api.get<{ data: VerificationStats }>('/api/v2/admin/verifications/stats');
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
      '/api/v2/admin/banners', { params }
    );
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<{ data: AdminBanner }>(`/api/v2/admin/banners/${id}`);
    return data;
  },

  create: async (payload: Partial<AdminBanner>) => {
    const { data } = await api.post<AdminBanner>('/api/v2/admin/banners', payload);
    return data;
  },

  update: async (id: number, payload: Partial<AdminBanner>) => {
    const { data } = await api.put<AdminBanner>(`/api/v2/admin/banners/${id}`, payload);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/v2/admin/banners/${id}`);
  },

  toggle: async (id: number) => {
    const { data } = await api.put<AdminBanner>(`/api/v2/admin/banners/${id}/toggle`);
    return data;
  },

  reorder: async (order: number[]) => {
    await api.post('/api/v2/admin/banners/reorder', { order });
  },

  stats: async (id: number) => {
    const { data } = await api.get(`/api/v2/admin/banners/${id}/stats`);
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
    }>('/api/v2/admin/dashboard');
    return data;
  },

  /** Tỷ lệ tin đăng theo xã/phường — endpoint riêng để không đổi shape của /admin/dashboard. */
  areaStats: async () => {
    const { data } = await api.get<{
      success: boolean;
      data: { total: number; areas: Array<{ name: string; count: number; percent: number }> };
    }>('/api/v2/admin/dashboard/areas');
    return data;
  },
};

/** Khớp phản hồi GET/POST/PUT /api/v2/admin/agencies. */
export interface AdminAgency {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  business_type: string;
  verified: boolean;
  active: boolean;
  district_id: number | null;
  province_id: number | null;
  agent_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export const agencyAdminApi = {
  list: async () => {
    const { data } = await api.get<{ success: boolean; data: AdminAgency[] }>('/api/v2/admin/agencies');
    return data;
  },

  create: async (payload: Partial<AdminAgency>) => {
    const { data } = await api.post<{ success: boolean; data: AdminAgency; message: string }>(
      '/api/v2/admin/agencies',
      payload
    );
    return data;
  },

  update: async (id: number, payload: Partial<AdminAgency>) => {
    const { data } = await api.put<{ success: boolean; data: AdminAgency; message: string }>(
      `/api/v2/admin/agencies/${id}`,
      payload
    );
    return data;
  },

  delete: async (id: number) => {
    const { data } = await api.delete<{ success: boolean; message: string }>(`/api/v2/admin/agencies/${id}`);
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
    const { data } = await api.get<PaginatedResponse<AdminProperty>>('/api/v2/admin/properties', { params });
    return data;
  },

  approve: async (id: number) => {
    const { data } = await api.put<{ success: boolean; message?: string }>(`/api/v2/admin/properties/${id}/approve`);
    return data;
  },

  reject: async (id: number, reason?: string) => {
    const { data } = await api.put<{ success: boolean; message?: string }>(`/api/v2/admin/properties/${id}/reject`, { reason });
    return data;
  },

  delete: async (id: number) => {
    const { data } = await api.delete<{ success: boolean; message?: string }>(`/api/v2/admin/properties/${id}`);
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
    const { data } = await api.get<PaginatedResponse<AdminUser>>('/api/v2/admin/users', { params });
    return data;
  },

  ban: async (id: number) => {
    const { data } = await api.put<{ success: boolean; message?: string }>(`/api/v2/admin/users/${id}/ban`);
    return data;
  },

  unban: async (id: number) => {
    const { data } = await api.put<{ success: boolean; message?: string }>(`/api/v2/admin/users/${id}/unban`);
    return data;
  },

  updateRole: async (id: number, role: string) => {
    const { data } = await api.put<{ success: boolean; message?: string }>(`/api/v2/admin/users/${id}/role`, { role });
    return data;
  },

  create: async (payload: Partial<AdminUser> & { password?: string }) => {
    const { data } = await api.post<{ success: boolean; data: AdminUser }>('/api/v2/admin/users', payload);
    return data;
  },

  update: async (id: number, payload: Partial<AdminUser>) => {
    const { data } = await api.put<{ success: boolean; data: AdminUser }>(`/api/v2/admin/users/${id}`, payload);
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
    }>('/api/v2/admin/settings/grouped');
    return data;
  },

  update: async (settings: Record<string, string | null>) => {
    const { data } = await api.put<{
      success: boolean;
      message: string;
      data: Record<string, string | null>;
    }>('/api/v2/admin/settings', { settings });
    return data;
  },
};

export const fileUploadApi = {
  /**
   * Upload ảnh THẲNG từ trình duyệt lên Cloudinary bằng unsigned upload preset —
   * không đi qua server nên không dính giới hạn body ~4.5MB / timeout của Vercel
   * serverless. Thay cho POST /api/files/upload (Laravel S3) cũ.
   *
   * Trả về shape { url, thumbnail, public_id, ... } khớp với ImageUploader
   * (đọc res.url). thumbnail dùng transform c_fill,w_400 của Cloudinary.
   */
  upload: async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !preset) {
      throw new Error('Thiếu cấu hình Cloudinary (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / _UPLOAD_PRESET).');
    }

    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', preset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error?.message ?? 'Upload Cloudinary thất bại.');
    }

    const data = await res.json();
    // secure_url dạng https://res.cloudinary.com/<cloud>/image/upload/v.../<public_id>.<ext>
    // Chèn transform c_fill,w_400 vào ngay sau /upload/ để lấy thumbnail.
    const thumbnail: string = data.secure_url.replace('/upload/', '/upload/c_fill,w_400,q_auto/');
    return {
      url: data.secure_url,
      thumbnail,
      public_id: data.public_id,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
      format: data.format,
    };
  },
};
