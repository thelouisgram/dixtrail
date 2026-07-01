"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCountries,
  useStates,
  useSearchCities,
  useCreateCountry,
  useCreateState,
  useCreateCity,
  useDeleteCountry,
  useDeleteCity,
} from "@/hooks/use-countries";
import {
  createCountrySchema,
  createStateSchema,
  createCitySchema,
  type CreateCountryInput,
  type CreateStateInput,
  type CreateCityInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog";
import { QueryPageError } from "@/components/ui/query-page-error";
import {
  CompactListPlaceholder,
  EmptyState,
  isInitialQueryLoad,
  isKeyedQueryLoading,
  LOADING_SURFACE_CLASS,
  TerritoriesListPlaceholder,
} from "@/components/ui/cute-placeholder";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

export function TerritoriesPageClient() {
  const { data: countries, isError, refetch, isPending } = useCountries();
  const countryList = countries ?? [];
  const isFirstLoad = isInitialQueryLoad(isPending, countries);
  const [viewCountryId, setViewCountryId] = useState("");
  const [viewStateId, setViewStateId] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const { data: states = [], isPending: statesPending } = useStates(viewCountryId || undefined);
  const { data: searchedCities = [], isFetching: citiesSearching } = useSearchCities(citySearch, {
    stateId: viewStateId || undefined,
    enabled: !!viewStateId,
  });
  const statesLoading = isKeyedQueryLoading(!!viewCountryId, statesPending, states);
  const citiesLoading = citiesSearching;
  const createCountry = useCreateCountry();
  const createState = useCreateState();
  const createCity = useCreateCity();
  const deleteCountry = useDeleteCountry();
  const deleteCity = useDeleteCity();
  const { requestDelete, ConfirmDeleteDialog } = useConfirmDelete();

  const countryForm = useForm<CreateCountryInput>({
    resolver: zodResolver(createCountrySchema),
    defaultValues: { name: "" },
  });

  const stateForm = useForm<CreateStateInput>({
    resolver: zodResolver(createStateSchema),
    defaultValues: { name: "", countryId: "" },
  });

  const cityForm = useForm<CreateCityInput>({
    resolver: zodResolver(createCitySchema),
    defaultValues: { name: "", stateId: "" },
  });

  const stateCountryId = stateForm.watch("countryId");
  const cityStateId = cityForm.watch("stateId");
  const [cityFormCountryId, setCityFormCountryId] = useState("");
  const { data: cityFormStates = [] } = useStates(cityFormCountryId || undefined);

  async function onCreateCountry(data: CreateCountryInput) {
    try {
      await createCountry.mutateAsync(data.name);
      toast.success("Country created");
      countryForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create country");
    }
  }

  async function onCreateState(data: CreateStateInput) {
    try {
      await createState.mutateAsync(data);
      toast.success("Province/State created");
      stateForm.reset({ name: "", countryId: data.countryId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create province/state");
    }
  }

  async function onCreateCity(data: CreateCityInput) {
    try {
      await createCity.mutateAsync(data);
      toast.success("City created");
      cityForm.reset({ name: "", stateId: data.stateId });
      if (viewStateId === data.stateId) {
        setViewStateId(data.stateId);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create city");
    }
  }

  function handleDeleteCountry(id: string, name: string, locationCount: number) {
    if (locationCount > 0) {
      toast.error(`Cannot delete "${name}": ${locationCount} location(s) still use it.`);
      return;
    }
    requestDelete({
      title: "Delete country",
      description: `Delete "${name}" and all its provinces/states and cities? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteCountry.mutateAsync(id);
          if (viewCountryId === id) {
            setViewCountryId("");
            setViewStateId("");
          }
          if (stateForm.getValues("countryId") === id) {
            stateForm.setValue("countryId", "");
          }
          toast.success("Country deleted");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to delete country");
          throw error;
        }
      },
    });
  }

  function handleDeleteCity(id: string, name: string, stateId: string) {
    requestDelete({
      title: "Delete city",
      description: `Delete "${name}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteCity.mutateAsync({ id, stateId });
          toast.success("City deleted");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to delete city");
          throw error;
        }
      },
    });
  }

  return (
    <QueryPageError isError={isError} refetch={refetch}>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Territories"
          description="Manage countries, provinces/states, and cities for location assignment"
          loadingDescription="Mapping out territories…"
          isLoading={isFirstLoad}
        />

        <div className="grid animate-fade-in-up gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Country</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={countryForm.handleSubmit(onCreateCountry)} className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Input placeholder="Country name" {...countryForm.register("name")} />
                  {countryForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {countryForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <Button type="submit" loading={createCountry.isPending}>
                  Add
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Province/State</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={stateForm.handleSubmit(onCreateState)} className="space-y-3">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Controller
                    name="countryId"
                    control={stateForm.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countryList.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="Province/State name"
                      disabled={!stateCountryId}
                      {...stateForm.register("name")}
                    />
                  </div>
                  <Button type="submit" loading={createState.isPending} disabled={!stateCountryId}>
                    Add
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add City</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={cityForm.handleSubmit(onCreateCity)} className="space-y-3">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select
                    value={cityFormCountryId}
                    onValueChange={(v) => {
                      setCityFormCountryId(v);
                      cityForm.setValue("stateId", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Province/State</Label>
                  <Controller
                    name="stateId"
                    control={cityForm.control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!cityFormCountryId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select province/state" />
                        </SelectTrigger>
                        <SelectContent>
                          {cityFormStates.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="City name"
                      disabled={!cityStateId}
                      {...cityForm.register("name")}
                    />
                  </div>
                  <Button type="submit" loading={createCity.isPending} disabled={!cityStateId}>
                    Add
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className={cn(isFirstLoad && LOADING_SURFACE_CLASS, "animate-fade-in-up")}>
          <CardHeader>
            <CardTitle className="text-base">Territory Hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            {isFirstLoad ? (
              <TerritoriesListPlaceholder />
            ) : countryList.length === 0 ? (
              <p className="text-muted-foreground">No countries yet. Add one above.</p>
            ) : (
              <div className="space-y-4">
                {countryList.map((country, index) => (
                  <div
                    key={country.id}
                    className="animate-fade-in-up rounded-md border p-4"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{country.name}</h3>
                        <span className="text-sm text-muted-foreground">
                          {country._count?.states ?? 0} provinces/states · {country._count?.locations ?? 0} locations
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => {
                            const next = viewCountryId === country.id ? "" : country.id;
                            setViewCountryId(next);
                            setViewStateId("");
                          }}
                        >
                          {viewCountryId === country.id ? "Hide" : "View"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={deleteCountry.isPending}
                          onClick={() =>
                            handleDeleteCountry(
                              country.id,
                              country.name,
                              country._count?.locations ?? 0
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {viewCountryId === country.id && (
                      statesLoading ? (
                        <CompactListPlaceholder rows={3} />
                      ) : states.length > 0 ? (
                        <ul className="mt-3 space-y-2 border-t pt-3">
                          {states.map((state) => (
                            <li key={state.id} className="rounded-md border p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-medium">{state.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {state._count?.cities ?? 0} cities · {state._count?.locations ?? 0} locations
                                  </p>
                                </div>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0"
                                  onClick={() => {
                                    const next = viewStateId === state.id ? "" : state.id;
                                    setViewStateId(next);
                                    setCitySearch("");
                                  }}
                                >
                                  {viewStateId === state.id ? "Hide cities" : "View cities"}
                                </Button>
                              </div>
                              {viewStateId === state.id && (
                                <div className="mt-2 space-y-2 border-t pt-2">
                                  <SearchInput
                                    value={citySearch}
                                    onChange={(e) => setCitySearch(e.target.value)}
                                    placeholder="Search cities in this province…"
                                  />
                                  {citiesLoading && citySearch.trim().length >= 2 && (
                                    <CompactListPlaceholder rows={3} />
                                  )}
                                  {!citiesLoading && citySearch.trim().length < 2 && (
                                    <p className="px-1 text-xs text-muted-foreground">
                                      Type at least 2 characters to find cities ({state._count?.cities ?? 0}{" "}
                                      total).
                                    </p>
                                  )}
                                  {!citiesLoading &&
                                    citySearch.trim().length >= 2 &&
                                    searchedCities.length === 0 && (
                                      <p className="px-1 text-xs text-muted-foreground">No cities match.</p>
                                    )}
                                  {searchedCities.length > 0 && (
                                    <ul className="space-y-1">
                                      {searchedCities.map((city) => (
                                        <li
                                          key={city.id}
                                          className="flex items-center justify-between text-sm"
                                        >
                                          <span>{city.name}</span>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            disabled={deleteCity.isPending}
                                            onClick={() =>
                                              handleDeleteCity(city.id, city.name, state.id)
                                            }
                                          >
                                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                          </Button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">
                          No provinces/states in this country yet.
                        </p>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {ConfirmDeleteDialog}
      </div>
    </QueryPageError>
  );
}
