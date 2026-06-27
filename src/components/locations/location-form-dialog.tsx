"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LocationStatus, ContactMode } from "@prisma/client";
import {
  useCreateLocation,
  useSearchLocations,
  useUpdateLocation,
} from "@/hooks/use-locations";
import { useCountries, useStates, useCities } from "@/hooks/use-countries";
import { useSalesReps } from "@/hooks/use-users";
import { useUIStore } from "@/stores/ui-store";
import { STATUS_LABELS, CONTACT_MODE_LABELS } from "@/lib/constants";
import {
  locationFormSchema,
  type LocationFormInput,
  toCreateLocationPayload,
  toUpdateLocationPayload,
} from "@/lib/validations";
import { normalizeEventName } from "@/lib/utils";
import type { Location } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface LocationFormDialogProps {
  userRole: string;
  editLocation?: Location | null;
}

interface LocationFormContentProps {
  userRole: string;
  editLocation?: Location | null;
  onClose: () => void;
}

function buildDefaults(editLocation?: Location | null): LocationFormInput {
  return {
    eventName: editLocation?.eventName ?? "",
    countryId: editLocation?.countryId ?? "",
    stateId: editLocation?.stateId ?? "",
    cityId: editLocation?.cityId ?? undefined,
    address: editLocation?.address ?? undefined,
    assignedRepId: editLocation?.assignedRepId ?? undefined,
    status: editLocation?.status ?? LocationStatus.ASSIGNED,
    contactModes: editLocation?.contactModes ?? [],
    contactEmail: editLocation?.contactEmail ?? "",
    contactPhone: editLocation?.contactPhone ?? "",
    reachedOutDate: editLocation?.reachedOutDate?.split("T")[0] ?? undefined,
    notes: editLocation?.notes ?? undefined,
  };
}

function LocationFormContent({ userRole, editLocation, onClose }: LocationFormContentProps) {
  const isEdit = !!editLocation;
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const { data: countries = [] } = useCountries();
  const { data: reps = [] } = useSalesReps();

  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState<"search" | "form">(isEdit ? "form" : "search");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LocationFormInput>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: buildDefaults(editLocation),
  });

  const countryId = watch("countryId");
  const stateId = watch("stateId");
  const contactModes = watch("contactModes") ?? [];
  const { data: states = [] } = useStates(countryId || undefined);
  const { data: cities = [] } = useCities(stateId, { fetchAll: false });
  const { data: searchResults = [] } = useSearchLocations(searchQuery);

  const isAdmin = userRole === "ADMIN" || userRole === "MANAGER";

  async function onSubmit(data: LocationFormInput) {
    try {
      if (isEdit && editLocation) {
        await updateLocation.mutateAsync({
          id: editLocation.id,
          data: toUpdateLocationPayload(data),
        });
        toast.success("Location updated");
      } else {
        await createLocation.mutateAsync(toCreateLocationPayload(data));
        toast.success("Location created");
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  const normalizedSearch = normalizeEventName(searchQuery);
  const exactMatch = searchResults.some(
    (loc: Location) => normalizeEventName(loc.eventName) === normalizedSearch
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Location" : "Add Location / Event"}</DialogTitle>
        {!isEdit && (
          <DialogDescription>
            Search for existing events before creating a new one.
          </DialogDescription>
        )}
      </DialogHeader>

      {!isEdit && step === "search" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Search Event Name</Label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type event name to search..."
            />
          </div>

          {searchQuery.length >= 2 && searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Matching events:</p>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-2">
                {searchResults.map((loc: Location) => (
                  <div key={loc.id} className="flex items-center justify-between text-sm">
                    <span>{loc.eventName}</span>
                    <Badge variant="secondary">
                      {loc.country.name} / {loc.state.name}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {exactMatch && (
            <p className="text-sm text-destructive">
              An exact match already exists. You cannot create a duplicate.
            </p>
          )}

          <Button
            type="button"
            className="w-full"
            disabled={searchQuery.length < 2 || exactMatch}
            onClick={() => {
              setValue("eventName", searchQuery.trim(), { shouldValidate: true });
              setStep("form");
            }}
          >
            Continue to Create
          </Button>
        </div>
      )}

      {(isEdit || step === "form") && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Event Name</Label>
            <Input
              {...register("eventName")}
              readOnly={!isEdit}
              className={!isEdit ? "bg-muted" : undefined}
            />
            {errors.eventName && (
              <p className="text-sm text-destructive">{errors.eventName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Controller
                name="countryId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue("stateId", "");
                      setValue("cityId", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.countryId && (
                <p className="text-sm text-destructive">{errors.countryId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Province/State</Label>
              <Controller
                name="stateId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue("cityId", "");
                    }}
                    disabled={!countryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province/state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.stateId && (
                <p className="text-sm text-destructive">{errors.stateId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>City</Label>
            <Controller
              name="cityId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={(v) => field.onChange(v || undefined)}
                  disabled={!stateId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Address (optional)</Label>
            <Input {...register("address")} />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LocationStatus).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Mode of Reach Out</Label>
            <p className="text-xs text-muted-foreground">Select all that apply</p>
            <Controller
              name="contactModes"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-4">
                  {Object.values(ContactMode).map((mode) => {
                    const checked = field.value?.includes(mode) ?? false;
                    return (
                      <label
                        key={mode}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="size-4 rounded border-input accent-primary"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...(field.value ?? []), mode]
                              : (field.value ?? []).filter((m) => m !== mode);
                            field.onChange(next);
                            if (!e.target.checked && mode === ContactMode.EMAIL) {
                              setValue("contactEmail", "");
                            }
                            if (!e.target.checked && mode === ContactMode.PHONE) {
                              setValue("contactPhone", "");
                            }
                          }}
                        />
                        {CONTACT_MODE_LABELS[mode]}
                      </label>
                    );
                  })}
                </div>
              )}
            />
          </div>

          {contactModes.includes(ContactMode.EMAIL) && (
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input type="email" placeholder="event@example.com" {...register("contactEmail")} />
              {errors.contactEmail && (
                <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
              )}
            </div>
          )}

          {contactModes.includes(ContactMode.PHONE) && (
            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input type="tel" placeholder="+1 (555) 000-0000" {...register("contactPhone")} />
              {errors.contactPhone && (
                <p className="text-sm text-destructive">{errors.contactPhone.message}</p>
              )}
            </div>
          )}

          {isAdmin && (
            <div className="space-y-2">
              <Label>Assigned Rep</Label>
              <Controller
                name="assignedRepId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rep (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {reps.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name ?? "Unnamed"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Reached Out Date</Label>
            <Input type="date" {...register("reachedOutDate")} />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register("notes")} />
          </div>

          <div className="flex gap-2">
            {!isEdit && (
              <Button type="button" variant="outline" onClick={() => setStep("search")}>
                Back
              </Button>
            )}
          <Button
            type="submit"
            className="flex-1"
            loading={isSubmitting || createLocation.isPending || updateLocation.isPending}
          >
            {isEdit ? "Update Location" : "Create Location"}
          </Button>
          </div>
        </form>
      )}
    </>
  );
}

export function LocationFormDialog({ userRole, editLocation }: LocationFormDialogProps) {
  const { locationModalOpen, setLocationModalOpen, setSelectedLocationId } = useUIStore();

  function handleClose(open: boolean) {
    setLocationModalOpen(open);
    if (!open) setSelectedLocationId(null);
  }

  return (
    <Dialog open={locationModalOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {locationModalOpen && (
          <LocationFormContent
            key={editLocation?.id ?? "new"}
            userRole={userRole}
            editLocation={editLocation}
            onClose={() => handleClose(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
