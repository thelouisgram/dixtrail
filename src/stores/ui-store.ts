import { create } from "zustand";
import {
  LocationStatus,
  VenueType,
  SixClubsRelationship,
  VendingPlacementStatus,
} from "@prisma/client";

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

interface VenueFilters {
  search: string;
  venueType: VenueType | "";
  sixClubsRelationship: SixClubsRelationship | "";
  vendingPlacementStatus: VendingPlacementStatus | "";
  countryId: string;
  stateId: string;
  cityId: string;
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
  editUserId: string | null;
  userDetailId: string | null;
  assignCitiesUserId: string | null;
  selectedLocationId: string | null;
  venueModalOpen: boolean;
  selectedVenueId: string | null;
  locationFilters: LocationFilters;
  venueFilters: VenueFilters;
  userFilters: UserFilters;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setLocationModalOpen: (open: boolean) => void;
  setUserModalOpen: (open: boolean) => void;
  setEditUserId: (id: string | null) => void;
  setUserDetailId: (id: string | null) => void;
  setAssignCitiesUserId: (id: string | null) => void;
  setSelectedLocationId: (id: string | null) => void;
  setVenueModalOpen: (open: boolean) => void;
  setSelectedVenueId: (id: string | null) => void;
  setLocationFilters: (filters: Partial<LocationFilters>) => void;
  resetLocationFilters: () => void;
  setVenueFilters: (filters: Partial<VenueFilters>) => void;
  resetVenueFilters: () => void;
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

const defaultVenueFilters: VenueFilters = {
  search: "",
  venueType: "",
  sixClubsRelationship: "",
  vendingPlacementStatus: "",
  countryId: "",
  stateId: "",
  cityId: "",
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
  editUserId: null,
  userDetailId: null,
  assignCitiesUserId: null,
  selectedLocationId: null,
  venueModalOpen: false,
  selectedVenueId: null,
  locationFilters: defaultFilters,
  venueFilters: defaultVenueFilters,
  userFilters: defaultUserFilters,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setLocationModalOpen: (open) => set({ locationModalOpen: open }),
  setUserModalOpen: (open) => set({ userModalOpen: open }),
  setEditUserId: (id) => set({ editUserId: id }),
  setUserDetailId: (id) => set({ userDetailId: id }),
  setAssignCitiesUserId: (id) => set({ assignCitiesUserId: id }),
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),
  setVenueModalOpen: (open) => set({ venueModalOpen: open }),
  setSelectedVenueId: (id) => set({ selectedVenueId: id }),
  setLocationFilters: (filters) =>
    set((state) => ({
      locationFilters: { ...state.locationFilters, ...filters },
    })),
  resetLocationFilters: () => set({ locationFilters: defaultFilters }),
  setVenueFilters: (filters) =>
    set((state) => ({
      venueFilters: { ...state.venueFilters, ...filters },
    })),
  resetVenueFilters: () => set({ venueFilters: defaultVenueFilters }),
  setUserFilters: (filters) =>
    set((state) => ({
      userFilters: { ...state.userFilters, ...filters },
    })),
  resetUserFilters: () => set({ userFilters: defaultUserFilters }),
}));
