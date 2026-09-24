"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  VenueType,
  SixClubsRelationship,
  VendingPlacementStatus,
} from "@prisma/client";
import { useCreateVenue, useSearchVenues, useUpdateVenue } from "@/hooks/use-venues";
import { useCountries, useStates, useSearchCities } from "@/hooks/use-countries";
import { useUIStore } from "@/stores/ui-store";
import { CompensationFields, dealFromRecord } from "@/components/compensation-fields";
import {
  VENUE_TYPE_LABELS,
  SIXCLUBS_RELATIONSHIP_LABELS,
  VENDING_PLACEMENT_STATUS_LABELS,
} from "@/lib/constants";
import {
  venueFormSchema,
  type VenueFormInput,
  toCreateVenuePayload,
  toUpdateVenuePayload,
} from "@/lib/validations";
import { normalizeEventName, cn } from "@/lib/utils";
import type { City, Venue } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
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
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";

function toCityOptions(cities: City[]): SearchableSelectOption[] {
  return cities.map((city) => ({
    value: city.id,
    label: city.name,
    description: city.state
      ? `${city.state.name}, ${city.state.country?.name ?? ""}`
      : undefined,
    meta: {
      stateId: city.stateId,
      countryId: city.state?.country?.id ?? "",
    },
  }));
}

interface VenueFormDialogProps {
  editVenue?: Venue | null;
}

interface VenueFormContentProps {
  editVenue?: Venue | null;
  onClose: () => void;
}

function buildDefaults(editVenue?: Venue | null): VenueFormInput {
  return {
    name: editVenue?.name ?? "",
    countryId: editVenue?.countryId ?? "",
    stateId: editVenue?.stateId ?? "",
    cityId: editVenue?.cityId ?? "",
    address: editVenue?.address ?? undefined,
    venueType: editVenue?.venueType ?? VenueType.NIGHTCLUB,
    decisionMakerName: editVenue?.decisionMakerName ?? "",
    decisionMakerEmail: editVenue?.decisionMakerEmail ?? "",
    decisionMakerPhone: editVenue?.decisionMakerPhone ?? "",
    sixClubsRelationship: editVenue?.sixClubsRelationship ?? SixClubsRelationship.NONE,
    eventsPerMonth: editVenue?.eventsPerMonth?.toString() ?? "",
    approximateAttendance: editVenue?.approximateAttendance?.toString() ?? "",
    vendingPlacementStatus:
      editVenue?.vendingPlacementStatus ?? VendingPlacementStatus.NOT_CONTACTED,
    nextAction: editVenue?.nextAction ?? "",
    nextActionDate: editVenue?.nextActionDate?.split("T")[0] ?? undefined,
    ...dealFromRecord(editVenue),
    notes: editVenue?.notes ?? undefined,
  };
}

