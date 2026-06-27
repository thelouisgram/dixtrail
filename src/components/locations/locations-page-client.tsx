"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LocationStatus } from "@prisma/client";
import { Plus, MoreHorizontal, Pencil, Trash2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  useLocations,
  useDeleteLocation,
  useUpdateLocationStatus,
} from "@/hooks/use-locations";
import { useCountries, useStates, useCities } from "@/hooks/use-countries";
import { useSalesReps } from "@/hooks/use-users";
import { useUIStore } from "@/stores/ui-store";
import { STATUS_COLORS, STATUS_LABELS, formatContactModes } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocationFormDialog } from "./location-form-dialog";
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog";
import { QueryPageError } from "@/components/ui/query-page-error";
import {
  LOADING_SURFACE_CLASS,
  LocationsTablePlaceholder,
} from "@/components/ui/cute-placeholder";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

import type { Location } from "@/types";

interface LocationsPageClientProps {
  userRole: string;
}

interface LocationFilterSelectsProps {
  locationFilters: ReturnType<typeof useUIStore.getState>["locationFilters"];
  setLocationFilters: ReturnType<typeof useUIStore.getState>["setLocationFilters"];
  countries: { id: string; name: string }[];
  states: { id: string; name: string }[];
  cities: { id: string; name: string }[];
  reps: { id: string; name: string | null }[];
  isAdmin: boolean;
  layout?: "grid" | "stack";
}

