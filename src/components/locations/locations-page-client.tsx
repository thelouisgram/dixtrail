"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LocationStatus } from "@prisma/client";
import { Plus, MoreHorizontal, Pencil, Trash2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  useLocations,
  useDeleteLocation,
  useUpdateLocationStatus,
} from "@/hooks/use-locations";
import { useCountries, useStates, useSearchCities, useCity } from "@/hooks/use-countries";
import { useSalesReps } from "@/hooks/use-users";
import { useUIStore } from "@/stores/ui-store";
import { STATUS_COLORS, STATUS_LABELS, formatContactModes } from "@/lib/constants";
import { formatDateInput, todayDateInput } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocationFormDialog } from "./location-form-dialog";
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog";
import { QueryPageError } from "@/components/ui/query-page-error";
import {
  EmptyState,
  isInitialQueryLoad,
  LOADING_SURFACE_CLASS,
  LocationsTablePlaceholder,
} from "@/components/ui/cute-placeholder";
import { PageHeader } from "@/components/ui/page-header";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";

import type { City, Location } from "@/types";

function toCityFilterOptions(cities: City[]): SearchableSelectOption[] {
  return [
    { value: "all", label: "All Cities" },
    ...cities.map((city) => ({
      value: city.id,
      label: city.name,
      description: city.state
        ? `${city.state.name}, ${city.state.country?.name ?? ""}`
        : undefined,
      meta: {
        stateId: city.stateId,
        countryId: city.state?.country?.id ?? "",
      },
    })),
  ];
}

interface LocationsPageClientProps {
  userRole: string;
}

interface LocationFilterSelectsProps {
  locationFilters: ReturnType<typeof useUIStore.getState>["locationFilters"];
  setLocationFilters: ReturnType<typeof useUIStore.getState>["setLocationFilters"];
  countries: { id: string; name: string }[];
  states: { id: string; name: string }[];
  reps: { id: string; name: string | null }[];
  isAdmin: boolean;
  layout?: "grid" | "stack";
}

function LocationFilterSelects({
  locationFilters,
  setLocationFilters,
  countries,
  states,
  reps,
  isAdmin,
  layout = "grid",
}: LocationFilterSelectsProps) {
  const [citySearch, setCitySearch] = useState("");
  const { data: searchedCities = [], isFetching: citiesSearching } = useSearchCities(citySearch, {
    stateId: locationFilters.stateId || undefined,
    countryId: locationFilters.countryId || undefined,
  });
  const { data: pinnedCity } = useCity(locationFilters.cityId || undefined);
  const containerClass =
    layout === "stack"
      ? "flex flex-col gap-3"
      : "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5";

  const itemClass = "min-w-0";

  const citySource = useMemo(() => {
    const base = searchedCities;
    if (pinnedCity && !base.some((city) => city.id === pinnedCity.id)) {
      return [pinnedCity, ...base];
    }
    return base;
  }, [searchedCities, pinnedCity]);

  const cityOptions = useMemo(() => toCityFilterOptions(citySource), [citySource]);

  function handleCityFilterChange(selectedCityId: string) {
    if (selectedCityId === "all") {
      setLocationFilters({ cityId: "", page: 1 });
    }
  }

  function handleCityOptionSelect(option: SearchableSelectOption) {
    if (option.value === "all") return;

    setLocationFilters({
      cityId: option.value,
      stateId: option.meta?.stateId ?? "",
      countryId: option.meta?.countryId ?? "",
      page: 1,
    });
  }

  return (
    <div className={containerClass}>
      <div className={itemClass}>
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
      </div>
      <div className={itemClass}>
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
      </div>
      <div className={itemClass}>
        <SearchableSelect
          portalMode="body"
          value={locationFilters.stateId || "all"}
          onValueChange={(v) =>
            setLocationFilters({
              stateId: v === "all" ? "" : v,
              cityId: "",
              page: 1,
            })
          }
          disabled={!locationFilters.countryId}
          placeholder="Province/State"
          searchPlaceholder="Search provinces…"
          emptyMessage="No provinces match your search."
          options={[
            { value: "all", label: "All Provinces/States" },
            ...states.map((state) => ({ value: state.id, label: state.name })),
          ]}
        />
      </div>
      <div className={itemClass}>
        <SearchableSelect
          portalMode="body"
          value={locationFilters.cityId || "all"}
          onValueChange={handleCityFilterChange}
          onOptionSelect={handleCityOptionSelect}
          placeholder="City"
          searchPlaceholder="Search cities…"
          emptyMessage="No cities match your search."
          typeToSearchMessage="Type at least 2 characters to search cities."
          options={cityOptions}
          serverSearch
          minSearchLength={2}
          onSearchChange={setCitySearch}
          isSearching={citiesSearching}
        />
      </div>
      {isAdmin && (
        <div className={itemClass}>
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
        </div>
      )}
    </div>
  );
}