function VenueFormContent({ editVenue, onClose }: VenueFormContentProps) {
  const isEdit = !!editVenue;
  const createVenue = useCreateVenue();
  const updateVenue = useUpdateVenue();
  const { data: countries = [] } = useCountries();

  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState<"search" | "form">(isEdit ? "form" : "search");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VenueFormInput>({
    resolver: zodResolver(venueFormSchema),
    defaultValues: buildDefaults(editVenue),
  });

  const countryId = watch("countryId");
  const stateId = watch("stateId");
  const { data: states = [] } = useStates(countryId || undefined);
  const [citySearch, setCitySearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const { data: searchedCities = [], isFetching: citiesSearching } = useSearchCities(citySearch, {
    stateId: stateId || undefined,
    countryId: countryId || undefined,
  });
  const citySource = useMemo(() => {
    const cities = [...searchedCities];
    if (selectedCity && !cities.some((city) => city.id === selectedCity.id)) {
      cities.unshift(selectedCity);
    }
    return cities;
  }, [searchedCities, selectedCity]);
  const cityOptions = useMemo(() => toCityOptions(citySource), [citySource]);
  const { data: searchResults = [] } = useSearchVenues(searchQuery);

  useEffect(() => {
    if (!editVenue?.city) return;
    setSelectedCity({
      id: editVenue.city.id,
      name: editVenue.city.name,
      stateId: editVenue.stateId,
      state: {
        id: editVenue.state.id,
        name: editVenue.state.name,
        country: { id: editVenue.country.id, name: editVenue.country.name },
      },
    });
  }, [editVenue]);

  function applyCitySelection(option: SearchableSelectOption) {
    const city =
      searchedCities.find((item) => item.id === option.value) ??
      (selectedCity?.id === option.value ? selectedCity : null);

    if (city) {
      setSelectedCity(city);
      setValue("cityId", city.id, { shouldValidate: true });
      setValue("stateId", city.stateId, { shouldValidate: true });
      const nextCountryId = city.state?.country?.id;
      if (nextCountryId) {
        setValue("countryId", nextCountryId, { shouldValidate: true });
      }
      return;
    }

    if (option.meta?.stateId) {
      setValue("cityId", option.value, { shouldValidate: true });
      setValue("stateId", option.meta.stateId, { shouldValidate: true });
      if (option.meta.countryId) {
        setValue("countryId", option.meta.countryId, { shouldValidate: true });
      }
    }
  }

  const deal = watch("deal");
  const rentAmount = watch("rentAmount");
  const revenue = watch("revenue");

  async function onSubmit(data: VenueFormInput) {
    try {
      if (isEdit && editVenue) {
        await updateVenue.mutateAsync({
          id: editVenue.id,
          data: toUpdateVenuePayload(data),
        });
        toast.success("Venue updated");
      } else {
        await createVenue.mutateAsync(toCreateVenuePayload(data));
        toast.success("Venue created");
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  const normalizedSearch = normalizeEventName(searchQuery);
  const exactMatch = searchResults.some(
    (venue: Venue) => normalizeEventName(venue.name) === normalizedSearch
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Venue" : "Add 6ixClubs Venue"}</DialogTitle>
        {!isEdit && (
          <DialogDescription>
            Search first, then add a venue 6ixClubs is bringing to Luxe Dispense.
          </DialogDescription>
        )}
      </DialogHeader>

      {!isEdit && step === "search" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Search Venue Name</Label>
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type venue name to search..."
            />
          </div>

          {searchQuery.length >= 2 && searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Matching venues:</p>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-2">
                {searchResults.map((venue: Venue) => (
                  <div key={venue.id} className="flex items-center justify-between text-sm">
                    <span>{venue.name}</span>
                    <Badge variant="secondary">
                      {venue.city?.name ?? `${venue.state.name}, ${venue.country.name}`}
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
              setValue("name", searchQuery.trim(), { shouldValidate: true });
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
            <Label htmlFor="name">Venue Name</Label>
            <Input
              id="name"
              {...register("name")}
              readOnly={!isEdit}
              className={!isEdit ? "bg-muted" : undefined}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium">Location</p>

            <div className="space-y-2">
              <Label>City</Label>
              <Controller
                name="cityId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    onOptionSelect={applyCitySelection}
                    invalid={!!errors.cityId}
                    placeholder="Search city"
                    searchPlaceholder="Search cities…"
                    emptyMessage="No cities match your search."
                    typeToSearchMessage="Type at least 2 characters to search cities."
                    options={cityOptions}
                    serverSearch
                    minSearchLength={2}
                    onSearchChange={setCitySearch}
                    isSearching={citiesSearching}
                  />
                )}
              />
              {errors.cityId && (
                <p className="text-sm text-destructive">{errors.cityId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                      <SelectTrigger
                        className={cn(errors.countryId && "border-destructive focus:ring-destructive")}
                        aria-invalid={!!errors.countryId}
                      >
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
              </div>
              <div className="space-y-2">
                <Label>Province/State</Label>
                <Controller
                  name="stateId"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        if (selectedCity?.stateId !== v) {
                          setValue("cityId", "");
                          setSelectedCity(null);
                        }
                      }}
                      disabled={!countryId}
                      invalid={!!errors.stateId}
                      placeholder="Search province/state"
                      searchPlaceholder="Search provinces…"
                      emptyMessage="No provinces match your search."
                      options={states.map((state) => ({
                        value: state.id,
                        label: state.name,
                      }))}
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (optional)</Label>
              <Input id="address" {...register("address")} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Venue Type</Label>
              <Controller
                name="venueType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(VenueType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {VENUE_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>6ixClubs Relationship</Label>
              <Controller
                name="sixClubsRelationship"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SixClubsRelationship).map((rel) => (
                        <SelectItem key={rel} value={rel}>
                          {SIXCLUBS_RELATIONSHIP_LABELS[rel]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-md border p-4">
            <p className="text-sm font-medium">Decision-Maker / Contact</p>
            <div className="space-y-2">
              <Label htmlFor="decisionMakerName">Name</Label>
              <Input id="decisionMakerName" {...register("decisionMakerName")} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="decisionMakerEmail">Email</Label>
                <Input id="decisionMakerEmail" type="email" {...register("decisionMakerEmail")} />
                {errors.decisionMakerEmail && (
                  <p className="text-sm text-destructive">{errors.decisionMakerEmail.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="decisionMakerPhone">Phone</Label>
                <Input id="decisionMakerPhone" type="tel" {...register("decisionMakerPhone")} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="eventsPerMonth">Events per Month</Label>
              <Input
                id="eventsPerMonth"
                type="number"
                min={1}
                {...register("eventsPerMonth")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approximateAttendance">Approximate Attendance</Label>
              <Input
                id="approximateAttendance"
                type="number"
                min={1}
                {...register("approximateAttendance")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Vending Placement Status</Label>
            <Controller
              name="vendingPlacementStatus"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(VendingPlacementStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {VENDING_PLACEMENT_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-4 rounded-md border p-4">
            <p className="text-sm font-medium">Next Action</p>
            <div className="space-y-2">
              <Label htmlFor="nextAction">Action</Label>
              <Input
                id="nextAction"
                placeholder="e.g. Call decision-maker, send proposal..."
                {...register("nextAction")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextActionDate">Due Date</Label>
              <Input id="nextActionDate" type="date" {...register("nextActionDate")} />
            </div>
          </div>

          <CompensationFields
            register={register}
            control={control}
            deal={deal}
            rentAmount={rentAmount}
            revenue={revenue}
            errors={errors}
            showSixClubCommission
          />

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
              loading={isSubmitting || createVenue.isPending || updateVenue.isPending}
            >
              {isEdit ? "Update Venue" : "Create Venue"}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}

export function VenueFormDialog({ editVenue }: VenueFormDialogProps) {
  const { venueModalOpen, setVenueModalOpen, setSelectedVenueId } = useUIStore();

  function handleClose(open: boolean) {
    setVenueModalOpen(open);
    if (!open) setSelectedVenueId(null);
  }

  return (
    <Dialog open={venueModalOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {venueModalOpen && (
          <VenueFormContent
            key={editVenue?.id ?? "new"}
            editVenue={editVenue}
            onClose={() => handleClose(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
