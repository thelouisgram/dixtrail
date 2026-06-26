"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCountries,
  useStates,
  useCreateCountry,
  useCreateState,
  useDeleteCountry,
} from "@/hooks/use-countries";
import {
  createCountrySchema,
  createStateSchema,
  type CreateCountryInput,
  type CreateStateInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function TerritoriesPageClient() {
  const { data: countries = [], isError, refetch } = useCountries();
  const [viewCountryId, setViewCountryId] = useState("");
  const { data: states = [] } = useStates(viewCountryId || undefined);
  const createCountry = useCreateCountry();
  const createState = useCreateState();
  const deleteCountry = useDeleteCountry();
  const { requestDelete, ConfirmDeleteDialog } = useConfirmDelete();

  const countryForm = useForm<CreateCountryInput>({
    resolver: zodResolver(createCountrySchema),
    defaultValues: { name: "" },
  });

  const stateForm = useForm<CreateStateInput>({
    resolver: zodResolver(createStateSchema),
    defaultValues: { name: "", countryId: "" },
  });

  const stateCountryId = stateForm.watch("countryId");

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
      toast.success("State created");
      stateForm.reset({ name: "", countryId: data.countryId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create state");
    }
  }

  function handleDeleteCountry(id: string, name: string, locationCount: number) {
    if (locationCount > 0) {
      toast.error(`Cannot delete "${name}": ${locationCount} location(s) still use it.`);
      return;
    }
    requestDelete({
      title: "Delete country",
      description: `Delete "${name}" and all its states? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteCountry.mutateAsync(id);
          if (viewCountryId === id) setViewCountryId("");
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

  return (
    <QueryPageError isError={isError} refetch={refetch}>
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Territories</h1>
        <p className="text-muted-foreground">Manage countries and states for location assignment</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Country</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={countryForm.handleSubmit(onCreateCountry)}
              className="flex gap-2"
            >
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
            <CardTitle className="text-base">Add State</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={stateForm.handleSubmit(onCreateState)} className="space-y-3">
              <div className="space-y-2">
                <Label>Country</Label>
                <Controller
                  name="countryId"
                  control={stateForm.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
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
                {stateForm.formState.errors.countryId && (
                  <p className="text-sm text-destructive">
                    {stateForm.formState.errors.countryId.message}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="State name"
                    disabled={!stateCountryId}
                    {...stateForm.register("name")}
                  />
                  {stateForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {stateForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  loading={createState.isPending}
                  disabled={!stateCountryId}
                >
                  Add
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Territory Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          {countries.length === 0 ? (
            <p className="text-muted-foreground">No countries yet. Add one above.</p>
          ) : (
            <div className="space-y-4">
              {countries.map((country) => (
                <div key={country.id} className="rounded-md border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{country.name}</h3>
                      <span className="text-sm text-muted-foreground">
                        {country._count?.states ?? 0} states · {country._count?.locations ?? 0} locations
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() =>
                          setViewCountryId(viewCountryId === country.id ? "" : country.id)
                        }
                      >
                        {viewCountryId === country.id ? "Hide states" : "View states"}
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
                    states.length > 0 ? (
                      <ul className="mt-3 space-y-1 border-t pt-3">
                        {states.map((state) => (
                          <li key={state.id} className="flex justify-between text-sm">
                            <span>{state.name}</span>
                            <span className="text-muted-foreground">
                              {state._count?.locations ?? 0} locations
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">
                        No states in this country yet.
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
