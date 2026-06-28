"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateLocationInput, UpdateLocationInput } from "@/lib/validations";
import { useUIStore } from "@/stores/ui-store";
import { LocationStatus } from "@prisma/client";
import type { DashboardData, Location, LocationsPage } from "@/types";

function isLocationsPage(data: unknown): data is LocationsPage {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as LocationsPage).locations) &&
    typeof (data as LocationsPage).pagination === "object"
  );
}

function buildLocationParams(filters: ReturnType<typeof useUIStore.getState>["locationFilters"]) {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.countryId) params.set("countryId", filters.countryId);
  if (filters.stateId) params.set("stateId", filters.stateId);
  if (filters.cityId) params.set("cityId", filters.cityId);
  if (filters.assignedRepId) params.set("assignedRepId", filters.assignedRepId);
  if (filters.mineOnly) params.set("mineOnly", "true");
  return params.toString();
}

function updateLocationInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  updater: (loc: Location) => Location
) {
  queryClient.setQueriesData<LocationsPage>({ queryKey: ["locations"] }, (old) => {
    if (!isLocationsPage(old)) return old;
    return {
      ...old,
      locations: old.locations.map((loc) => (loc.id === id ? updater(loc) : loc)),
    };
  });
}

function adjustDashboardStatusCount(
  queryClient: ReturnType<typeof useQueryClient>,
  from: LocationStatus | undefined,
  to: LocationStatus
) {
  if (!from || from === to) return;
  queryClient.setQueryData<DashboardData>(["dashboard"], (old) => {
    if (!old) return old;
    return {
      ...old,
      statusCounts: {
        ...old.statusCounts,
        [from]: Math.max(0, (old.statusCounts[from] ?? 0) - 1),
        [to]: (old.statusCounts[to] ?? 0) + 1,
      },
    };
  });
}

function findLocationStatus(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string
): LocationStatus | undefined {
  const entries = queryClient.getQueriesData<LocationsPage>({ queryKey: ["locations"] });
  for (const [, data] of entries) {
    if (!isLocationsPage(data)) continue;
    const loc = data.locations.find((l) => l.id === id);
    if (loc) return loc.status;
  }
  return undefined;
}

export function useLocations() {
  const filters = useUIStore((s) => s.locationFilters);
  return useQuery({
    queryKey: ["locations", filters],
    queryFn: async () => {
      const res = await fetch(`/api/locations?${buildLocationParams(filters)}`);
      if (!res.ok) throw new Error("Failed to fetch locations");
      return res.json() as Promise<LocationsPage>;
    },
  });
}

