"use client";

import { LocationStatus, ContactMode } from "@prisma/client";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useLocations,
  useDeleteLocation,
  useUpdateLocationStatus,
} from "@/hooks/use-locations";
import { useCountries, useStates } from "@/hooks/use-countries";
import { useSalesReps } from "@/hooks/use-users";
import { useUIStore } from "@/stores/ui-store";
import { STATUS_COLORS, STATUS_LABELS, CONTACT_MODE_LABELS } from "@/lib/constants";
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

export function LocationsPageClient({ userRole }: LocationsPageClientProps) {
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

  const { data: states = [] } = useStates(locationFilters.countryId || undefined);

  const locations: Location[] = data?.locations ?? [];
  const pagination = data?.pagination;
  const editLocation = selectedLocationId
    ? locations.find((l) => l.id === selectedLocationId)
    : null;

  const isAdmin = userRole === "ADMIN" || userRole === "MANAGER";
  const isFirstLoad = isPending && data === undefined;

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
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder="Search events..."
              value={locationFilters.search}
              onChange={(e) =>
                setLocationFilters({ search: e.target.value, page: 1 })
              }
            />
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
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={locationFilters.countryId || "all"}
              onValueChange={(v) =>
                setLocationFilters({
                  countryId: v === "all" ? "" : v,
                  stateId: "",
                  page: 1,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map((c: { id: string; name: string }) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={locationFilters.stateId || "all"}
              onValueChange={(v) =>
                setLocationFilters({ stateId: v === "all" ? "" : v, page: 1 })
              }
              disabled={!locationFilters.countryId}
            >
              <SelectTrigger>
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map((s: { id: string; name: string }) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
                  {reps.map((r: { id: string; name: string | null }) => (
                    <SelectItem key={r.id} value={r.id}>{r.name ?? "Unnamed"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className={cn(isFirstLoad && LOADING_SURFACE_CLASS, "animate-fade-in-up")}>
        <CardContent className="p-0">
          {isFirstLoad ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
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
                      <td className="px-4 py-3 font-medium">{loc.eventName}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {loc.country.name} / {loc.state.name}
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
                        {loc.contactMode ? CONTACT_MODE_LABELS[loc.contactMode] : "—"}
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
