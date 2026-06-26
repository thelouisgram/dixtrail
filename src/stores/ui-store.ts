import { create } from "zustand";
import { LocationStatus } from "@prisma/client";

interface LocationFilters {
  search: string;
  status: LocationStatus | "";
  countryId: string;
  stateId: string;
  assignedRepId: string;
  page: number;
}

interface UIState {
  sidebarOpen: boolean;
  locationModalOpen: boolean;
  userModalOpen: boolean;
  selectedLocationId: string | null;
  locationFilters: LocationFilters;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setLocationModalOpen: (open: boolean) => void;
  setUserModalOpen: (open: boolean) => void;
  setSelectedLocationId: (id: string | null) => void;
  setLocationFilters: (filters: Partial<LocationFilters>) => void;
  resetLocationFilters: () => void;
}

const defaultFilters: LocationFilters = {
  search: "",
  status: "",
  countryId: "",
  stateId: "",
  assignedRepId: "",
  page: 1,
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  locationModalOpen: false,
  userModalOpen: false,
  selectedLocationId: null,
  locationFilters: defaultFilters,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setLocationModalOpen: (open) => set({ locationModalOpen: open }),
  setUserModalOpen: (open) => set({ userModalOpen: open }),
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),
  setLocationFilters: (filters) =>
    set((state) => ({
      locationFilters: { ...state.locationFilters, ...filters },
    })),
  resetLocationFilters: () => set({ locationFilters: defaultFilters }),
}));
