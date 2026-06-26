"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Country, State } from "@/types";
import {
  createCountrySchema,
  createStateSchema,
  type CreateStateInput,
} from "@/lib/validations";

export function useCountries() {
  return useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const res = await fetch("/api/countries");
      if (!res.ok) throw new Error("Failed to fetch countries");
      return res.json() as Promise<Country[]>;
    },
  });
}

export function useStates(countryId?: string) {
  return useQuery({
    queryKey: ["states", countryId],
    queryFn: async () => {
      const url = countryId ? `/api/states?countryId=${countryId}` : "/api/states";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch states");
      return res.json() as Promise<State[]>;
    },
    enabled: !!countryId,
  });
}

export function useCreateCountry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const parsed = createCountrySchema.parse({ name });
      const res = await fetch("/api/countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create country");
      return json as Country;
    },
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: ["countries"] });
      const snapshot = queryClient.getQueryData<Country[]>(["countries"]);
      const temp: Country = {
        id: `temp-${Date.now()}`,
        name,
        _count: { states: 0, locations: 0 },
      };
      queryClient.setQueryData<Country[]>(["countries"], (old = []) =>
        [...old, temp].sort((a, b) => a.name.localeCompare(b.name))
      );
      return { snapshot };
    },
    onError: (_err, _name, context) => {
      queryClient.setQueryData(["countries"], context?.snapshot);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<Country[]>(["countries"], (old = []) =>
        old
          .filter((c) => !c.id.startsWith("temp-"))
          .concat({ ...created, _count: created._count ?? { states: 0, locations: 0 } })
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteCountry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/countries/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete country");
      return json;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["countries"] });
      const snapshot = queryClient.getQueryData<Country[]>(["countries"]);
      queryClient.setQueryData<Country[]>(["countries"], (old = []) =>
        old.filter((c) => c.id !== id)
      );
      return { snapshot, id };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(["countries"], context?.snapshot);
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: ["states", id] });
      queryClient.invalidateQueries({ queryKey: ["states"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStateInput) => {
      const parsed = createStateSchema.parse(data);
      const res = await fetch("/api/states", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create state");
      return json as State;
    },
    onMutate: async ({ name, countryId }) => {
      await queryClient.cancelQueries({ queryKey: ["states", countryId] });
      const snapshot = queryClient.getQueryData<State[]>(["states", countryId]);
      const temp: State = {
        id: `temp-${Date.now()}`,
        name,
        countryId,
        _count: { locations: 0 },
      };
      queryClient.setQueryData<State[]>(["states", countryId], (old = []) =>
        [...old, temp].sort((a, b) => a.name.localeCompare(b.name))
      );
      queryClient.setQueryData<Country[]>(["countries"], (old = []) =>
        old.map((c) =>
          c.id === countryId
            ? { ...c, _count: { ...c._count!, states: (c._count?.states ?? 0) + 1 } }
            : c
        )
      );
      return { snapshot, countryId };
    },
    onError: (_err, { countryId }, context) => {
      queryClient.setQueryData(["states", countryId], context?.snapshot);
      queryClient.invalidateQueries({ queryKey: ["countries"] });
    },
    onSuccess: (created, { countryId }) => {
      queryClient.setQueryData<State[]>(["states", countryId], (old = []) =>
        old
          .filter((s) => !s.id.startsWith("temp-"))
          .concat(created)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
