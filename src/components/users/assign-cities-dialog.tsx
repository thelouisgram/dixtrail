"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCities } from "@/hooks/use-countries";
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
import { BouncingDots } from "@/components/ui/cute-placeholder";

export function AssignCitiesDialog() {
  const { assignCitiesUserId, setAssignCitiesUserId } = useUIStore();
  const { data: user, isPending } = useUserDetail(assignCitiesUserId);
  const { data: cities = [] } = useCities(undefined, { fetchAll: true });
  const updateCities = useUpdateUserCities();
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setSelectedCityIds(user.assignedCities.map(({ city }) => city.id));
    }
  }, [user]);

  function handleOpenChange(open: boolean) {
    if (!open) {
      setAssignCitiesUserId(null);
      setSelectedCityIds([]);
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

        {isPending || !user ? (
          <div className="flex justify-center py-10">
            <BouncingDots />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cities</Label>
              {cities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No cities yet — add cities under Territories first.
                </p>
              ) : (
                <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border p-3">
                  {cities.map((city) => (
                    <label
                      key={city.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="size-4 rounded border-input accent-primary"
                        checked={selectedCityIds.includes(city.id)}
                        onChange={() => toggleCity(city.id)}
                      />
                      <span>
                        {city.name}
                        {city.state?.name ? ` · ${city.state.name}` : ""}
                        {city.state?.country?.name ? ` · ${city.state.country.name}` : ""}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="button"
              className="w-full"
              loading={updateCities.isPending}
              disabled={cities.length === 0}
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
