/// <reference types="next" />
/// <reference types="next/image-types/global" />
/// <reference types="next/navigation-types/compat/navigation" />

import type { Property, PropertyMedia, PropertyLocation, Feature, SearchFilters } from "@/types/property";
import type { User, UserRole, UserStatus, UserBasic } from "@/types/user";

// Re-export types
export type {
  Property,
  PropertyMedia,
  PropertyLocation,
  Feature,
  User,
  UserRole,
  UserStatus,
  UserBasic,
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