export function LocationsPageClient({ userRole }: LocationsPageClientProps) {
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [followUpPrompt, setFollowUpPrompt] = useState<{
    id: string;
    eventName: string;
    previousStatus: LocationStatus;
  } | null>(null);
  const [followUpDate, setFollowUpDate] = useState("");
  const { data, isError, refetch, isPending } = useLocations();
  const deleteLocation = useDeleteLocation();
  const updateStatus = useUpdateLocationStatus();
  const { requestDelete, ConfirmDeleteDialog } = useConfirmDelete();
  const { data: countries = [] } = useCountries();
  const { data: reps = [] } = useSalesReps();
  const locationFilters = useUIStore((s) => s.locationFilters);
  const setLocationFilters = useUIStore((s) => s.setLocationFilters);
  const setLocationModalOpen = useUIStore((s) => s.setLocationModalOpen);
  const setSelectedLocationId = useUIStore((s) => s.setSelectedLocationId);
  const selectedLocationId = useUIStore((s) => s.selectedLocationId);

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

  const locations: Location[] = data?.locations ?? [];
  const pagination = data?.pagination;
  const editLocation = selectedLocationId
    ? locations.find((l) => l.id === selectedLocationId)
    : null;

  const isAdmin = userRole === "ADMIN" || userRole === "MANAGER";
  const isSalesRep = userRole === "SALES_REP";
  const isFirstLoad = isInitialQueryLoad(isPending, data);
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
    reps,
    isAdmin,
  };

  function openEdit(id: string) {
    setSelectedLocationId(id);
    setLocationModalOpen(true);
  }

  async function handleStatusChange(
    id: string,
    status: LocationStatus,
    currentStatus: LocationStatus,
    eventName: string
  ) {
    if (status === LocationStatus.FOLLOW_UP) {
      setFollowUpDate("");
      setFollowUpPrompt({ id, eventName, previousStatus: currentStatus });
      return;
    }

    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success("Status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  }

  async function confirmFollowUpDate() {
    if (!followUpPrompt || !followUpDate) {
      toast.error("Select a follow-up date");
      return;
    }

    try {
      await updateStatus.mutateAsync({
        id: followUpPrompt.id,
        status: LocationStatus.FOLLOW_UP,
        followUpDate,
      });
      toast.success("Follow-up scheduled");
      setFollowUpPrompt(null);
      setFollowUpDate("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to schedule follow-up");
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

      <Card className={cn(isFirstLoad && LOADING_SURFACE_CLASS, "relative z-10 animate-fade-in-up")}>
        <CardHeader className="hidden lg:block">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 lg:p-6 lg:pt-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <SearchInput
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

          <div className="hidden lg:block">
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
                    <th className="px-4 py-3 text-left font-medium">City</th>
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
            <EmptyState
              className="py-12"
              title="No locations found."
              description="Try adjusting your filters or add a new location."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="w-12 px-4 py-3 text-left font-medium">#</th>
                    <th className="px-4 py-3 text-left font-medium">Event</th>
                    <th className="px-4 py-3 text-left font-medium">City</th>
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
                        {loc.city?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <Select
                            value={loc.status}
                            onValueChange={(v) =>
                              handleStatusChange(
                                loc.id,
                                v as LocationStatus,
                                loc.status,
                                loc.eventName
                              )
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
                          {loc.status === LocationStatus.FOLLOW_UP && loc.followUpDate && (
                            <p className="text-xs text-muted-foreground">
                              Follow-up: {formatDateInput(loc.followUpDate)}
                            </p>
                          )}
                        </div>
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
      <Dialog
        open={!!followUpPrompt}
        onOpenChange={(open) => {
          if (!open) {
            setFollowUpPrompt(null);
            setFollowUpDate("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule follow-up</DialogTitle>
            <DialogDescription>
              {followUpPrompt
                ? `Choose a follow-up date for "${followUpPrompt.eventName}".`
                : "Choose a follow-up date."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inline-follow-up-date">Follow-up date</Label>
              <Input
                id="inline-follow-up-date"
                type="date"
                min={todayDateInput()}
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A notification will be sent to the assigned rep on this date.
            </p>
            <Button
              className="w-full"
              loading={updateStatus.isPending}
              disabled={!followUpDate}
              onClick={confirmFollowUpDate}
            >
              Save follow-up
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {ConfirmDeleteDialog}
      </div>
    </QueryPageError>
  );
}