export function useSearchLocations(query: string) {
  return useQuery({
    queryKey: ["location-search", query],
    queryFn: async () => {
      const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to search locations");
      return res.json() as Promise<Location[]>;
    },
    enabled: query.length >= 2,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateLocationInput) => {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create location");
      return json as Location;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["locations"] });
      const snapshots = queryClient.getQueriesData<LocationsPage>({ queryKey: ["locations"] });
      const dashboardSnapshot = queryClient.getQueryData<DashboardData>(["dashboard"]);
      const tempId = `temp-${Date.now()}`;
      const status = data.status ?? LocationStatus.ASSIGNED;

      queryClient.setQueriesData<LocationsPage>({ queryKey: ["locations"] }, (old) => {
        if (!isLocationsPage(old)) return old;
        const optimistic: Location = {
          id: tempId,
          eventName: data.eventName,
          countryId: data.countryId,
          stateId: data.stateId,
          status,
          contactModes: data.contactModes ?? [],
          contactEmail: data.contactEmail ?? null,
          contactPhone: data.contactPhone ?? null,
          country: { id: data.countryId, name: "…" },
          state: { id: data.stateId, name: "…" },
        };
        return {
          ...old,
          locations: [optimistic, ...old.locations],
          pagination: { ...old.pagination, total: old.pagination.total + 1 },
        };
      });

      queryClient.setQueryData<DashboardData>(["dashboard"], (old) => {
        if (!old) return old;
        return {
          ...old,
          totalLocations: old.totalLocations + 1,
          statusCounts: {
            ...old.statusCounts,
            [status]: (old.statusCounts[status] ?? 0) + 1,
          },
        };
      });

      return { snapshots, dashboardSnapshot };
    },
    onError: (_err, _data, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
      queryClient.setQueryData(["dashboard"], context?.dashboardSnapshot);
    },
    onSuccess: (created) => {
      queryClient.setQueriesData<LocationsPage>({ queryKey: ["locations"] }, (old) => {
        if (!isLocationsPage(old)) return old;
        return {
          ...old,
          locations: old.locations.map((loc) =>
            loc.id.startsWith("temp-") ? created : loc
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLocationInput }) => {
      const res = await fetch(`/api/locations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update location");
      return json as Location;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["locations"] });
      const snapshots = queryClient.getQueriesData<LocationsPage>({ queryKey: ["locations"] });
      const dashboardSnapshot = queryClient.getQueryData<DashboardData>(["dashboard"]);
      const oldStatus = findLocationStatus(queryClient, id);

      updateLocationInCache(queryClient, id, (loc) => ({ ...loc, ...data } as Location));
      if (data.status) adjustDashboardStatusCount(queryClient, oldStatus, data.status);

      return { snapshots, dashboardSnapshot };
    },
    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
      queryClient.setQueryData(["dashboard"], context?.dashboardSnapshot);
    },
    onSuccess: (updated) => {
      updateLocationInCache(queryClient, updated.id, () => updated);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateLocationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      followUpDate,
    }: {
      id: string;
      status: LocationStatus;
      followUpDate?: string;
    }) => {
      const res = await fetch(`/api/locations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...(followUpDate ? { followUpDate } : {}) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update status");
      return json as Location;
    },
    onMutate: async ({ id, status, followUpDate }) => {
      await queryClient.cancelQueries({ queryKey: ["locations"] });
      const snapshots = queryClient.getQueriesData<LocationsPage>({ queryKey: ["locations"] });
      const dashboardSnapshot = queryClient.getQueryData<DashboardData>(["dashboard"]);
      const oldStatus = findLocationStatus(queryClient, id);

      updateLocationInCache(queryClient, id, (loc) => ({
        ...loc,
        status,
        ...(followUpDate ? { followUpDate } : {}),
      }));
      adjustDashboardStatusCount(queryClient, oldStatus, status);

      return { snapshots, dashboardSnapshot };
    },
    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
      queryClient.setQueryData(["dashboard"], context?.dashboardSnapshot);
    },
    onSuccess: (updated) => {
      updateLocationInCache(queryClient, updated.id, () => updated);
      queryClient.setQueryData<DashboardData>(["dashboard"], (old) => {
        if (!old) return old;
        const recent = old.recentLocations.filter((l) => l.id !== updated.id);
        return { ...old, recentLocations: [updated, ...recent].slice(0, 5) };
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete location");
      return json;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["locations"] });
      const snapshots = queryClient.getQueriesData<LocationsPage>({ queryKey: ["locations"] });
      const dashboardSnapshot = queryClient.getQueryData<DashboardData>(["dashboard"]);
      const oldStatus = findLocationStatus(queryClient, id);

      queryClient.setQueriesData<LocationsPage>({ queryKey: ["locations"] }, (old) => {
        if (!isLocationsPage(old)) return old;
        return {
          ...old,
          locations: old.locations.filter((loc) => loc.id !== id),
          pagination: {
            ...old.pagination,
            total: Math.max(0, old.pagination.total - 1),
          },
        };
      });

      if (oldStatus) {
        queryClient.setQueryData<DashboardData>(["dashboard"], (old) => {
          if (!old) return old;
          return {
            ...old,
            totalLocations: Math.max(0, old.totalLocations - 1),
            statusCounts: {
              ...old.statusCounts,
              [oldStatus]: Math.max(0, (old.statusCounts[oldStatus] ?? 0) - 1),
            },
            recentLocations: old.recentLocations.filter((l) => l.id !== id),
          };
        });
      }

      return { snapshots, dashboardSnapshot };
    },
    onError: (_err, _id, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
      queryClient.setQueryData(["dashboard"], context?.dashboardSnapshot);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["countries"] });
    },
  });
}
