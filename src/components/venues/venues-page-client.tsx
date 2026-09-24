"use client";

import { useMemo, useState } from "react";
import {
  VenueType,
  SixClubsRelationship,
  VendingPlacementStatus,
} from "@prisma/client";
import { Plus, MoreHorizontal, Pencil, Trash2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  useVenues,
  useDeleteVenue,
  useUpdateVenuePlacementStatus,
} from "@/hooks/use-venues";
import { useCountries, useStates, useSearchCities, useCity } from "@/hooks/use-countries";
import { useUIStore } from "@/stores/ui-store";
import { formatDeal, formatMoney } from "@/lib/money";
import {
  VENUE_TYPE_LABELS,
  SIXCLUBS_RELATIONSHIP_LABELS,
  VENDING_PLACEMENT_STATUS_LABELS,
  VENDING_PLACEMENT_STATUS_COLORS,
} from "@/lib/constants";
import { formatDateInput } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
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
import { VenueFormDialog } from "./venue-form-dialog";
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
import type { City, Venue } from "@/types";

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

function formatDecisionMaker(venue: Venue): string {
  const parts: string[] = [];
  if (venue.decisionMakerName) parts.push(venue.decisionMakerName);
  if (venue.decisionMakerEmail) parts.push(venue.decisionMakerEmail);
  if (venue.decisionMakerPhone) parts.push(venue.decisionMakerPhone);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

interface VenuesPageClientProps {
  userRole: string;
}

interface VenueFilterSelectsProps {
  venueFilters: ReturnType<typeof useUIStore.getState>["venueFilters"];
  setVenueFilters: ReturnType<typeof useUIStore.getState>["setVenueFilters"];
  countries: { id: string; name: string }[];
  states: { id: string; name: string }[];
  layout?: "grid" | "stack";
}

function VenueFilterSelects({
  venueFilters,
  setVenueFilters,
  countries,
  states,
  layout = "grid",
}: VenueFilterSelectsProps) {
  const [citySearch, setCitySearch] = useState("");
  const { data: searchedCities = [], isFetching: citiesSearching } = useSearchCities(citySearch, {
    stateId: venueFilters.stateId || undefined,
    countryId: venueFilters.countryId || undefined,
  });
  const { data: pinnedCity } = useCity(venueFilters.cityId || undefined);
  const containerClass =
    layout === "stack"
      ? "flex flex-col gap-3"
      : "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6";

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
      setVenueFilters({ cityId: "", page: 1 });
    }
  }

  function handleCityOptionSelect(option: SearchableSelectOption) {
    if (option.value === "all") return;
    setVenueFilters({
      cityId: option.value,
      stateId: option.meta?.stateId ?? "",
      countryId: option.meta?.countryId ?? "",
      page: 1,
    });
  }

  return (
    <div className={containerClass}>
      <Select
        value={venueFilters.venueType || "all"}
        onValueChange={(v) =>
          setVenueFilters({
            venueType: v === "all" ? "" : (v as VenueType),
            page: 1,
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Venue Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {Object.values(VenueType).map((type) => (
            <SelectItem key={type} value={type}>
              {VENUE_TYPE_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={venueFilters.sixClubsRelationship || "all"}
        onValueChange={(v) =>
          setVenueFilters({
            sixClubsRelationship: v === "all" ? "" : (v as SixClubsRelationship),
            page: 1,
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="6ixClubs Relationship" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Relationships</SelectItem>
          {Object.values(SixClubsRelationship).map((rel) => (
            <SelectItem key={rel} value={rel}>
              {SIXCLUBS_RELATIONSHIP_LABELS[rel]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={venueFilters.vendingPlacementStatus || "all"}
        onValueChange={(v) =>
          setVenueFilters({
            vendingPlacementStatus: v === "all" ? "" : (v as VendingPlacementStatus),
            page: 1,
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Placement Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {Object.values(VendingPlacementStatus).map((status) => (
            <SelectItem key={status} value={status}>
              {VENDING_PLACEMENT_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={venueFilters.countryId || "all"}
        onValueChange={(v) =>
          setVenueFilters({
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

      <SearchableSelect
        portalMode="body"
        value={venueFilters.stateId || "all"}
        onValueChange={(v) =>
          setVenueFilters({
            stateId: v === "all" ? "" : v,
            cityId: "",
            page: 1,
          })
        }
        disabled={!venueFilters.countryId}
        placeholder="Province/State"
        searchPlaceholder="Search provinces…"
        emptyMessage="No provinces match your search."
        options={[
          { value: "all", label: "All Provinces/States" },
          ...states.map((state) => ({ value: state.id, label: state.name })),
        ]}
      />

      <SearchableSelect
        portalMode="body"
        value={venueFilters.cityId || "all"}
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
  );
}

export function VenuesPageClient({ userRole }: VenuesPageClientProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data, isError, refetch, isPending } = useVenues();
  const deleteVenue = useDeleteVenue();
  const updatePlacementStatus = useUpdateVenuePlacementStatus();
  const { requestDelete, ConfirmDeleteDialog } = useConfirmDelete();
  const { data: countries = [] } = useCountries();
  const venueFilters = useUIStore((s) => s.venueFilters);
  const setVenueFilters = useUIStore((s) => s.setVenueFilters);
  const setVenueModalOpen = useUIStore((s) => s.setVenueModalOpen);
  const setSelectedVenueId = useUIStore((s) => s.setSelectedVenueId);
  const selectedVenueId = useUIStore((s) => s.selectedVenueId);

  const { data: states = [] } = useStates(venueFilters.countryId || undefined);

  const venues: Venue[] = data?.venues ?? [];
  const pagination = data?.pagination;
  const editVenue = selectedVenueId ? venues.find((v) => v.id === selectedVenueId) : null;

  const isAdmin = userRole === "ADMIN" || userRole === "MANAGER";
  const isFirstLoad = isInitialQueryLoad(isPending, data);
  const rowOffset = pagination ? (pagination.page - 1) * pagination.limit : 0;

  const activeFilterCount = [
    venueFilters.venueType,
    venueFilters.sixClubsRelationship,
    venueFilters.vendingPlacementStatus,
    venueFilters.countryId,
    venueFilters.stateId,
    venueFilters.cityId,
  ].filter(Boolean).length;

  function clearFilters() {
    setVenueFilters({
      venueType: "",
      sixClubsRelationship: "",
      vendingPlacementStatus: "",
      countryId: "",
      stateId: "",
      cityId: "",
      page: 1,
    });
  }

  const filterSelectProps = {
    venueFilters,
    setVenueFilters,
    countries,
    states,
  };

  function openEdit(id: string) {
    setSelectedVenueId(id);
    setVenueModalOpen(true);
  }

  async function handlePlacementStatusChange(
    id: string,
    status: VendingPlacementStatus
  ) {
    try {
      await updatePlacementStatus.mutateAsync({ id, vendingPlacementStatus: status });
      toast.success("Placement status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  }

  function handleDelete(id: string, name: string) {
    requestDelete({
      title: "Delete venue",
      description: `Delete "${name}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteVenue.mutateAsync(id);
          toast.success("Venue deleted");
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
          title="6ixClubs Venue Portfolio"
          description="Track venues 6ixClubs brings to the Luxe Dispense partnership and chase placement opportunities"
          loadingDescription="Loading venue portfolio…"
          isLoading={isFirstLoad}
          action={
            <Button
              onClick={() => {
                setSelectedVenueId(null);
                setVenueModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Venue
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
                placeholder="Search venues..."
                value={venueFilters.search}
                onChange={(e) =>
                  setVenueFilters({ search: e.target.value, page: 1 })
                }
              />
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
              <VenueFilterSelects {...filterSelectProps} />
            </div>
          </CardContent>
        </Card>

        <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Filters</DialogTitle>
            </DialogHeader>
            <VenueFilterSelects {...filterSelectProps} layout="stack" />
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
                      <th className="px-4 py-3 text-left font-medium">Venue</th>
                      <th className="px-4 py-3 text-left font-medium">City</th>
                      <th className="px-4 py-3 text-left font-medium">Type</th>
                      <th className="px-4 py-3 text-left font-medium">6ixClubs</th>
                      <th className="px-4 py-3 text-left font-medium">Placement</th>
                      <th className="px-4 py-3 text-left font-medium">Next Action</th>
                      <th className="px-4 py-3 text-left font-medium">Deal</th>
                      <th className="px-4 py-3 text-left font-medium">Revenue</th>
                      <th className="px-4 py-3 text-left font-medium">Share</th>
                      <th className="px-4 py-3 text-left font-medium">6ixClubs 5%</th>
                      <th className="px-4 py-3 text-right font-medium w-15">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <LocationsTablePlaceholder />
                  </tbody>
                </table>
              </div>
            ) : venues.length === 0 ? (
              <EmptyState
                className="py-12"
                title="No venues found."
                description="Add venues that 6ixClubs is bringing into the Luxe Dispense partnership."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="w-12 px-4 py-3 text-left font-medium">#</th>
                      <th className="px-4 py-3 text-left font-medium">Venue</th>
                      <th className="px-4 py-3 text-left font-medium">City</th>
                      <th className="px-4 py-3 text-left font-medium">Type</th>
                      <th className="px-4 py-3 text-left font-medium">6ixClubs</th>
                      <th className="px-4 py-3 text-left font-medium">Placement</th>
                      <th className="px-4 py-3 text-left font-medium">Next Action</th>
                      <th className="px-4 py-3 text-left font-medium">Deal</th>
                      <th className="px-4 py-3 text-left font-medium">Revenue</th>
                      <th className="px-4 py-3 text-left font-medium">Share</th>
                      <th className="px-4 py-3 text-left font-medium">6ixClubs 5%</th>
                      <th className="px-4 py-3 text-right font-medium w-15">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venues.map((venue, index) => (
                      <tr
                        key={venue.id}
                        className="animate-fade-in-up border-b hover:bg-muted/30"
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">
                          {rowOffset + index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{venue.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDecisionMaker(venue)}
                          </div>
                          {(venue.eventsPerMonth || venue.approximateAttendance) && (
                            <div className="text-xs text-muted-foreground">
                              {venue.eventsPerMonth ? `${venue.eventsPerMonth} events/mo` : ""}
                              {venue.eventsPerMonth && venue.approximateAttendance ? " · " : ""}
                              {venue.approximateAttendance
                                ? `~${venue.approximateAttendance.toLocaleString()} attendance`
                                : ""}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {venue.city?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {VENUE_TYPE_LABELS[venue.venueType]}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {SIXCLUBS_RELATIONSHIP_LABELS[venue.sixClubsRelationship]}
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={venue.vendingPlacementStatus}
                            onValueChange={(v) =>
                              handlePlacementStatusChange(
                                venue.id,
                                v as VendingPlacementStatus
                              )
                            }
                            disabled={updatePlacementStatus.isPending}
                          >
                            <SelectTrigger
                              className={`h-8 w-37.5 border-0 text-xs font-semibold ${VENDING_PLACEMENT_STATUS_COLORS[venue.vendingPlacementStatus]}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(VendingPlacementStatus).map((s) => (
                                <SelectItem key={s} value={s}>
                                  {VENDING_PLACEMENT_STATUS_LABELS[s]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {venue.nextAction ? (
                            <div>
                              <div className="text-sm">{venue.nextAction}</div>
                              {venue.nextActionDate && (
                                <div className="text-xs">
                                  Due: {formatDateInput(venue.nextActionDate)}
                                </div>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDeal(venue.compensationType, venue.profitPercent)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">{formatMoney(venue.revenue)}</td>
                        <td className="px-4 py-3 tabular-nums font-medium">{formatMoney(venue.locationShare)}</td>
                        <td className="px-4 py-3 tabular-nums">{formatMoney(venue.sixClubCommission)}</td>
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
                                <DropdownMenuItem onClick={() => openEdit(venue.id)}>
                                  <Pencil className="h-4 w-4" />
                                  Edit venue
                                </DropdownMenuItem>
                                {isAdmin && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => handleDelete(venue.id, venue.name)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete venue
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
                onClick={() => setVenueFilters({ page: pagination.page - 1 })}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setVenueFilters({ page: pagination.page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <VenueFormDialog editVenue={editVenue} />
        {ConfirmDeleteDialog}
      </div>
    </QueryPageError>
  );
}
