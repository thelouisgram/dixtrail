"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateUserInput } from "@/lib/validations";
import type { Rep, UserRow } from "@/types";

async function fetchUsers() {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json() as Promise<UserRow[]>;
}

async function fetchReps() {
  const res = await fetch("/api/reps");
  if (!res.ok) throw new Error("Failed to fetch reps");
  return res.json() as Promise<Rep[]>;
}

export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: fetchUsers });
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
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["users"] });
      const usersSnapshot = queryClient.getQueryData<UserRow[]>(["users"]);
      const repsSnapshot = queryClient.getQueryData<Rep[]>(["reps"]);
      const temp: UserRow = {
        id: `temp-${Date.now()}`,
        name: data.name,
        email: data.email,
        role: data.role,
        createdAt: new Date().toISOString(),
        _count: { assignedLocations: 0, createdLocations: 0 },
      };
      queryClient.setQueryData<UserRow[]>(["users"], (old = []) => [temp, ...old]);
      if (data.role === "SALES_REP" || data.role === "MANAGER") {
        queryClient.setQueryData<Rep[]>(["reps"], (old = []) =>
          [...old, { id: temp.id, name: temp.name, email: temp.email, role: temp.role }].sort(
            (a, b) => (a.name ?? "").localeCompare(b.name ?? "")
          )
        );
      }
      return { usersSnapshot, repsSnapshot };
    },
    onError: (_err, _data, context) => {
      queryClient.setQueryData(["users"], context?.usersSnapshot);
      queryClient.setQueryData(["reps"], context?.repsSnapshot);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<UserRow[]>(["users"], (old = []) =>
        [created, ...old.filter((u) => !u.id.startsWith("temp-"))]
      );
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["users"] });
      await queryClient.cancelQueries({ queryKey: ["reps"] });
      const usersSnapshot = queryClient.getQueryData<UserRow[]>(["users"]);
      const repsSnapshot = queryClient.getQueryData<Rep[]>(["reps"]);
      queryClient.setQueryData<UserRow[]>(["users"], (old = []) =>
        old.filter((u) => u.id !== id)
      );
      queryClient.setQueryData<Rep[]>(["reps"], (old = []) =>
        old.filter((r) => r.id !== id)
      );
      return { usersSnapshot, repsSnapshot };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(["users"], context?.usersSnapshot);
      queryClient.setQueryData(["reps"], context?.repsSnapshot);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}