function LocationFilterSelects({
  locationFilters,
  setLocationFilters,
  countries,
  states,
  cities,
  reps,
  isAdmin,
  layout = "grid",
}: LocationFilterSelectsProps) {
  const containerClass =
    layout === "stack"
      ? "flex flex-col gap-4"
      : "contents";

  return (
    <div className={containerClass}>
      <Select
        value={locationFilters.status || "all"}
        onValueChange={(v) =>
          setLocationFilters({
            status: v === "all" ? "" : (v as LocationStatus),
            page: 1,
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {Object.values(LocationStatus).map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={locationFilters.countryId || "all"}
        onValueChange={(v) =>
          setLocationFilters({
            countryId: v === "all" ? "" : v,
            stateId: "",
            cityId: "",
            page: 1,
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Countries</SelectItem>
          {countries.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={locationFilters.stateId || "all"}
        onValueChange={(v) =>
          setLocationFilters({
            stateId: v === "all" ? "" : v,
            cityId: "",
            page: 1,
          })
        }
        disabled={!locationFilters.countryId}
      >
        <SelectTrigger>
          <SelectValue placeholder="Province/State" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Provinces/States</SelectItem>
          {states.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={locationFilters.cityId || "all"}
        onValueChange={(v) =>
          setLocationFilters({ cityId: v === "all" ? "" : v, page: 1 })
        }
        disabled={!locationFilters.stateId}
      >
        <SelectTrigger>
          <SelectValue placeholder="City" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Cities</SelectItem>
          {cities.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isAdmin && (
        <Select
          value={locationFilters.assignedRepId || "all"}
          onValueChange={(v) =>
            setLocationFilters({
              assignedRepId: v === "all" ? "" : v,
              page: 1,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Assigned Rep" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reps</SelectItem>
            {reps.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name ?? "Unnamed"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function LocationsPageClient({ userRole }: LocationsPageClientProps) {
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data, isError, refetch, isPending } = useLocations();
  const deleteLocation = useDeleteLocation();
  const updateStatus = useUpdateLocationStatus();
  const { requestDelete, ConfirmDeleteDialog } = useConfirmDelete();
  const { data: countries = [] } = useCountries();
  const { data: reps = [] } = useSalesReps();
  const {
    locationFilters,
    setLocationFilters,
    setLocationModalOpen,
    setSelectedLocationId,
    selectedLocationId,
  } = useUIStore();

  useEffect(() => {
    const status = searchParams.get("status");
    const mineOnly = searchParams.get("mineOnly") === "true";
    const updates: Parameters<typeof setLocationFilters>[0] = {};

    if (status && Object.values(LocationStatus).includes(status as LocationStatus)) {
      updates.status = status as LocationStatus;
    }
    if (mineOnly) {
      updates.mineOnly = true;
    }
    if (Object.keys(updates).length > 0) {
      setLocationFilters({ ...updates, page: 1 });
    }
  }, [searchParams, setLocationFilters]);

  const { data: states = [] } = useStates(locationFilters.countryId || undefined);
  const { data: cities = [] } = useCities(locationFilters.stateId, { fetchAll: false });

  const locations: Location[] = data?.locations ?? [];
  const pagination = data?.pagination;
  const editLocation = selectedLocationId
    ? locations.find((l) => l.id === selectedLocationId)
    : null;

  const isAdmin = userRole === "ADMIN" || userRole === "MANAGER";
  const isSalesRep = userRole === "SALES_REP";
  const isFirstLoad = isPending && data === undefined;
  const rowOffset = pagination ? (pagination.page - 1) * pagination.limit : 0;

  const activeFilterCount = [
    locationFilters.status,
    locationFilters.countryId,
    locationFilters.stateId,
    locationFilters.cityId,
    locationFilters.assignedRepId,
  ].filter(Boolean).length;

  function clearFilters() {
    setLocationFilters({
      status: "",
      countryId: "",
      stateId: "",
      cityId: "",
      assignedRepId: "",
      mineOnly: false,
      page: 1,
    });
  }

  function toggleMineOnly() {
    setLocationFilters({ mineOnly: !locationFilters.mineOnly, page: 1 });
  }

  const filterSelectProps = {
    locationFilters,
    setLocationFilters,
    countries,
    states,
    cities,
    reps,
    isAdmin,
  };

  function openEdit(id: string) {
    setSelectedLocationId(id);
    setLocationModalOpen(true);
  }

  async function handleStatusChange(id: string, status: LocationStatus) {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success("Status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  }

  function handleDelete(id: string, eventName: string) {
    requestDelete({
      title: "Delete location",
      description: `Delete "${eventName}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteLocation.mutateAsync(id);
          toast.success("Location deleted");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to delete");
          throw error;
        }
      },
    });
  }

  return (
    <QueryPageError isError={isError} refetch={refetch}>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Locations & Events"
          description="Manage field sales locations and track progress"
          loadingDescription="Plotting locations on the map…"
          isLoading={isFirstLoad}
          action={
            <Button
              onClick={() => {
                setSelectedLocationId(null);
                setLocationModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          }
        />

      <Card className={cn(isFirstLoad && LOADING_SURFACE_CLASS, "animate-fade-in-up")}>
        <CardHeader className="hidden lg:block">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 lg:p-6 lg:pt-0">
          <div className="flex flex-wrap gap-2">
            <Input
              className="min-w-0 flex-1 basis-[12rem]"
              placeholder="Search events..."
              value={locationFilters.search}
              onChange={(e) =>
                setLocationFilters({ search: e.target.value, page: 1 })
              }
            />
            {isSalesRep && (
              <Button
                type="button"
                variant={locationFilters.mineOnly ? "default" : "outline"}
                className="shrink-0"
                onClick={toggleMineOnly}
              >
                My locations
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="relative shrink-0 gap-2 lg:hidden"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          <div className="hidden gap-4 lg:grid lg:grid-cols-4">
            <LocationFilterSelects {...filterSelectProps} />
          </div>
        </CardContent>
      </Card>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <LocationFilterSelects {...filterSelectProps} layout="stack" />
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={activeFilterCount === 0}
              onClick={clearFilters}
            >
              Clear filters
            </Button>
            <Button type="button" className="flex-1" onClick={() => setFiltersOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className={cn(isFirstLoad && LOADING_SURFACE_CLASS, "animate-fade-in-up")}>
        <CardContent className="p-0">
          {isFirstLoad ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="w-12 px-4 py-3 text-left font-medium">#</th>
                    <th className="px-4 py-3 text-left font-medium">Event</th>
                    <th className="px-4 py-3 text-left font-medium">Territory</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Contact</th>
                    <th className="px-4 py-3 text-left font-medium">Assigned Rep</th>
                    <th className="px-4 py-3 text-right font-medium w-15">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <LocationsTablePlaceholder />
                </tbody>
              </table>
            </div>
          ) : locations.length === 0 ? (
            <p className="p-6 text-muted-foreground">No locations found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="w-12 px-4 py-3 text-left font-medium">#</th>
                    <th className="px-4 py-3 text-left font-medium">Event</th>
                    <th className="px-4 py-3 text-left font-medium">Territory</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Contact</th>
                    <th className="px-4 py-3 text-left font-medium">Assigned Rep</th>
                    <th className="px-4 py-3 text-right font-medium w-15">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc, index) => (
                    <tr
                      key={loc.id}
                      className="animate-fade-in-up border-b hover:bg-muted/30"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {rowOffset + index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium">{loc.eventName}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {loc.country.name} / {loc.state.name}
                        {loc.city?.name ? ` / ${loc.city.name}` : ""}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={loc.status}
                          onValueChange={(v) =>
                            handleStatusChange(loc.id, v as LocationStatus)
                          }
                          disabled={updateStatus.isPending}
                        >
                          <SelectTrigger
                            className={`h-8 w-37.5 border-0 text-xs font-semibold ${STATUS_COLORS[loc.status]}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(LocationStatus).map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatContactModes(loc.contactModes, loc.contactEmail, loc.contactPhone)}
                      </td>
                      <td className="px-4 py-3">{loc.assignedRep?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(loc.id)}>
                                <Pencil className="h-4 w-4" />
                                Edit location
                              </DropdownMenuItem>
                              {isAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDelete(loc.id, loc.eventName)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete location
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setLocationFilters({ page: pagination.page - 1 })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setLocationFilters({ page: pagination.page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <LocationFormDialog userRole={userRole} editLocation={editLocation} />
      {ConfirmDeleteDialog}
      </div>
    </QueryPageError>
  );
}
