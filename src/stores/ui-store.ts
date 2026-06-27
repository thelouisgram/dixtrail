import { create } from "zustand";
import { LocationStatus } from "@prisma/client";

interface LocationFilters {
  search: string;
  status: LocationStatus | "";
  countryId: string;
  stateId: string;
  cityId: string;
  assignedRepId: string;
  mineOnly: boolean;
  page: number;
}

interface UserFilters {
  search: string;
  page: number;
}

interface UIState {
  sidebarOpen: boolean;
  locationModalOpen: boolean;
  userModalOpen: boolean;
  userDetailId: string | null;
  assignCitiesUserId: string | null;
  selectedLocationId: string | null;
  locationFilters: LocationFilters;
  userFilters: UserFilters;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setLocationModalOpen: (open: boolean) => void;
  setUserModalOpen: (open: boolean) => void;
  setUserDetailId: (id: string | null) => void;
  setAssignCitiesUserId: (id: string | null) => void;
  setSelectedLocationId: (id: string | null) => void;
  setLocationFilters: (filters: Partial<LocationFilters>) => void;
  resetLocationFilters: () => void;
  setUserFilters: (filters: Partial<UserFilters>) => void;
  resetUserFilters: () => void;
}

const defaultFilters: LocationFilters = {
  search: "",
  status: "",
  countryId: "",
  stateId: "",
  cityId: "",
  assignedRepId: "",
  mineOnly: false,
  page: 1,
};

const defaultUserFilters: UserFilters = {
  search: "",
  page: 1,
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  locationModalOpen: false,
  userModalOpen: false,
  userDetailId: null,
  assignCitiesUserId: null,
  selectedLocationId: null,
  locationFilters: defaultFilters,
  userFilters: defaultUserFilters,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setLocationModalOpen: (open) => set({ locationModalOpen: open }),
  setUserModalOpen: (open) => set({ userModalOpen: open }),
  setUserDetailId: (id) => set({ userDetailId: id }),
  setAssignCitiesUserId: (id) => set({ assignCitiesUserId: id }),
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),
  setLocationFilters: (filters) =>
    set((state) => ({
      locationFilters: { ...state.locationFilters, ...filters },
    })),
  resetLocationFilters: () => set({ locationFilters: defaultFilters }),
  setUserFilters: (filters) =>
    set((state) => ({
      userFilters: { ...state.userFilters, ...filters },
    })),
  resetUserFilters: () => set({ userFilters: defaultUserFilters }),
}));
