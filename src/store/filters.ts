import { create } from 'zustand';
import type { PaceCategory, Difficulty } from '@/types';

interface FiltersState {
  // Location
  latitude: number | null;
  longitude: number | null;
  radiusKm: number;

  // Ride attributes
  paceCategories: PaceCategory[];
  difficulties: Difficulty[];
  minDistanceKm: number | null;
  maxDistanceKm: number | null;

  // Date range
  startDate: Date | null;
  endDate: Date | null;

  // Other
  organizerId: string | null;
  searchQuery: string;

  // Actions
  setLocation: (lat: number, lng: number) => void;
  setRadius: (km: number) => void;
  setPaceCategories: (categories: PaceCategory[]) => void;
  setDifficulties: (difficulties: Difficulty[]) => void;
  setDistanceRange: (min: number | null, max: number | null) => void;
  setDateRange: (start: Date | null, end: Date | null) => void;
  setOrganizerId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

const initialState = {
  latitude: null,
  longitude: null,
  radiusKm: 50,
  paceCategories: [] as PaceCategory[],
  difficulties: [] as Difficulty[],
  minDistanceKm: null,
  maxDistanceKm: null,
  startDate: null,
  endDate: null,
  organizerId: null,
  searchQuery: '',
};

export const useFiltersStore = create<FiltersState>((set) => ({
  ...initialState,

  setLocation: (latitude, longitude) => set({ latitude, longitude }),

  setRadius: (radiusKm) => set({ radiusKm }),

  setPaceCategories: (paceCategories) => set({ paceCategories }),

  setDifficulties: (difficulties) => set({ difficulties }),

  setDistanceRange: (minDistanceKm, maxDistanceKm) =>
    set({ minDistanceKm, maxDistanceKm }),

  setDateRange: (startDate, endDate) => set({ startDate, endDate }),

  setOrganizerId: (organizerId) => set({ organizerId }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  reset: () => set(initialState),
}));
