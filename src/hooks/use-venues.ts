"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateVenueInput, UpdateVenueInput } from "@/lib/validations";
import { useUIStore } from "@/stores/ui-store";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { SEARCH_DEBOUNCE_MS } from "@/lib/query-config";
import { VendingPlacementStatus } from "@prisma/client";
import type { Venue, VenuesPage } from "@/types";

function isVenuesPage(data: unknown): data is VenuesPage {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as VenuesPage).venues) &&
    typeof (data as VenuesPage).pagination === "object"
  );
}

function buildVenueParams(filters: ReturnType<typeof useUIStore.getState>["venueFilters"]) {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  if (filters.search) params.set("search", filters.search);
  if (filters.venueType) params.set("venueType", filters.venueType);
  if (filters.sixClubsRelationship) params.set("sixClubsRelationship", filters.sixClubsRelationship);
  if (filters.vendingPlacementStatus) params.set("vendingPlacementStatus", filters.vendingPlacementStatus);
  if (filters.countryId) params.set("countryId", filters.countryId);
  if (filters.stateId) params.set("stateId", filters.stateId);
  if (filters.cityId) params.set("cityId", filters.cityId);
  return params.toString();
}

function updateVenueInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  updater: (venue: Venue) => Venue
) {
  queryClient.setQueriesData<VenuesPage>({ queryKey: ["venues"] }, (old) => {
    if (!isVenuesPage(old)) return old;
    return {
      ...old,
      venues: old.venues.map((venue) => (venue.id === id ? updater(venue) : venue)),
    };
  });
}

export function useVenues() {
  const filters = useUIStore((s) => s.venueFilters);
  const debouncedSearch = useDebouncedValue(filters.search, SEARCH_DEBOUNCE_MS);
  const queryFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch]
  );

  return useQuery({
    queryKey: ["venues", queryFilters],
    queryFn: async () => {
      const res = await fetch(`/api/venues?${buildVenueParams(queryFilters)}`);
      if (!res.ok) throw new Error("Failed to fetch venues");
      return res.json() as Promise<VenuesPage>;
    },
  });
}

export function useSearchVenues(query: string) {
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);

  return useQuery({
    queryKey: ["venue-search", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/venues/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error("Failed to search venues");
      return res.json() as Promise<Venue[]>;
    },
    enabled: debouncedQuery.length >= 2,
  });
}

export function useCreateVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateVenueInput) => {
      const res = await fetch("/api/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create venue");
      return json as Venue;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
  });
}

export function useUpdateVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateVenueInput }) => {
      const res = await fetch(`/api/venues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update venue");
      return json as Venue;
    },
    onSuccess: (updated) => {
      updateVenueInCache(queryClient, updated.id, () => updated);
      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
  });
}

export function useUpdateVenuePlacementStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      vendingPlacementStatus,
    }: {
      id: string;
      vendingPlacementStatus: VendingPlacementStatus;
    }) => {
      const res = await fetch(`/api/venues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendingPlacementStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update status");
      return json as Venue;
    },
    onMutate: async ({ id, vendingPlacementStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["venues"] });
      const snapshots = queryClient.getQueriesData<VenuesPage>({ queryKey: ["venues"] });
      updateVenueInCache(queryClient, id, (venue) => ({ ...venue, vendingPlacementStatus }));
      return { snapshots };
    },
    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSuccess: (updated) => {
      updateVenueInCache(queryClient, updated.id, () => updated);
    },
  });
}

export function useDeleteVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/venues/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete venue");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
  });
}
