import api from './axios';

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  thumbnail?: string;
  category_id: number;
  category?: PostCategory;
  user_id: number;
  author?: PostAuthor;
  status: 'draft' | 'published';
  view_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export interface PostCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  post_count?: number;
}

export interface PostAuthor {
  id: number;
  name: string;
  avatar?: string;
  bio?: string;
  role?: string;
}

export interface PostComment {
  id: number;
  content: string;
  user_id: number;
  user: { name: string; avatar?: string };
  created_at: string;
  replies?: PostComment[];
}

export interface PostPaginatedResponse {
  data: Post[];
  links: {
    first: string; last: string; prev: string | null; next: string | null;
  };
  meta: {
    current_page: number; from: number; last_page: number;
    per_page: number; to: number; total: number;
  };
}

export const postApi = {
  list: async (params?: {
    category?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }) => {
    const { data } = await api.get<PostPaginatedResponse>('/api/v2/posts', { params });
    return data;
  },

  featured: async () => {
    const { data } = await api.get<{ data: Post[] }>('/api/v2/posts/featured');
    return data;
  },

  get: async (slug: string) => {
    const { data } = await api.get<{ data: Post }>(`/api/v2/posts/${slug}`);
    return data;
  },

  related: async (id: number, params?: { limit?: number }) => {
    const { data } = await api.get<{ data: Post[] }>(`/api/v2/posts/${id}/related`, { params });
    return data;
  },

  categories: async () => {
    const { data } = await api.get<{ data: PostCategory[] }>('/api/v2/post-categories');
    return data;
  },

  create: async (payload: Partial<Post>) => {
    const { data } = await api.post<Post>('/api/v2/posts', payload);
    return data;
  },

  update: async (id: number, payload: Partial<Post>) => {
    const { data } = await api.put<Post>(`/api/v2/posts/${id}`, payload);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/v2/posts/${id}`);
  },
};

// Banner API
export interface Banner {
  id: number;
  title: string;
  slug: string;
  image: string;
  url?: string;
  position: 'homepage_hero' | 'homepage_mid' | 'listing_top' | 'sidebar';
  is_active: boolean;
  click_count: number;
  view_count: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export const bannerApi = {
  list: async (params?: { position?: string; active_only?: boolean }) => {
    const { data } = await api.get<{ data: Banner[] }>('/api/v2/banners', { params });
    return data;
  },

  trackClick: async (slug: string) => {
    await api.post(`/api/v2/banners/${slug}/click`);
  },

  trackView: async (slug: string) => {
    await api.post(`/api/v2/banners/${slug}/view`);
  },
};
