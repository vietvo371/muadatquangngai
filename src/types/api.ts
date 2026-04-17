/// <reference types="next" />
/// <reference types="next/image-types/global" />
/// <reference types="next/navigation-types/compat/navigation" />

import type { Property, PropertyMedia, PropertyLocation, UserBasic, Feature } from "@/types/property";
import type { User, UserRole, UserStatus } from "@/types/user";
import type { SearchFilters } from "@/types/search";

// Re-export types
export type {
  Property,
  PropertyMedia,
  PropertyLocation,
  UserBasic,
  Feature,
  User,
  UserRole,
  UserStatus,
  SearchFilters,
};

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}
