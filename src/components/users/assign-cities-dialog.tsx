"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSearchCities } from "@/hooks/use-countries";
import { useUpdateUserCities, useUserDetail } from "@/hooks/use-users";
import { useUIStore } from "@/stores/ui-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import { CheckboxListPlaceholder, DialogFormPlaceholder } from "@/components/ui/cute-placeholder";
import type { City } from "@/types";

export function AssignCitiesDialog() {
  const { assignCitiesUserId, setAssignCitiesUserId } = useUIStore();
  const { data: user, isPending: userLoading } = useUserDetail(assignCitiesUserId);
  const updateCities = useUpdateUserCities();
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const { data: searchResults = [], isFetching: searchLoading } = useSearchCities(search, {
    enabled: search.trim().length >= 2,
  });

  useEffect(() => {
    if (user) {
      setSelectedCityIds(user.assignedCities.map(({ city }) => city.id));
    }
  }, [user]);

  const assignedCities = useMemo((): City[] => {
    return (
      user?.assignedCities.map(({ city }) => ({
        id: city.id,
        name: city.name,
        stateId: city.state?.id ?? "",
        state: city.state,
      })) ?? []
    );
  }, [user]);

  const displayCities = useMemo(() => {
    const query = search.trim();
    if (query.length < 2) {
      return assignedCities;
    }

    const merged = new Map<string, City>();
    for (const city of assignedCities) {
      merged.set(city.id, city);
    }
    for (const city of searchResults) {
      merged.set(city.id, city);
    }
    return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [assignedCities, search, searchResults]);

  function handleOpenChange(open: boolean) {
    if (!open) {
      setAssignCitiesUserId(null);
      setSelectedCityIds([]);
      setSearch("");
    }
  }

  function toggleCity(cityId: string) {
    setSelectedCityIds((prev) =>
      prev.includes(cityId) ? prev.filter((id) => id !== cityId) : [...prev, cityId]
    );
  }

  async function handleSave() {
    if (!assignCitiesUserId) return;
    try {
      await updateCities.mutateAsync({ id: assignCitiesUserId, cityIds: selectedCityIds });
      toast.success("City assignments updated");
      setAssignCitiesUserId(null);
      setSelectedCityIds([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update cities");
    }
  }

  const showSearchHint = search.trim().length < 2;

  return (
    <Dialog open={!!assignCitiesUserId} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign cities</DialogTitle>
          <DialogDescription>
            {user
              ? `Select territories for ${user.name ?? user.email}. The user will be notified for new assignments.`
              : "Loading user…"}
          </DialogDescription>
        </DialogHeader>

        {userLoading || !user ? (
          <DialogFormPlaceholder />
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cities</Label>
              <>
                <SearchInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search cities…"
                />
                {searchLoading && search.trim().length >= 2 && (
                  <p className="text-xs text-muted-foreground">Searching…</p>
                )}
                {showSearchHint && assignedCities.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No cities assigned yet — type at least 2 characters to search.
                  </p>
                )}
                {showSearchHint && assignedCities.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Showing assigned cities. Type at least 2 characters to search all cities.
                  </p>
                )}
                <div className="max-h-60 space-y-1 overflow-y-auto rounded-md border p-2">
                  {displayCities.length === 0 ? (
                    <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                      {showSearchHint
                        ? "Type at least 2 characters to search cities."
                        : "No cities match your search."}
                    </p>
                  ) : (
                    displayCities.map((city) => (
                      <label
                        key={city.id}
                        className="flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent/50"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
                          checked={selectedCityIds.includes(city.id)}
                          onChange={() => toggleCity(city.id)}
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{city.name}</span>
                          {(city.state?.name || city.state?.country?.name) && (
                            <span className="block truncate text-xs text-muted-foreground">
                              {[city.state?.name, city.state?.country?.name]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          )}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </>
            </div>

            <Button
              type="button"
              className="w-full"
              loading={updateCities.isPending}
              onClick={handleSave}
            >
              Save city assignments
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
