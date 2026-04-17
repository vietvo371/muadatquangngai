"use client";

import { create } from "zustand";
import type { SearchFilters, PropertyType } from "@/types/property";

interface SearchState {
  filters: SearchFilters;
  isFilterOpen: boolean;
  setFilter: (key: keyof SearchFilters, value: SearchFilters[keyof SearchFilters]) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  setType: (type: PropertyType | undefined) => void;
  toggleFilterOpen: () => void;
  setFilterOpen: (open: boolean) => void;
}

const defaultFilters: SearchFilters = {
  type: undefined,
  sort: "newest",
  per_page: 20,
  page: 1,
};

export const useSearchStore = create<SearchState>((set) => ({
  filters: defaultFilters,
  isFilterOpen: false,

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value, page: 1 },
    })),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters, page: 1 },
    })),

  resetFilters: () => set({ filters: defaultFilters }),

  setType: (type) =>
    set((state) => ({
      filters: { ...defaultFilters, type },
    })),

  toggleFilterOpen: () =>
    set((state) => ({ isFilterOpen: !state.isFilterOpen })),

  setFilterOpen: (open) => set({ isFilterOpen: open }),
}));
