"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateUserInput, UpdateUserInput } from "@/lib/validations";
import { useUIStore } from "@/stores/ui-store";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { SEARCH_DEBOUNCE_MS } from "@/lib/query-config";
import type { Rep, UserDetail, UserRow, UsersPage } from "@/types";

function buildUserParams(filters: ReturnType<typeof useUIStore.getState>["userFilters"]) {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  if (filters.search) params.set("search", filters.search);
  return params.toString();
}

export function useUsers() {
  const filters = useUIStore((s) => s.userFilters);
  const debouncedSearch = useDebouncedValue(filters.search, SEARCH_DEBOUNCE_MS);
  const queryFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch]
  );

  return useQuery({
    queryKey: ["users", queryFilters],
    queryFn: async () => {
      const res = await fetch(`/api/users?${buildUserParams(queryFilters)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch users");
      return json as UsersPage;
    },
  });
}

async function fetchReps() {
  const res = await fetch("/api/reps");
  if (!res.ok) throw new Error("Failed to fetch reps");
  return res.json() as Promise<Rep[]>;
}

export function useSalesReps() {
  return useQuery({ queryKey: ["reps"], queryFn: fetchReps });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateUserInput) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create user");
      return json as UserRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["reps"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete user");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["reps"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useUserDetail(userId: string | null) {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json() as Promise<UserDetail>;
    },
    enabled: !!userId,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserInput }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update user");
      return json as UserRow;
    },
    onSuccess: (_updated, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", id] });
      queryClient.invalidateQueries({ queryKey: ["reps"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateUserCities() {
  const updateUser = useUpdateUser();
  return useMutation({
    mutationFn: async ({ id, cityIds }: { id: string; cityIds: string[] }) => {
      return updateUser.mutateAsync({ id, data: { cityIds } });
    },
  });
}
